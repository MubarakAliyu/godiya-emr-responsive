import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Building, Calendar, CheckCircle, CheckCircle2, DollarSign, Download, Eye, FileText, FlaskConical, Loader2, Minus, Phone, Printer, Search, Trash2, TrendingDown, TrendingUp, User, X } from 'lucide-react';
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
import { printPOSSlip } from '@/app/emr/utils/pos-print';

interface KPICardProps {
  title: string;
  value: number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  tooltip?: string;
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  fileNumber: string;
  patientName: string;
  phoneNumber: string;
  tests: { name: string; price: number; quantity?: number }[];
  total: number;
  date: string;
  status: 'Paid' | 'Unpaid';
  is_subfile: boolean;
  subFileNumber?: string;
}

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip }: KPICardProps) {
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
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-foreground">
                      {title.toLowerCase().includes('revenue') ? '₦' : ''}{displayValue.toLocaleString()}
                    </h3>
                  </div>
                  <div
                    className={`p-3 rounded-xl`}
                    style={{
                      backgroundColor: color === 'primary' ? '#1e40af15' : '#05966915'
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{
                        color: color === 'primary' ? '#1e40af' : '#059669'
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

export function InvoiceRecords() {
  const { addNotification, settings } = useEMRStore();

  // State
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/laboratory.php?action=get_invoice_records');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (e) {
      console.error('Failed to fetch invoice records:', e);
      toast.error('Failed to load invoice records');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid').length;
  const unpaidInvoices = invoices.filter((inv) => inv.status === 'Unpaid').length;
  const revenueToday = invoices
    .filter((inv) => {
      const today = new Date().toISOString().split('T')[0];
      return inv.date.startsWith(today) && inv.status === 'Paid';
    })
    .reduce((sum, inv) => sum + inv.total, 0);

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      (invoice.invoiceNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (invoice.fileNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (invoice.patientName?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      const invoiceDate = new Date(invoice.date);
      if (dateFilter === 'today') {
        matchesDate = invoiceDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = invoiceDate >= weekAgo;
      } else if (dateFilter === 'month') {
        matchesDate = invoiceDate.getMonth() === today.getMonth();
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return b.total - a.total;
    }
  });

  // Paginate
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle view invoice
  const handleViewInvoice = (invoice: InvoiceRecord) => {
    setSelectedInvoice(invoice);
    setViewModalOpen(true);
  };

  // Handle POS print invoice
  const handlePrintInvoice = (invoice: InvoiceRecord) => {
    const printData = {
      title: 'Laboratory Invoice',
      sections: [
        {
          title: 'Invoice Info',
          items: [
            { label: 'Invoice #', value: invoice.invoiceNumber },
            { label: 'Date', value: new Date(invoice.date).toLocaleString() },
            { label: 'Status', value: invoice.status }
          ]
        },
        {
          title: 'Patient Details',
          items: [
            { label: 'Name', value: invoice.patientName },
            { label: 'File #', value: invoice.fileNumber },
            { label: 'Phone', value: invoice.phoneNumber },
            { label: 'Type', value: invoice.is_subfile ? 'Family Member' : 'Direct Patient' }
          ]
        },
        {
          title: 'Tests',
          items: invoice.tests.map(test => ({
            label: test.name,
            value: `₦${test.price.toLocaleString()}`
          }))
        },
        {
          items: [
            { label: 'TOTAL AMOUNT', value: `₦${invoice.total.toLocaleString()}` }
          ]
        }
      ],
      footer: 'Thank you for choosing Godiya Hospital Laboratory'
    };

    printPOSSlip(settings, printData);

    toast.success('Print Started', {
      description: `POS Receipt for ${invoice.invoiceNumber} started.`,
    });
  };



  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Invoice Number', 'File Number', 'Patient Name', 'Total', 'Date', 'Status'],
      ...filteredInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.fileNumber,
        inv.patientName,
        inv.total,
        inv.date,
        inv.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lab-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('CSV Exported', {
      description: 'Invoice records exported successfully.',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === 'Paid') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
    }
    return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Unpaid</Badge>;
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Invoice Records</h1>
          <p className="text-muted-foreground">View and manage all laboratory invoices</p>
        </div>
        <Button variant="outline" onClick={fetchInvoices}>
          Refresh Records
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Invoices"
          value={totalInvoices}
          icon={FileText}
          trend="neutral"
          trendValue="All records"
          color="primary"
          tooltip="Total number of invoices created"
        />
        <KPICard
          title="Paid Invoices"
          value={paidInvoices}
          icon={CheckCircle2}
          trend="up"
          trendValue="Revenue generating"
          color="secondary"
          tooltip="Invoices with completed payment"
        />
        <KPICard
          title="Unpaid Invoices"
          value={unpaidInvoices}
          icon={AlertCircle}
          trend="down"
          trendValue="Pending actions"
          color="primary"
          tooltip="Invoices pending payment"
        />
        <KPICard
          title="Revenue Today"
          value={revenueToday}
          icon={DollarSign}
          trend="up"
          trendValue="Sum of daily collection"
          color="secondary"
          tooltip="Total revenue collected today"
        />
      </div>

      {/* Invoice Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Invoice History
                </CardTitle>
                <CardDescription>Comprehensive list of laboratory billing</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice #</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">File Number</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Patient Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Total</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedInvoices.map((invoice, index) => (
                        <motion.tr
                          key={invoice.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-semibold text-sm text-primary">{invoice.invoiceNumber}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-sm">{invoice.fileNumber}</p>
                            {invoice.is_subfile && invoice.subFileNumber && (
                              <p className="text-[10px] text-muted-foreground font-mono">ID: {invoice.subFileNumber}</p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <p className={`text-sm ${invoice.is_subfile ? 'font-semibold text-primary' : 'font-medium'}`}>
                                {invoice.patientName}
                              </p>
                              {invoice.is_subfile && (
                                <Badge variant="secondary" className="w-fit text-[10px] h-4 mt-0.5">Family Member</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-sm">₦{invoice.total.toLocaleString()}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">
                              {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(invoice.status)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleViewInvoice(invoice)}
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
                                      onClick={() => handlePrintInvoice(invoice)}
                                      className="text-blue-600"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>POS Print</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>


                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && paginatedInvoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((page, idx, arr) => (
                        <span key={page} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-muted-foreground">...</span>}
                          <Button
                            size="sm"
                            variant={currentPage === page ? 'default' : 'outline'}
                            onClick={() => setCurrentPage(page)}
                            className="w-8"
                          >
                            {page}
                          </Button>
                        </span>
                      ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* View Invoice Modal */}
      <Dialog open={viewModalOpen} onOpenChange={(open) => !open && setViewModalOpen(false)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
                <DialogDescription>Invoice Reference: {selectedInvoice?.invoiceNumber}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Patient Name</Label>
                  <p className="font-semibold">{selectedInvoice.patientName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">File Number</Label>
                  <p className="font-semibold">{selectedInvoice.fileNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-semibold">{selectedInvoice.phoneNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Invoice Date</Label>
                  <p className="font-semibold">{new Date(selectedInvoice.date).toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Tests Ordered</h4>
                <div className="space-y-2">
                  {selectedInvoice.tests.map((test, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-primary opacity-60" />
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <span className="font-bold">₦{test.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black text-primary">₦{selectedInvoice.total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
            <Button onClick={() => handlePrintInvoice(selectedInvoice!)}>
              <Printer className="w-4 h-4 mr-2" />
              Print POS Slip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
