import { toast } from 'sonner';
import { generateLabReceiptPDF, type LabReceiptData } from '@/app/emr/utils/lab-receipt-pdf';
import { exportLaboratoryPaymentsToCSV } from '@/app/emr/utils/csv-export';
import { motion } from 'motion/react';
import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Eye,
  FileText,
  Calendar,
  FlaskConical,
  Download,
  Filter,
  Banknote,
  CreditCard,
  Building2,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { useEMRStore } from '@/app/emr/store/emr-store';
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

// Lab Invoice Interface
interface LabInvoice {
  id: string;
  invoiceNumber: string;
  fileNumber: string;
  parentFileNumber?: string;
  subFileName?: string;
  subFileNumber: string;
  patientName: string;
  phoneNumber: string;
  total: number;
  date: string;
  status: 'Paid' | 'Unpaid';
  is_subfile: boolean;
  tests: { name: string, price: number }[];
}

// View Invoice Modal
function ViewInvoiceModal({
  isOpen,
  onClose,
  invoice
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: LabInvoice | null;
}) {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            Invoice Details
          </DialogTitle>
          <DialogDescription>
            Complete information for invoice {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Info Card */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Invoice No</p>
                <p className="font-mono font-semibold">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={invoice.status === 'Paid' ? 'secondary' : 'outline'}
                  className={invoice.status === 'Paid' ? 'bg-green-500/10 text-green-700' : 'bg-yellow-500/10 text-yellow-700'}
                >
                  {invoice.status === 'Paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {invoice.status === 'Unpaid' && <Clock className="w-3 h-3 mr-1" />}
                  {invoice.status}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                  <p className="font-semibold">{invoice.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">File Number</p>
                  <p className="font-mono text-sm">{invoice.fileNumber}</p>
                </div>
              </div>
              {invoice.is_subfile && (
                <div className="mt-2 text-xs bg-primary/5 p-2 rounded">
                  <span className="text-muted-foreground">Parent File: </span>
                  <span className="font-semibold">{invoice.parentFileNumber}</span>
                  <span className="mx-2">|</span>
                  <span className="text-muted-foreground">Subfile: </span>
                  <span className="font-semibold">{invoice.subFileName}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tests</p>
                <div className="space-y-1">
                  {invoice.tests.map((test, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{test.name}</span>
                      <span className="text-muted-foreground">₦{test.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Invoice Date</p>
                  <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">₦{invoice.total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {invoice.status === 'Paid' && (
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                    <Badge variant="outline">Cash/Other</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className="bg-green-600">CONFIRMED</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Confirm Payment Modal
function ConfirmPaymentModal({
  isOpen,
  onClose,
  invoice,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: LabInvoice | null;
  onConfirm: (pin: string, paymentMethod: string, shouldPrint: boolean) => void;
}) {
  const [pin, setPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pinError, setPinError] = useState('');

  const handleConfirm = () => {
    // Validate PIN
    if (!pin) {
      setPinError('PIN is required');
      toast.error('PIN Required', {
        description: 'Please enter your 4-digit PIN to confirm payment',
      });
      return;
    }
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      toast.error('Invalid PIN Length', {
        description: 'PIN must be exactly 4 digits',
      });
      return;
    }
    if (!paymentMethod) {
      toast.error('Payment Method Required', {
        description: 'Please select a payment method',
      });
      return;
    }

    // Confirm payment (PIN verification happens on backend)
    onConfirm(pin, paymentMethod, false);
  };

  const handleConfirmAndPrint = () => {
    // Validate PIN
    if (!pin) {
      setPinError('PIN is required');
      toast.error('PIN Required', {
        description: 'Please enter your 4-digit PIN to confirm payment',
      });
      return;
    }
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      toast.error('Invalid PIN Length', {
        description: 'PIN must be exactly 4 digits',
      });
      return;
    }
    if (!paymentMethod) {
      toast.error('Payment Method Required', {
        description: 'Please select a payment method',
      });
      return;
    }

    // Confirm payment (PIN verification happens on backend)
    onConfirm(pin, paymentMethod, true);
  };

  const handleCancel = () => {
    setPin('');
    setPaymentMethod('');
    setPinError('');
    onClose();
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirm Laboratory Payment</DialogTitle>
          <DialogDescription>
            Review invoice details and enter your PIN to confirm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Summary Card */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invoice No</span>
              <span className="font-mono font-semibold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Patient Name</span>
              <span className="font-semibold">{invoice.patientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">File Number</span>
              <span className="font-medium font-mono">{invoice.fileNumber}</span>
            </div>
            {invoice.is_subfile && (
              <div className="flex items-center justify-between text-xs text-primary bg-primary/5 p-1 px-2 rounded">
                <span>Family File: {invoice.parentFileNumber}</span>
                <span>Sub-patient: {invoice.subFileName}</span>
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Amount</span>
                <span className="text-3xl font-bold text-primary">
                  ₦{invoice.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Select */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Card Payment</span>
                  </div>
                </SelectItem>
                <SelectItem value="transfer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4 Digit PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="pin">Enter 4-Digit PIN *</Label>
            <Input
              id="pin"
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value.replace(/\D/g, '');
                setPin(value);
                setPinError('');
              }}
              placeholder="••••"
              className={`text-center text-2xl tracking-[1em] font-bold ${pinError ? 'border-destructive' : ''}`}
            />
            {pinError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {pinError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Note: Uses your Cashier PIN (4 digits)</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <div className="flex-[2] flex gap-2">
              <Button
                variant="secondary"
                onClick={handleConfirm}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button
                onClick={handleConfirmAndPrint}
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Confirm & Print
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CashierLaboratoryPage() {
  const { settings } = useEMRStore();
  const [labInvoices, setLabInvoices] = useState<LabInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/laboratory.php?action=get_invoice_records');
      const data = await response.json();
      if (Array.isArray(data)) {
        setLabInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<LabInvoice | null>(null);

  // Filter and search invoices
  const filteredInvoices = useMemo(() => {
    return labInvoices.filter(invoice => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.parentFileNumber && invoice.parentFileNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (invoice.subFileName && invoice.subFileName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        invoice.status.toLowerCase() === statusFilter.toLowerCase();

      let matchesDate = true;
      if (dateFrom && dateTo) {
        const invoiceDate = new Date(invoice.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        matchesDate = invoiceDate >= fromDate && invoiceDate <= toDate;
      } else if (dateFrom) {
        const invoiceDate = new Date(invoice.date);
        const fromDate = new Date(dateFrom);
        matchesDate = invoiceDate >= fromDate;
      } else if (dateTo) {
        const invoiceDate = new Date(invoice.date);
        const toDate = new Date(dateTo);
        matchesDate = invoiceDate <= toDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [labInvoices, searchQuery, statusFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayInvoices = labInvoices.filter(inv => inv.date.startsWith(today));
    const paidToday = todayInvoices.filter(inv => inv.status === 'Paid');
    const revenueToday = paidToday.reduce((sum, inv) => sum + inv.total, 0);

    return {
      total: labInvoices.length,
      paidToday: paidToday.length,
      pending: labInvoices.filter(inv => inv.status === 'Unpaid').length,
      revenue: revenueToday,
    };
  }, [labInvoices]);

  // Handlers
  const handleConfirmPayment = (invoice: LabInvoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleViewInvoice = (invoice: LabInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleDeleteInvoice = (invoice: LabInvoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedInvoice) {
      try {
        const response = await fetch('/api/laboratory.php', {
          method: 'POST',
          body: JSON.stringify({
            action: 'delete_invoice',
            id: selectedInvoice.id
          })
        });
        if (response.ok) {
          setLabInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
          toast.success('Invoice Deleted', {
            description: `Invoice ${selectedInvoice.invoiceNumber} has been deleted successfully`,
          });
        }
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
    }
  };

  const handlePrintReceipt = (invoice: LabInvoice) => {
    const receiptData: LabReceiptData = {
      receiptId: `GH-LAB-${Date.now()}`,
      invoiceNo: invoice.invoiceNumber,
      patientName: invoice.patientName,
      patientId: invoice.fileNumber,
      fileNo: invoice.fileNumber,
      testType: invoice.tests.map(t => t.name).join(', '),
      testDetails: invoice.is_subfile ? `Subfile: ${invoice.subFileName} (Parent: ${invoice.parentFileNumber})` : 'Standard Patient',
      amount: invoice.total,
      paymentMethod: 'Cash',
      paymentDate: new Date().toLocaleDateString(),
      paymentTime: new Date().toLocaleTimeString(),
      cashierName: 'Cashier',
      cashierId: 'GH-STF-001',
      hospitalSettings: settings
    };
    generateLabReceiptPDF(receiptData);
    toast.success('Receipt Printed', {
      description: `Receipt for ${invoice.patientName} (${invoice.invoiceNumber}) has been sent to the printer`,
    });
  };

  const handlePaymentConfirm = async (pin: string, paymentMethod: string, shouldPrint: boolean) => {
    if (selectedInvoice) {
      try {
        const response = await fetch('/api/laboratory.php', {
          method: 'POST',
          body: JSON.stringify({
            action: 'confirm_lab_payment',
            id: selectedInvoice.id,
            pin: pin,
            payment_method: paymentMethod
          })
        });
        const result = await response.json();
        if (result.success) {
          setLabInvoices(prev => prev.map(inv =>
            inv.id === selectedInvoice.id
              ? { ...inv, status: 'Paid' as const }
              : inv
          ));
          toast.success('Payment Confirmed', {
            description: `Payment for ${selectedInvoice.patientName} successfully processed.`
          });

          if (shouldPrint) {
            handlePrintReceipt(selectedInvoice);
          }

          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        } else {
          toast.error(result.error || 'Payment failed');
        }
      } catch (error) {
        toast.error('Connection error occurred');
      }
    }
  };

  const handleExport = () => {
    exportLaboratoryPaymentsToCSV(filteredInvoices);
    toast.success('Export Success', {
      description: `Exporting ${filteredInvoices.length} laboratory invoices to CSV`,
    });
  };

  const handlePrintReport = () => {
    toast.success('Report Generated', {
      description: 'Laboratory payments report has been sent to the printer',
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Laboratory Payments</h1>
          <p className="text-muted-foreground">
            Manage laboratory test payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handlePrintReport} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FlaskConical className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Lab Invoices</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Today</p>
                  <p className="text-2xl font-bold">{stats.paidToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue Today</p>
                  <p className="text-2xl font-bold">₦{stats.revenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by Invoice No, File No, Patient Name, or Test Type..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
                  placeholder="From Date"
                />
              </div>

              <div className="flex-1">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
                  placeholder="To Date"
                />
              </div>

              <Button variant="outline" onClick={handleClearFilters}>
                <Filter className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Laboratory Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            Laboratory Invoices
            <Badge variant="secondary" className="ml-2">
              {filteredInvoices.length} invoices
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedInvoices.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S/N</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>File No</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice, index) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{invoice.fileNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{invoice.patientName}</span>
                          {invoice.is_subfile && (
                            <span className="text-[10px] text-primary font-medium">
                              Subfile: {invoice.subFileName} ({invoice.subFileNumber}) | Parent: {invoice.parentFileNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">₦{invoice.total.toLocaleString()}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {invoice.status === 'Paid' ? (
                          <Badge variant="default" className="bg-secondary text-secondary-foreground">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Unpaid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'Unpaid' ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleConfirmPayment(invoice)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pay Now
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintReceipt(invoice)}
                            >
                              <Printer className="w-4 h-4 mr-1" />
                              Print
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FlaskConical className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No invoices found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || dateFrom || dateTo
                  ? 'Try adjusting your search or filters'
                  : 'Laboratory invoices will appear here'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of{' '}
                {filteredInvoices.length} invoices
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <div key={`ellipsis-${page}`} className="flex items-center">
                            <span className="px-2 text-muted-foreground">...</span>
                            <Button
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      }
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ConfirmPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onConfirm={handlePaymentConfirm}
      />

      <ViewInvoiceModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

    </div>
  );
}