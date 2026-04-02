import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Search,
  Download,
  Filter,
  FileText,
  DollarSign,
  Package,
  Clock,
  Edit,
  Trash2,
  PackagePlus,
  Printer,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Building2,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
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

interface KPICardProps {
  title: string;
  value: number | string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  tooltip?: string;
  prefix?: string;
  isTime?: boolean;
}

interface Drug {
  id: string;
  drugId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  reorderLevel: number;
  expiryDate: string;
  supplier: string;
  batchNumber: string;
  costPrice: number;
}

const mockLowStockDrugs: Drug[] = []; // Replaced by API calls

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip, prefix = '', isTime = false }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isTime || typeof value === 'string') {
      return;
    }

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
  }, [value, isTime]);

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
                      {isTime || typeof value === 'string'
                        ? value
                        : `${prefix}${displayValue.toLocaleString()}`
                      }
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

export function LowStocksPanel() {
  const { addNotification } = useEMRStore();

  // State
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [expiryFrom, setExpiryFrom] = useState('');
  const [expiryTo, setExpiryTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // API base URL
  const API_URL = '/api/drugs.php';

  // Fetch drugs from API
  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}`);
      if (!response.ok) throw new Error('Failed to fetch drugs');
      const data = await response.json();

      const DEFAULT_REORDER_LEVEL = 10;

      const lowStockMapped: Drug[] = data
        .filter((d: any) => parseInt(d.drug_qty) > 0 && parseInt(d.drug_qty) < DEFAULT_REORDER_LEVEL)
        .map((d: any) => ({
          id: d.drug_id,
          drugId: `D-${String(d.drug_id).padStart(3, '0')}`,
          name: d.drug_name,
          category: 'General',
          price: parseFloat(d.drug_price),
          quantity: parseInt(d.drug_qty),
          reorderLevel: DEFAULT_REORDER_LEVEL,
          expiryDate: d.expiry_date,
          supplier: 'Unknown',
          batchNumber: `BATCH-${d.drug_id}`,
          costPrice: parseFloat(d.drug_price) * 0.7, // Estimate cost price
        }));

      setDrugs(lowStockMapped);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching low stock drugs:', error);
      toast.error('Fetch Error', {
        description: 'Could not load inventory data.',
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  // Restock form
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockBatch, setRestockBatch] = useState('');
  const [restockExpiry, setRestockExpiry] = useState('');
  const [restockCost, setRestockCost] = useState('');

  // Edit form
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editReorderLevel, setEditReorderLevel] = useState('');

  // Get unique suppliers
  const suppliers = Array.from(new Set(drugs.map(d => d.supplier)));

  // Calculate KPIs
  const totalLowStockDrugs = drugs.length;
  const criticalDrugs = drugs.filter(d => d.quantity < 5).length;
  const valueAtRisk = drugs.reduce((sum, d) => sum + (d.price * d.quantity), 0);

  // Filter drugs
  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch = drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.drugId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = supplierFilter === 'all' || drug.supplier === supplierFilter;

    let matchesQuantity = true;
    if (minQuantity) {
      matchesQuantity = matchesQuantity && drug.quantity >= parseInt(minQuantity);
    }
    if (maxQuantity) {
      matchesQuantity = matchesQuantity && drug.quantity <= parseInt(maxQuantity);
    }

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

    return matchesSearch && matchesSupplier && matchesQuantity && matchesExpiry;
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
    setSupplierFilter('all');
    setMinQuantity('');
    setMaxQuantity('');
    setExpiryFrom('');
    setExpiryTo('');
    setCurrentPage(1);
    toast.info('Filters Reset', {
      description: 'All filters have been cleared.',
    });
  };

  // Open view modal
  const openViewModal = (drug: Drug) => {
    setSelectedDrug(drug);
    setViewModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (drug: Drug) => {
    setSelectedDrug(drug);
    setEditName(drug.name);
    setEditCategory(drug.category);
    setEditPrice(drug.price.toString());
    setEditReorderLevel(drug.reorderLevel.toString());
    setEditModalOpen(true);
  };

  // Open restock modal
  const openRestockModal = (drug: Drug) => {
    setSelectedDrug(drug);
    setRestockSupplier(drug.supplier);
    setRestockQuantity('');
    setRestockBatch('');
    setRestockExpiry('');
    setRestockCost('');
    setRestockModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (drug: Drug) => {
    setSelectedDrug(drug);
    setDeleteDialogOpen(true);
  };

  // Handle restock
  const handleRestock = async () => {
    if (!selectedDrug || !restockQuantity || parseInt(restockQuantity) <= 0) {
      toast.error('Invalid Input', {
        description: 'Please enter a valid quantity to restock.',
      });
      return;
    }

    try {
      const newTotalQty = selectedDrug.quantity + parseInt(restockQuantity);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_drug',
          drug_id: selectedDrug.id,
          drug_qty: newTotalQty,
          performerId: 'System'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Drug Restocked Successfully', {
          description: `Added ${restockQuantity} units to ${selectedDrug.name}. New quantity: ${newTotalQty}`,
        });
        setRestockModalOpen(false);
        fetchDrugs();
      } else {
        throw new Error(result.error || 'Failed to restock drug');
      }
    } catch (error: any) {
      toast.error('Restock Error', {
        description: error.message,
      });
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (!selectedDrug || !editName || !editPrice) {
      toast.error('Invalid Input', {
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const updatedDrugs = drugs.map(drug => {
      if (drug.id === selectedDrug.id) {
        return {
          ...drug,
          name: editName,
          category: editCategory,
          price: parseFloat(editPrice),
          reorderLevel: parseInt(editReorderLevel),
        };
      }
      return drug;
    });

    setDrugs(updatedDrugs);
    setLastUpdated(new Date().toLocaleTimeString());

    toast.success('Drug Updated', {
      description: `${editName} has been updated successfully.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Drug Information Updated',
      message: `${editName} details have been modified`,
      type: 'info',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Low',
    });

    setEditModalOpen(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedDrug) return;

    setDrugs(drugs.filter(d => d.id !== selectedDrug.id));
    setLastUpdated(new Date().toLocaleTimeString());

    toast.success('Drug Deleted', {
      description: `${selectedDrug.name} has been removed from inventory.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Drug Deleted',
      message: `${selectedDrug.name} removed from low stock inventory`,
      type: 'warning',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Medium',
    });

    setDeleteDialogOpen(false);
    setSelectedDrug(null);
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['Drug ID', 'Drug Name', 'Category', 'Price', 'Quantity', 'Reorder Level', 'Supplier', 'Batch Number', 'Expiry Date', 'Cost Price'];
    const csvData = filteredDrugs.map(drug => [
      drug.drugId,
      drug.name,
      drug.category,
      drug.price,
      drug.quantity,
      drug.reorderLevel,
      drug.supplier,
      drug.batchNumber,
      drug.expiryDate,
      drug.costPrice
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `low-stock-drugs-${new Date().toISOString().split('T')[0]}.csv`;
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
          <title>Low Stock Drugs Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #000; }
            .report-container { max-width: 1000px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
            .header h1 { color: #1e40af; font-size: 32px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; line-height: 1.6; }
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
            .badge-critical { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b; }
            .badge-low { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #fef3c7; color: #92400e; }
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
              <p>Low Stock Drugs Report</p>
              <p>Birnin Kebbi, Kebbi State, Nigeria</p>
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
              </div>
              <div>
                <div class="meta-item">
                  <span class="meta-label">Total Low Stock Drugs:</span>
                  <span class="meta-value">${filteredDrugs.length}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Critical Drugs (&lt;5 units):</span>
                  <span class="meta-value">${filteredDrugs.filter(d => d.quantity < 5).length}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Value at Risk:</span>
                  <span class="meta-value">₦${filteredDrugs.reduce((sum, d) => sum + (d.price * d.quantity), 0).toLocaleString()}</span>
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
                  <th class="text-center">Reorder Level</th>
                  <th>Supplier</th>
                  <th>Expiry Date</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredDrugs.map((drug, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${drug.drugId}</td>
                    <td><strong>${drug.name}</strong></td>
                    <td>${drug.category}</td>
                    <td class="text-center"><strong>${drug.quantity}</strong></td>
                    <td class="text-center">${drug.reorderLevel}</td>
                    <td>${drug.supplier}</td>
                    <td>${new Date(drug.expiryDate).toLocaleDateString()}</td>
                    <td class="text-center">
                      <span class="${drug.quantity < 5 ? 'badge-critical' : 'badge-low'}">
                        ${drug.quantity < 5 ? 'Critical' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p><strong>GODIYA HOSPITAL - Pharmacy Department</strong></p>
              <p>This is a computer-generated report.</p>
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
            description: 'Low stock drugs report sent to printer',
          });

          addNotification({
            id: Date.now(),
            title: 'Report Printed',
            message: 'Low Stock Drugs Report generated and printed',
            type: 'info',
            status: 'Unread',
            timestamp: new Date().toISOString(),
            priority: 'Low',
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
  const getStatusBadge = (quantity: number) => {
    if (quantity < 5) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Critical
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Low Stock
      </Badge>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Low Stock Drugs Report</h1>
          <p className="text-muted-foreground">Drugs with quantity less than reorder level</p>
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
          title="Total Low Stock Drugs"
          value={totalLowStockDrugs}
          icon={Package}
          trend="neutral"
          trendValue="Needs attention"
          color="warning"
          tooltip="Total drugs below reorder level"
        />
        <KPICard
          title="Critical (<5 units)"
          value={criticalDrugs}
          icon={AlertCircle}
          trend="down"
          trendValue="Urgent restocking required"
          color="danger"
          tooltip="Drugs with less than 5 units"
        />
        <KPICard
          title="Value at Risk"
          value={valueAtRisk}
          icon={DollarSign}
          trend="neutral"
          trendValue="Stock value"
          color="primary"
          tooltip="Total value of low stock drugs"
          prefix="₦"
        />
        <KPICard
          title="Last Updated"
          value={lastUpdated}
          icon={Clock}
          color="secondary"
          tooltip="Last inventory update time"
          isTime={true}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </CardTitle>
          <CardDescription>Search and filter low stock drugs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="mb-2 block">Search Drug</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, category..."
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
              <Label className="mb-2 block">Supplier</Label>
              <Select value={supplierFilter} onValueChange={(value) => {
                setSupplierFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Min Quantity</Label>
              <Input
                type="number"
                placeholder="0"
                value={minQuantity}
                onChange={(e) => {
                  setMinQuantity(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div>
              <Label className="mb-2 block">Max Quantity</Label>
              <Input
                type="number"
                placeholder="100"
                value={maxQuantity}
                onChange={(e) => {
                  setMaxQuantity(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

            <div>
              <Label className="mb-2 block">Expiry Date To</Label>
              <Input
                type="date"
                value={expiryTo}
                onChange={(e) => {
                  setExpiryTo(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Drugs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Low Stock Drugs</CardTitle>
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
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Price</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-muted-foreground">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Expiry Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedDrugs.map((drug, index) => (
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
                          <p className="text-xs text-muted-foreground">{drug.supplier}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {drug.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-sm">₦{drug.price.toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <Badge
                            variant="outline"
                            className={drug.quantity < 5 ? 'bg-red-50 text-red-700 border-red-200 text-sm px-3 py-1' : 'bg-orange-50 text-orange-700 border-orange-200 text-sm px-3 py-1'}
                          >
                            {drug.quantity} / {drug.reorderLevel}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-semibold">{new Date(drug.expiryDate).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">Batch: {drug.batchNumber}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(drug.quantity)}
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

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditModal(drug)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Drug</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => openRestockModal(drug)}
                                >
                                  <PackagePlus className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Restock Drug</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

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
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {paginatedDrugs.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground mb-2">No low stock drugs found</p>
                <p className="text-sm text-muted-foreground">All drugs are above reorder level or try adjusting your filters</p>
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
              Complete drug information
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
                    <CardTitle className="text-lg">Stock Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Current Quantity</Label>
                      <p className="font-bold text-2xl text-primary">{selectedDrug.quantity} units</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Reorder Level</Label>
                      <p className="font-semibold">{selectedDrug.reorderLevel} units</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div>{getStatusBadge(selectedDrug.quantity)}</div>
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
                      <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                      <p className="font-semibold">{new Date(selectedDrug.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Days Until Expiry</Label>
                      <p className="font-semibold">
                        {Math.ceil((new Date(selectedDrug.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            {selectedDrug && (
              <Button
                onClick={() => {
                  setViewModalOpen(false);
                  openRestockModal(selectedDrug);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <PackagePlus className="w-4 h-4 mr-2" />
                Restock Drug
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Drug Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Edit className="w-6 h-6 text-primary" />
              Edit Drug
            </DialogTitle>
            <DialogDescription className="text-base">
              Update drug information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Drug Name *</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter drug name"
                />
              </div>
              <div>
                <Label className="mb-2 block">Category *</Label>
                <Input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="Enter category"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Selling Price (₦) *</Label>
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="mb-2 block">Reorder Level *</Label>
                <Input
                  type="number"
                  value={editReorderLevel}
                  onChange={(e) => setEditReorderLevel(e.target.value)}
                  placeholder="Enter reorder level"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-primary hover:bg-primary/90">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Drug Modal */}
      <Dialog open={restockModalOpen} onOpenChange={setRestockModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <PackagePlus className="w-6 h-6 text-green-600" />
              Restock Drug
            </DialogTitle>
            <DialogDescription className="text-base">
              Add quantity to {selectedDrug?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedDrug && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Current Stock</Label>
                      <p className="font-bold text-xl text-primary">{selectedDrug.quantity} units</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Reorder Level</Label>
                      <p className="font-semibold text-sm">{selectedDrug.reorderLevel} units</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      {getStatusBadge(selectedDrug.quantity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Add Quantity *</Label>
                <Input
                  type="number"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  placeholder="Enter quantity to add"
                  className="h-11"
                />
              </div>
              <div>
                <Label className="mb-2 block">Supplier</Label>
                <Input
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  placeholder="Enter supplier name"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Batch Number</Label>
                <Input
                  value={restockBatch}
                  onChange={(e) => setRestockBatch(e.target.value)}
                  placeholder="Enter batch number"
                  className="h-11"
                />
              </div>
              <div>
                <Label className="mb-2 block">Expiry Date</Label>
                <Input
                  type="date"
                  value={restockExpiry}
                  onChange={(e) => setRestockExpiry(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Cost Price (₦)</Label>
              <Input
                type="number"
                value={restockCost}
                onChange={(e) => setRestockCost(e.target.value)}
                placeholder="Enter cost price per unit"
                className="h-11"
              />
            </div>

            {restockQuantity && selectedDrug && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs text-muted-foreground">New Stock Level</Label>
                      <p className="font-bold text-2xl text-green-700">
                        {selectedDrug.quantity + parseInt(restockQuantity || '0')} units
                      </p>
                    </div>
                    <div>
                      {(selectedDrug.quantity + parseInt(restockQuantity || '0')) >= selectedDrug.reorderLevel && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Sufficient Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setRestockModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestock} className="bg-green-600 hover:bg-green-700">
              <PackagePlus className="w-4 h-4 mr-2" />
              Confirm Restock
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
              Delete Drug
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <strong>{selectedDrug?.name}</strong>? This action cannot be undone and will permanently remove this drug from the inventory.
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
