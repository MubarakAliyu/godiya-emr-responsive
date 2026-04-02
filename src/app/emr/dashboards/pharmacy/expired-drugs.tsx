import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Calendar, CalendarClock, CheckCircle2, Clock, DollarSign, Download, Eye, FileSpreadsheet, FileText, Filter, Hash, Minus, Package, PackageX, Printer, RotateCcw, Search, Trash2, TrendingDown, TrendingUp, X, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Separator } from '@/app/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface KPICardProps {
  title: string;
  value: number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  tooltip?: string;
  prefix?: string;
}

interface ExpiredDrug {
  id: string;
  drugId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  expiryDate: string;
  supplier: string;
  batchNumber: string;
  costPrice: number;
  status: 'Expired' | 'Expiring Soon' | 'Disposed';
  disposalMethod?: string;
  disposalNotes?: string;
  disposedAt?: string;
}

const mockExpiredDrugs: ExpiredDrug[] = []; // Replaced by API calls

// Chart data - Expired drugs per month
// chartData is now computed from live drugs inside the component

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip, prefix = '' }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const numericValue = typeof value === 'number' ? value : 0;
    const duration = 1000;
    const increment = numericValue / (duration / 16);

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(startValue));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-foreground">
                      {prefix}{displayValue.toLocaleString()}
                    </h3>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: color === 'primary' ? '#1e40af15' : color === 'secondary' ? '#05966915' : color === 'warning' ? '#f5900b15' : '#dc262615'
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{
                        color: color === 'primary' ? '#1e40af' : color === 'secondary' ? '#059669' : color === 'warning' ? '#f59e0b' : '#dc2626'
                      }}
                    />
                  </div>
                </div>
                {trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span>{trendValue}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function ExpiredDrugsPanel() {
  const { addNotification } = useEMRStore();

  // State
  const [drugs, setDrugs] = useState<ExpiredDrug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expiryFrom, setExpiryFrom] = useState('');
  const [expiryTo, setExpiryTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // API base URL
  const API_URL = '/api/drugs.php';

  // Fetch drugs from API
  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}`);
      if (!response.ok) throw new Error('Failed to fetch drugs');
      const data = await response.json();

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const expiredMapped: ExpiredDrug[] = data
        .filter((d: any) => {
          const expiry = new Date(d.expiry_date);
          return expiry <= thirtyDaysFromNow; // Both expired and expiring soon
        })
        .map((d: any) => {
          const expiry = new Date(d.expiry_date);
          let status: ExpiredDrug['status'] = 'Expired';
          if (expiry > now) status = 'Expiring Soon';

          return {
            id: d.drug_id,
            drugId: `D-${String(d.drug_id).padStart(3, '0')}`,
            name: d.drug_name,
            category: 'General',
            price: parseFloat(d.drug_price),
            quantity: parseInt(d.drug_qty),
            expiryDate: d.expiry_date,
            supplier: 'Unknown',
            batchNumber: `BATCH-${d.drug_id}`,
            costPrice: parseFloat(d.drug_price) * 0.7,
            status: status
          };
        });

      setDrugs(expiredMapped);
    } catch (error) {
      console.error('Error fetching expired drugs:', error);
      toast.error('Fetch Error', {
        description: 'Could not load expired drugs data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [disposeModalOpen, setDisposeModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<ExpiredDrug | null>(null);

  // Dispose form
  const [disposalMethod, setDisposalMethod] = useState('');
  const [disposalNotes, setDisposalNotes] = useState('');
  const [quantityRemoved, setQuantityRemoved] = useState('');

  // Get unique categories
  const categories = Array.from(new Set(drugs.map(d => d.category)));

  // Calculate KPIs
  const totalExpired = drugs.filter(d => d.status === 'Expired').length;
  const expiringIn7Days = drugs.filter(d => {
    const daysUntilExpiry = Math.ceil((new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }).length;
  const expiringIn30Days = drugs.filter(d => {
    const daysUntilExpiry = Math.ceil((new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }).length;
  const disposalValue = drugs.filter(d => d.status === 'Expired' || d.status === 'Disposed').reduce((sum, d) => sum + (d.price * d.quantity), 0);

  // Compute live chart data: count drugs expiring/expired per month (last 6 months)
  const chartData = (() => {
    const now = new Date();
    const months: { month: string; expired: number; expiringSoon: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        expired: 0,
        expiringSoon: 0,
      });
    }
    drugs.forEach(drug => {
      const exp = new Date(drug.expiryDate);
      const monthLabel = exp.toLocaleString('default', { month: 'short' });
      const entry = months.find(m => m.month === monthLabel);
      if (!entry) return;
      if (drug.status === 'Expired') entry.expired++;
      else if (drug.status === 'Expiring Soon') entry.expiringSoon++;
    });
    return months;
  })();

  // Filter drugs
  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch = !searchQuery ||
      (drug.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (drug.drugId ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || drug.category === categoryFilter;

    let matchesExpiry = true;
    if (expiryFrom || expiryTo) {
      const drugExpiry = new Date(drug.expiryDate);
      if (expiryFrom) {
        matchesExpiry = matchesExpiry && drugExpiry >= new Date(expiryFrom);
      }
      if (expiryTo) {
        matchesExpiry = matchesExpiry && drugExpiry <= new Date(expiryTo);
      }
    }

    return matchesSearch && matchesCategory && matchesExpiry;
  });

  // Paginate
  const totalPages = Math.ceil(filteredDrugs.length / itemsPerPage);
  const paginatedDrugs = filteredDrugs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setExpiryFrom('');
    setExpiryTo('');
    setCurrentPage(1);
    toast.info('Filters Reset', {
      description: 'All filters have been cleared.',
    });
  };

  // Open view modal
  const openViewModal = (drug: ExpiredDrug) => {
    setSelectedDrug(drug);
    setViewModalOpen(true);
  };

  // Open dispose modal
  const openDisposeModal = (drug: ExpiredDrug) => {
    setSelectedDrug(drug);
    setDisposalMethod('');
    setDisposalNotes('');
    setQuantityRemoved(drug.quantity.toString());
    setDisposeModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (drug: ExpiredDrug) => {
    setSelectedDrug(drug);
    setDeleteDialogOpen(true);
  };

  // Handle dispose
  const handleDispose = () => {
    if (!selectedDrug || !disposalMethod || !quantityRemoved || parseInt(quantityRemoved) <= 0) {
      toast.error('Invalid Input', {
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const updatedDrugs = drugs.map(drug => {
      if (drug.id === selectedDrug.id) {
        return {
          ...drug,
          quantity: drug.quantity - parseInt(quantityRemoved),
          status: 'Disposed' as const,
          disposalMethod,
          disposalNotes,
          disposedAt: new Date().toISOString(),
        };
      }
      return drug;
    });

    // Remove if quantity is 0
    const finalDrugs = updatedDrugs.filter(d => d.quantity > 0 || d.status === 'Disposed');
    setDrugs(finalDrugs);

    toast.success('Drug Disposed', {
      description: `${quantityRemoved} units of ${selectedDrug.name} disposed successfully.`,
    });

    // Audit log notification
    addNotification({
      id: Date.now(),
      title: 'Drug Disposal - Audit Entry',
      message: `${selectedDrug.name} (${quantityRemoved} units) disposed via ${disposalMethod}`,
      type: 'warning',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'High',
    });

    setDisposeModalOpen(false);
    setDisposalMethod('');
    setDisposalNotes('');
    setQuantityRemoved('');
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedDrug) return;

    setDrugs(drugs.filter(d => d.id !== selectedDrug.id));

    toast.success('Drug Deleted', {
      description: `${selectedDrug.name} has been removed from the system.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Expired Drug Deleted',
      message: `${selectedDrug.name} removed from inventory`,
      type: 'info',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Medium',
    });

    setDeleteDialogOpen(false);
    setSelectedDrug(null);
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['Drug ID', 'Drug Name', 'Category', 'Price', 'Quantity', 'Expiry Date', 'Status', 'Supplier', 'Batch Number'];
    const csvData = filteredDrugs.map(drug => [
      drug.drugId,
      drug.name,
      drug.category,
      drug.price,
      drug.quantity,
      drug.expiryDate,
      drug.status,
      drug.supplier,
      drug.batchNumber
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expired-drugs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('CSV Exported', {
      description: `${filteredDrugs.length} records exported successfully.`,
    });
  };

  // Print report
  const handlePrintReport = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expired Drugs Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #000; }
            .report-container { max-width: 1000px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
            .header h1 { color: #1e40af; font-size: 32px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; line-height: 1.6; }
            .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px; border-radius: 4px; }
            .alert-box strong { color: #92400e; }
            .meta-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
            .meta-item { display: flex; justify-content: space-between; padding: 8px 0; }
            .meta-label { font-weight: 600; color: #333; }
            .meta-value { color: #666; }
            .drugs-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .drugs-table th { background: #1e40af; color: white; padding: 12px; text-align: left; font-size: 14px; }
            .drugs-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; color: #333; }
            .drugs-table tr:nth-child(even) { background: #f9fafb; }
            .drugs-table .text-right { text-align: right; }
            .drugs-table .text-center { text-align: center; }
            .badge-expired { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b; }
            .badge-expiring { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #fef3c7; color: #92400e; }
            .badge-disposed { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #e5e7eb; color: #374151; }
            .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee; color: #666; font-size: 12px; }
            .footer p { margin: 5px 0; }
            @media print { 
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>GODIYA HOSPITAL</h1>
              <p>Expired Drugs Report</p>
              <p>Birnin Kebbi, Kebbi State, Nigeria</p>
            </div>

            <div class="alert-box">
              <strong>⚠️ Compliance Notice:</strong> This report contains expired and expiring drugs that require proper disposal according to pharmaceutical regulations.
            </div>

            <div class="meta-info">
              <div>
                <div class="meta-item">
                  <span class="meta-label">Report Date:</span>
                  <span class="meta-value">${new Date().toLocaleDateString()}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Report Time:</span>
                  <span class="meta-value">${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Prepared By:</span>
                  <span class="meta-value">Pharmacy Department</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Total Expired Drugs:</span>
                  <span class="meta-value">${filteredDrugs.filter(d => d.status === 'Expired').length}</span>
                </div>
              </div>
              <div>
                <div class="meta-item">
                  <span class="meta-label">Expiring in 7 Days:</span>
                  <span class="meta-value">${expiringIn7Days}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Expiring in 30 Days:</span>
                  <span class="meta-value">${expiringIn30Days}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Disposal Value:</span>
                  <span class="meta-value">₦${disposalValue.toLocaleString()}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Total Records:</span>
                  <span class="meta-value">${filteredDrugs.length}</span>
                </div>
              </div>
            </div>

            <table class="drugs-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Drug ID</th>
                  <th>Drug Name</th>
                  <th>Category</th>
                  <th class="text-center">Quantity</th>
                  <th>Expiry Date</th>
                  <th>Batch Number</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredDrugs.map((drug, idx) => {
      const daysUntilExpiry = Math.ceil((new Date(drug.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td>${drug.drugId}</td>
                      <td><strong>${drug.name}</strong></td>
                      <td>${drug.category}</td>
                      <td class="text-center"><strong>${drug.quantity}</strong></td>
                      <td>${new Date(drug.expiryDate).toLocaleDateString()}<br><small style="color: #666;">${daysUntilExpiry < 0 ? 'Expired ' + Math.abs(daysUntilExpiry) + ' days ago' : 'Expires in ' + daysUntilExpiry + ' days'}</small></td>
                      <td>${drug.batchNumber}</td>
                      <td class="text-center">
                        <span class="${drug.status === 'Expired' ? 'badge-expired' : drug.status === 'Disposed' ? 'badge-disposed' : 'badge-expiring'}">
                          ${drug.status}
                        </span>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p><strong>GODIYA HOSPITAL - Pharmacy Department</strong></p>
              <p>This is a computer-generated report for compliance and audit purposes.</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    if (frameDoc) {
      const doc = frameDoc.document || frameDoc;
      doc.open();
      doc.write(reportHTML);
      doc.close();

      setTimeout(() => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          }

          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);

          toast.success('Report Printing', {
            description: 'Expired drugs report sent to printer',
          });

          addNotification({
            id: Date.now(),
            title: 'Compliance Report Printed',
            message: 'Expired Drugs Report generated for audit',
            type: 'info',
            status: 'Unread',
            timestamp: new Date().toISOString(),
            priority: 'Medium',
          });
        } catch (error) {
          toast.error('Print Error', {
            description: 'Unable to print report. Please try again.',
          });
        }
      }, 500);
    }
  };

  // Get status badge
  const getStatusBadge = (drug: ExpiredDrug) => {
    const daysUntilExpiry = Math.ceil((new Date(drug.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (drug.status === 'Disposed') {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Disposed
        </Badge>
      );
    }

    if (daysUntilExpiry < 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Expiring Soon
      </Badge>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Expired Drugs</h1>
          <p className="text-muted-foreground">Compliance, safety and audit control</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button variant="outline" onClick={exportAsCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Expired"
          value={totalExpired}
          icon={XCircle}
          trend="up"
          trendValue="Requires disposal"
          color="danger"
          tooltip="Total expired drugs"
        />
        <KPICard
          title="Expiring in 7 Days"
          value={expiringIn7Days}
          icon={Clock}
          trend="neutral"
          trendValue="Urgent attention"
          color="warning"
          tooltip="Drugs expiring within 7 days"
        />
        <KPICard
          title="Expiring in 30 Days"
          value={expiringIn30Days}
          icon={Calendar}
          trend="neutral"
          trendValue="Monitor closely"
          color="warning"
          tooltip="Drugs expiring within 30 days"
        />
        <KPICard
          title="Disposal Value"
          value={disposalValue}
          icon={DollarSign}
          trend="neutral"
          trendValue="Total value at risk"
          color="primary"
          tooltip="Total value of expired/expiring drugs"
          prefix="₦"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Expired Drugs Trend
          </CardTitle>
          <CardDescription>Monthly expiration analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" allowDecimals={false} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="expired" fill="#dc2626" name="Expired" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expiringSoon" fill="#f59e0b" name="Expiring Soon" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </CardTitle>
          <CardDescription>Search and filter expired drugs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">Search Drug</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Category</Label>
              <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Expiry Date From</Label>
              <Input
                type="date"
                value={expiryFrom}
                onChange={(e) => {
                  setExpiryFrom(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <Label className="mb-2 block">Expiry Date To</Label>
            <Input
              type="date"
              value={expiryTo}
              onChange={(e) => {
                setExpiryTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-1/3"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expired Drugs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Expired & Expiring Drugs</CardTitle>
              <CardDescription>
                Showing {paginatedDrugs.length} of {filteredDrugs.length} drugs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Drug ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Drug Name</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-muted-foreground">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Expiry Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedDrugs.map((drug, index) => {
                    const daysUntilExpiry = Math.ceil((new Date(drug.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <motion.tr
                        key={drug.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold text-sm text-primary">{drug.drugId}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-sm">{drug.name}</p>
                            <p className="text-xs text-muted-foreground">{drug.category}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                              {drug.quantity} units
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-semibold">{new Date(drug.expiryDate).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {daysUntilExpiry < 0
                                ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                                : `Expires in ${daysUntilExpiry} days`
                              }
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(drug)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openViewModal(drug)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {drug.status !== 'Disposed' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                      onClick={() => openDisposeModal(drug)}
                                    >
                                      <PackageX className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Dispose Drug</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openDeleteDialog(drug)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Drug</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {paginatedDrugs.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground mb-2">No expired drugs found</p>
                <p className="text-sm text-muted-foreground">All drugs are within expiry date or try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {filteredDrugs.length} total records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Drug Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Package className="w-6 h-6 text-primary" />
              Drug Details
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete expired drug information
            </DialogDescription>
          </DialogHeader>

          {selectedDrug && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Drug ID</Label>
                      <p className="font-semibold text-primary">{selectedDrug.drugId}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Drug Name</Label>
                      <p className="font-semibold">{selectedDrug.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <Badge variant="outline">{selectedDrug.category}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Selling Price</Label>
                        <p className="font-bold text-sm text-primary">₦{selectedDrug.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Cost Price</Label>
                        <p className="font-semibold text-sm">₦{selectedDrug.costPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Stock & Expiry Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Current Quantity</Label>
                      <p className="font-bold text-2xl text-primary">{selectedDrug.quantity} units</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                      <p className="font-semibold">{new Date(selectedDrug.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Days Until/Since Expiry</Label>
                      <p className="font-semibold text-sm">
                        {(() => {
                          const days = Math.ceil((new Date(selectedDrug.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return days < 0 ? `Expired ${Math.abs(days)} days ago` : `Expires in ${days} days`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div>{getStatusBadge(selectedDrug)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Supplier & Batch Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Supplier</Label>
                      <p className="font-semibold">{selectedDrug.supplier}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Batch Number</Label>
                      <p className="font-semibold">{selectedDrug.batchNumber}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Value</Label>
                      <p className="font-bold text-primary">₦{(selectedDrug.price * selectedDrug.quantity).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Cost Value</Label>
                      <p className="font-semibold">₦{(selectedDrug.costPrice * selectedDrug.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedDrug.status === 'Disposed' && (
                <Card className="border-2 border-orange-200 bg-orange-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-orange-800">Disposal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Disposal Method</Label>
                      <p className="font-semibold">{selectedDrug.disposalMethod}</p>
                    </div>
                    {selectedDrug.disposalNotes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Notes</Label>
                        <p className="text-sm">{selectedDrug.disposalNotes}</p>
                      </div>
                    )}
                    {selectedDrug.disposedAt && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Disposed At</Label>
                        <p className="font-semibold text-sm">{new Date(selectedDrug.disposedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            {selectedDrug && selectedDrug.status !== 'Disposed' && (
              <Button
                onClick={() => {
                  setViewModalOpen(false);
                  openDisposeModal(selectedDrug);
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <PackageX className="w-4 h-4 mr-2" />
                Dispose Drug
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispose Drug Modal */}
      <Dialog open={disposeModalOpen} onOpenChange={setDisposeModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <PackageX className="w-6 h-6 text-orange-600" />
              Dispose Expired Drug
            </DialogTitle>
            <DialogDescription className="text-base">
              Record disposal of {selectedDrug?.name} - This action will be logged for audit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedDrug && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Drug Name</Label>
                      <p className="font-semibold text-sm">{selectedDrug.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Available Quantity</Label>
                      <p className="font-bold text-lg text-primary">{selectedDrug.quantity} units</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Value</Label>
                      <p className="font-bold text-sm text-orange-700">₦{(selectedDrug.price * selectedDrug.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Disposal Method *</Label>
                <Select value={disposalMethod} onValueChange={setDisposalMethod}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select disposal method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Incineration">Incineration</SelectItem>
                    <SelectItem value="Chemical Treatment">Chemical Treatment</SelectItem>
                    <SelectItem value="Landfill">Authorized Landfill</SelectItem>
                    <SelectItem value="Return to Supplier">Return to Supplier</SelectItem>
                    <SelectItem value="Pharmaceutical Waste Disposal">Pharmaceutical Waste Disposal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Quantity to Dispose *</Label>
                <Input
                  type="number"
                  value={quantityRemoved}
                  onChange={(e) => setQuantityRemoved(e.target.value)}
                  placeholder="Enter quantity"
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Disposal Notes</Label>
              <Textarea
                value={disposalNotes}
                onChange={(e) => setDisposalNotes(e.target.value)}
                placeholder="Enter any additional notes about the disposal process..."
                rows={4}
                className="resize-none"
              />
            </div>

            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-orange-800">Audit & Compliance Notice</p>
                    <p className="text-xs text-orange-700">
                      This disposal action will be recorded in the audit log for regulatory compliance.
                      Ensure all disposal procedures follow pharmaceutical waste management guidelines.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDisposeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDispose} className="bg-orange-600 hover:bg-orange-700">
              <PackageX className="w-4 h-4 mr-2" />
              Confirm Disposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Delete Expired Drug
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <strong>{selectedDrug?.name}</strong>? This action cannot be undone and will permanently remove this drug from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Drug
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
