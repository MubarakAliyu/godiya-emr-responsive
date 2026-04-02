import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PackageCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Search,
  Download,
  Filter,
  FileText,
  CheckCircle2,
  DollarSign,
  Truck,
  Clock,
  User,
  Phone,
  Calendar,
  Pill,
  CreditCard,
  Printer,
  RotateCcw,
  Package,
  ShoppingBag,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { usePharmacyStore } from '@/app/emr/store/pharmacy-store';
import { addAuditLog } from '@/app/emr/store/audit-store';
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
import { Separator } from '@/app/components/ui/separator';
import { printPOSSlip } from '@/app/emr/utils/pos-print';

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

interface SaleItem {
  drugId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  status: string;
}

interface PaidPrescription {
  id: string;
  invoiceId: string;
  fileNumber: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  patientType: 'IPD' | 'OPD';
  items: SaleItem[];
  amount: number;
  status: 'Paid' | 'Unpaid';
  isDispensed: boolean;
  date: string;
  time: string;
}


function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip, prefix = '' }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const duration = 1000;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= value) {
        setDisplayValue(value);
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

export function PaidPrescriptionsPanel() {
  const { addNotification, settings } = useEMRStore();
  const { updatePrescriptionStatus } = usePharmacyStore();

  // State
  const [prescriptions, setPrescriptions] = useState<PaidPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientTypeFilter, setPatientTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoices.php?paid_only=1&undispensed_only=1');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPrescriptions(data);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load paid prescriptions',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PaidPrescription | null>(null);

  // Calculate KPIs
  const totalPrescriptionsCount = prescriptions.length;
  const totalRevenueValue = prescriptions.reduce((sum, p) => sum + p.amount, 0);
  const todaysPendingCount = prescriptions.filter(p => {
    const today = new Date().toISOString().split('T')[0];
    return p.date === today;
  }).length;
  const avgValue = totalPrescriptionsCount > 0 ? totalRevenueValue / totalPrescriptionsCount : 0;

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch = prescription.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPatientType = patientTypeFilter === 'all' || prescription.patientType === patientTypeFilter;

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const prescriptionDate = new Date(prescription.date);
      if (dateFrom) {
        matchesDate = matchesDate && prescriptionDate >= new Date(dateFrom);
      }
      if (dateTo) {
        matchesDate = matchesDate && prescriptionDate <= new Date(dateTo);
      }
    }

    return matchesSearch && matchesPatientType && matchesDate;
  });

  // Paginate
  const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);
  const paginatedPrescriptions = filteredPrescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setPatientTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    toast.info('Filters Reset', {
      description: 'All filters have been cleared.',
    });
  };

  // Open view modal
  const openViewModal = (prescription: PaidPrescription) => {
    setSelectedPrescription(prescription);
    setViewModalOpen(true);
  };

  // Print invoice
  const handlePrintInvoice = (prescription: PaidPrescription) => {
    const printData = {
      title: "Dispensing Receipt",
      isPaid: true,
      sections: [
        {
          title: "Patient Details",
          items: [
            { label: "Patient", value: prescription.patientName },
            { label: "File No", value: prescription.fileNumber },
            { label: "Type", value: prescription.patientType },
            { label: "Date", value: prescription.date },
            { label: "Time", value: prescription.time }
          ]
        },
        {
          title: "Items",
          items: prescription.items.map(item => ({
            label: item.status === 'Unavailable' ? `${item.name} (NOT AVAILABLE)` : `${item.name} (x${item.quantity})`,
            value: item.status === 'Unavailable' ? 'OUT OF STOCK' : `₦${(item.subtotal || 0).toLocaleString()}`
          }))
        },
        {
          title: "Summary",
          items: [
            { label: "Invoice ID", value: prescription.invoiceId },
            { label: "TOTAL PAID", value: `₦${(prescription.amount || 0).toLocaleString()}` }
          ]
        }
      ],
      footer: "Thank you for choosing Godiya Hospital!"
    };

    printPOSSlip(settings, printData);

    toast.success('Receipt Printing', {
      description: `Dispensing receipt ${prescription.invoiceId} sent to POS printer`,
    });
  };

  // Dispense logic
  const handleDispense = async (prescription: PaidPrescription) => {
    try {
      const response = await fetch('/api/invoices.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispense',
          inv_id: prescription.id,
          performerId: 'Pharmacist' // In a real app, this would be the logged-in user's ID
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Prescription Dispensed', {
          description: `${prescription.invoiceId} for ${prescription.patientName} has been dispensed and inventory updated.`,
        });

        // Add notification
        addNotification({
          id: Date.now(),
          title: 'Prescription Dispensed',
          message: `${prescription.invoiceId} dispensed to ${prescription.patientName}`,
          type: 'success',
          status: 'Unread',
          timestamp: new Date().toISOString(),
          priority: 'High',
        });

        // Remove from local list
        setPrescriptions(prev => prev.filter(p => p.id !== prescription.id));
        setViewModalOpen(false);
        setSelectedPrescription(null);
      } else {
        toast.error('Dispense Failed', {
          description: result.error || 'Failed to dispense prescription',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred during dispensing',
      });
    }
  };

  const handlePrintAndDispense = async (prescription: PaidPrescription) => {
    // 1. Print
    handlePrintInvoice(prescription);
    // 2. Dispense
    await handleDispense(prescription);
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['Invoice ID', 'File Number', 'Patient Name', 'Amount', 'Date', 'Time'];
    const csvData = filteredPrescriptions.map(prescription => [
      prescription.invoiceId,
      prescription.fileNumber,
      prescription.patientName,
      prescription.amount,
      prescription.date,
      prescription.time
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paid-prescriptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('CSV Exported', {
      description: `${filteredPrescriptions.length} records exported successfully.`,
    });
  };

  // Export as PDF
  const exportAsPDF = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Paid Prescriptions Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            h1 { color: #1e40af; margin-bottom: 5px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1e40af; color: white; padding: 12px; text-align: left; font-size: 13px; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
            tr:nth-child(even) { background: #f9fafb; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; margin-top: 20px; text-align: right; font-size: 16px; color: #1e40af; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GODIYA HOSPITAL</h1>
            <p>Paid Prescriptions (Dispatch Queue) Report</p>
            <div class="meta">Generated on: ${new Date().toLocaleString()} | Records: ${filteredPrescriptions.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>File No.</th>
                <th>Patient Name</th>
                <th>Patient Type</th>
                <th>Date</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPrescriptions.map(p => `
                <tr>
                  <td>${p.invoiceId}</td>
                  <td>${p.fileNumber}</td>
                  <td>${p.patientName}</td>
                  <td>${p.patientType}</td>
                  <td>${p.date}</td>
                  <td class="text-right">₦${(p.amount || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-row">
            Total Revenue: ₦${(totalRevenueValue || 0).toLocaleString()}
          </div>
          <div class="footer">
            <p>This report contains paid but undispensed prescriptions as of ${new Date().toLocaleTimeString()}.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(reportHTML);
      doc.close();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 2000);
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'Partial':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      case 'Refunded':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get dispatch status badge
  const getDispatchStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'Dispatched':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Truck className="w-3 h-3 mr-1" />
            Dispatched
          </Badge>
        );
      case 'Collected':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <PackageCheck className="w-3 h-3 mr-1" />
            Collected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Paid Prescriptions</h1>
        <p className="text-muted-foreground">Dispatch queue and revenue tracking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Pending Prescriptions"
          value={totalPrescriptionsCount}
          icon={PackageCheck}
          trend="up"
          trendValue="Awaiting dispensing"
          color="primary"
          tooltip="Total paid but undispensed prescriptions"
        />
        <KPICard
          title="Pending Revenue"
          value={totalRevenueValue}
          icon={DollarSign}
          color="secondary"
          tooltip="Revenue from undispensed prescriptions"
          prefix="₦"
        />
        <KPICard
          title="Today's Pending"
          value={todaysPendingCount}
          icon={Clock}
          color="warning"
          tooltip="Prescriptions from today awaiting dispensing"
        />
        <KPICard
          title="Avg. Value"
          value={Math.round(avgValue)}
          icon={ShoppingBag}
          color="secondary"
          tooltip="Average value per pending prescription"
          prefix="₦"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </CardTitle>
          <CardDescription>Search and filter paid prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice, file, patient..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Patient Type</Label>
              <Select value={patientTypeFilter} onValueChange={(value: string) => {
                setPatientTypeFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Patients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="IPD">In-Patient (IPD)</SelectItem>
                  <SelectItem value="OPD">Out-Patient (OPD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <Label className="mb-2 block">Date To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-1/4"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportAsCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportAsPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Paid Prescriptions List</CardTitle>
              <CardDescription>
                Showing {paginatedPrescriptions.length} of {filteredPrescriptions.length} prescriptions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">File Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Patient Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Date/Time</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedPrescriptions.map((prescription, index) => (
                    <motion.tr
                      key={prescription.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sm text-primary">{prescription.invoiceId}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-sm">{prescription.fileNumber}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs mt-1 ${prescription.patientType === 'IPD' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}
                          >
                            {prescription.patientType}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-sm">{prescription.patientName}</p>
                          <p className="text-xs text-muted-foreground">{prescription.patientAge}y • {prescription.patientGender}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-sm text-primary">₦{(prescription.amount || 0).toLocaleString()}</p>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] h-4">Paid</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-semibold">{prescription.date}</p>
                          <p className="text-xs text-muted-foreground">{prescription.time}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openViewModal(prescription)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {paginatedPrescriptions.length === 0 && (
              <div className="text-center py-12">
                <PackageCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground mb-2">No paid prescriptions found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {filteredPrescriptions.length} total records
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

      {/* View Paid Prescription Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-primary" />
              Paid Prescription Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete transaction and dispensing information
            </DialogDescription>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-6 py-4">
              {/* Patient & Invoice Info */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="shadow-none border-muted/50">
                  <CardHeader className="py-2 px-3 border-b">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">File Number</Label>
                        <p className="font-semibold text-xs">{selectedPrescription.fileNumber}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Patient Name</Label>
                        <p className="font-semibold text-xs">{selectedPrescription.patientName}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Age / Gender</Label>
                        <p className="font-semibold text-xs">{selectedPrescription.patientAge}y • {selectedPrescription.patientGender}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Patient Type</Label>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-4 ${selectedPrescription.patientType === 'IPD' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}
                        >
                          {selectedPrescription.patientType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Phone</Label>
                      <p className="font-semibold text-xs">{selectedPrescription.patientPhone}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none border-muted/50">
                  <CardHeader className="py-2 px-3 border-b">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Invoice Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Invoice ID</Label>
                      <p className="font-semibold text-xs text-primary">{selectedPrescription.invoiceId}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Date</Label>
                        <p className="font-semibold text-xs">{selectedPrescription.date}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Time</Label>
                        <p className="font-semibold text-xs">{selectedPrescription.time}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Drugs Dispensed */}
              <Card className="shadow-none border-muted/50">
                <CardHeader className="py-2 px-3 border-b">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary" />
                    Drugs Dispensed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">#</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Drug Name</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Drug ID</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Quantity</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Unit Price</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescription.items.map((drug, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2 px-3 text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <p className={`font-semibold text-[11px] ${drug.status === 'Unavailable' ? 'text-red-500 line-through opacity-70' : ''}`}>
                                {drug.name}
                              </p>
                              {drug.status === 'Unavailable' && (
                                <Badge variant="outline" className="text-[10px] h-4 bg-red-50 text-red-600 border-red-200 px-1 mt-1">
                                  NOT AVAILABLE
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[11px]">{drug.drugId}</td>
                            <td className="py-2 px-3 text-center">
                              <Badge variant="outline" className="text-[10px] h-4 px-1">{drug.quantity}</Badge>
                            </td>
                            <td className="py-2 px-3 text-right text-[11px]">₦{(drug.price || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">
                              <p className={`font-bold text-[11px] ${drug.status === 'Unavailable' ? 'text-muted-foreground' : 'text-primary'}`}>
                                {drug.status === 'Unavailable' ? 'N/A' : `₦${(drug.subtotal || 0).toLocaleString()}`}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card className="border-primary/20 bg-primary/5 shadow-none border-dashed">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-medium">Payment Status</span>
                        <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200 text-[10px] h-4">
                          <CheckCircle2 className="w-2 h-2 mr-1" />
                          PAID
                        </Badge>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-medium">Total Amount</span>
                        <span className="text-xl font-bold text-primary">
                          ₦{(selectedPrescription.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" onClick={() => {
              setViewModalOpen(false);
              setSelectedPrescription(null);
            }}>
              Close
            </Button>
            {selectedPrescription && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDispense(selectedPrescription)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <PackageCheck className="w-3 h-3 mr-2" />
                  Dispense Only
                </Button>
                <Button
                  size="sm"
                  onClick={() => handlePrintAndDispense(selectedPrescription)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Printer className="w-3 h-3 mr-2" />
                  Print & Dispense
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}