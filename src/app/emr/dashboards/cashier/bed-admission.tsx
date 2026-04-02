import { toast } from 'sonner';
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
  Calendar,
  Bed,
  Download,
  Filter,
  Banknote,
  CreditCard,
  Building2,
  Trash2,
  User,
  Home,
  Loader2,
  RefreshCw,
  History
} from 'lucide-react';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { getCurrentUser } from '@/app/emr/utils/auth';
import { printPOSSlip } from '@/app/emr/utils/pos-print';
import { PaymentHistoryModal } from '@/app/emr/components/payments/PaymentHistoryModal';
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

// Bed Admission Invoice Interface
interface BedAdmissionInvoice {
  id: string;
  ipdNo: string;
  patientId: string;
  patientName: string;
  ward: string;
  admissionDate: string;
  dailyRate: number;
  totalExpected: number;
  totalPaid: number;
  status: 'Paid' | 'Partial' | 'Pending';
  isPaid: boolean;
}

// Admission Breakdown Modal
function AdmissionBreakdownModal({
  isOpen,
  onClose,
  admission
}: {
  isOpen: boolean;
  onClose: () => void;
  admission: BedAdmissionInvoice | null;
}) {
  if (!admission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Bed className="w-6 h-6 text-primary" />
            Bed Admission Details
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown for admission {admission.admissionNo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Admission Info Card */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Admission No</p>
                <p className="font-mono font-semibold">{admission.admissionNo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={admission.status === 'Paid' ? 'default' : 'secondary'}
                  className={admission.status === 'Paid' ? 'bg-secondary' : 'bg-yellow-500/10 text-yellow-700'}
                >
                  {admission.status === 'Paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {admission.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                  {admission.status}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                  <p className="font-semibold">{admission.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">File Number</p>
                  <p className="font-mono text-sm">{admission.patientId}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ward</p>
                  <Badge variant="outline" className="font-medium">
                    <Home className="w-3 h-3 mr-1" />
                    {admission.ward}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bed Number</p>
                  <Badge variant="outline" className="font-medium">
                    <Bed className="w-3 h-3 mr-1" />
                    {admission.bedNumber}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Attending Doctor</p>
                  <Badge variant="outline">
                    <User className="w-3 h-3 mr-1" />
                    {admission.attendingDoctor}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Daily Rate</p>
                  <p className="font-semibold text-secondary">₦{admission.dailyRate.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admission Timeline */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Admission Timeline
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Admission Date</span>
                <span className="font-semibold">{new Date(admission.admissionDate).toLocaleDateString()}</span>
              </div>
              {admission.dischargeDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Discharge Date</span>
                  <span className="font-semibold">{new Date(admission.dischargeDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">Number of Days</span>
                <Badge variant="secondary" className="font-bold">
                  {admission.numberOfDays} {admission.numberOfDays === 1 ? 'day' : 'days'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Cost Calculation */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost Breakdown
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Rate</span>
                <span className="font-medium">₦{admission.dailyRate.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Number of Days</span>
                <span className="font-medium">{admission.numberOfDays}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">Calculation</span>
                <span className="font-mono text-sm">
                  ₦{admission.dailyRate.toLocaleString()} × {admission.numberOfDays} days
                </span>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Total Amount</span>
              <span className="text-3xl font-bold text-white">
                ₦{admission.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {admission.status === 'Paid' && admission.paymentMethod && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <Badge variant="outline">{admission.paymentMethod}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
                  <p className="font-medium">{admission.paymentDate}</p>
                </div>
              </div>
            </div>
          )}
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
  admission,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  admission: BedAdmissionInvoice | null;
  onConfirm: () => void;
}) {
  const { settings } = useEMRStore();
  const [pin, setPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Transfer'>('Cash');
  const [amountToPay, setAmountToPay] = useState<string>('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  const remainingBalance = (admission?.totalExpected || 0) - (admission?.totalPaid || 0);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/cashier_pin.php?action=status', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setHasPin(!!data.has_pin));

      setAmountToPay(remainingBalance.toString());
    }
  }, [isOpen, remainingBalance]);

  const handleConfirm = async (printReceipt: boolean = false) => {
    if (!pin) {
      setPinError('PIN is required');
      return;
    }

    const paidAmount = parseFloat(amountToPay);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    if (paidAmount > remainingBalance) {
      toast.error(`Amount exceeds remaining balance: ₦${remainingBalance.toLocaleString()}`);
      return;
    }

    setIsVerifying(true);
    setPinError('');

    try {
      // 1. Verify PIN
      const verifyRes = await fetch('/api/cashier_pin.php?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        setPinError(verifyData.error || 'Invalid PIN');
        setIsVerifying(false);
        return;
      }

      // 2. Record Payment in tbl_payments
      const balanceAfter = remainingBalance - paidAmount;
      const user = getCurrentUser();

      const paymentRes = await fetch('/api/payments.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_unique_id: admission.patientId,
          reference_id: admission.ipdNo,
          amount_expected: admission.totalExpected,
          amount_paid: paidAmount,
          balance: balanceAfter,
          payment_method: paymentMethod,
          payment_description: `Bed Admission Deposit - ${admission.ward}`,
          cashier_id: user?.email || 'System'
        }),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }

      // 3. Print if requested
      if (printReceipt) {
        printPOSSlip(settings, {
          title: 'Admission Deposit Receipt',
          sections: [
            {
              title: 'Patient Information',
              items: [
                { label: 'Patient Name', value: admission.patientName },
                { label: 'File Number', value: admission.patientId },
                { label: 'IPD Number', value: admission.ipdNo },
                { label: 'Ward', value: admission.ward }
              ]
            },
            {
              title: 'Payment Details',
              items: [
                { label: 'Total Expected', value: `₦${admission.totalExpected.toLocaleString()}` },
                { label: 'Amount Paid', value: `₦${paidAmount.toLocaleString()}` },
                { label: 'Balance', value: `₦${balanceAfter.toLocaleString()}` },
                { label: 'Payment Method', value: paymentMethod }
              ]
            }
          ],
          footer: 'Godiya Hospital - Quality Healthcare Service'
        });
      }

      toast.success('Payment recorded successfully');
      onConfirm();
      onClose();
      setPin('');
      setAmountToPay('');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    setPinError('');
    onClose();
  };

  if (!admission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirm Admission Payment</DialogTitle>
          <DialogDescription>
            Enter payment details and your PIN to confirm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Patient</span>
              <span className="font-semibold">{admission.patientName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">IPD No</span>
              <span className="font-mono">{admission.ipdNo}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ward</span>
              <Badge variant="outline">{admission.ward}</Badge>
            </div>

            {admission.totalPaid > 0 && (
              <>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="font-semibold text-green-600">₦{admission.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Balance Due</span>
                  <span className="font-semibold text-amber-600">₦{remainingBalance.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between font-semibold pt-2 border-t text-lg">
              <span>{admission.totalPaid > 0 ? 'Total Due' : 'Admission Fee'}</span>
              <span className="text-primary">₦{admission.totalExpected.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" /> Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="Card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Card
                    </div>
                  </SelectItem>
                  <SelectItem value="Transfer">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount Paid (₦)</Label>
              <Input
                type="number"
                value={amountToPay}
                onChange={(e) => setAmountToPay(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">Cashier PIN</Label>
            <Input
              id="pin"
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setPinError('');
              }}
              placeholder="••••••"
              className={`text-center text-2xl tracking-[0.5em] font-bold ${pinError ? 'border-destructive' : ''}`}
            />
            {pinError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {pinError}
              </p>
            )}
            {hasPin === false && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                You haven't set a transaction PIN yet. Please go to Settings &gt; Profile to set one.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleConfirm(false)}
              className="flex-1"
              disabled={isVerifying || hasPin === false}
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirm Only
            </Button>
            <Button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => handleConfirm(true)}
              className="flex-1"
              disabled={isVerifying || hasPin === false}
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
              Confirm & Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CashierBedAdmissionPage() {
  const { settings } = useEMRStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [admissions, setAdmissions] = useState<BedAdmissionInvoice[]>([]);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<BedAdmissionInvoice | null>(null);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/payments.php?action=pending_admissions');
      if (!response.ok) throw new Error('Failed to fetch admissions');
      const data = await response.json();

      setAdmissions(data.map((item: any) => ({
        id: item.admission_id,
        ipdNo: item.ipd_number,
        patientId: item.admission_patient,
        patientName: item.patient_name,
        ward: item.ward_name,
        admissionDate: item.admission_datetime,
        dailyRate: parseFloat(item.price_per_day),
        totalExpected: parseFloat(item.price_per_day), // Initial deposit == base price
        totalPaid: parseFloat(item.total_paid),
        status: (parseFloat(item.total_paid) >= parseFloat(item.price_per_day)) ? 'Paid' : (parseFloat(item.total_paid) > 0 ? 'Partial' : 'Pending'),
        isPaid: parseFloat(item.total_paid) >= parseFloat(item.price_per_day)
      })));
    } catch (error) {
      toast.error('Failed to load admission payments');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search admissions
  const filteredAdmissions = useMemo(() => {
    return admissions.filter(admission => {
      const matchesSearch =
        admission.ipdNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admission.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admission.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admission.ward.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        admission.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [admissions, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAdmissions.length / itemsPerPage);
  const paginatedAdmissions = filteredAdmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: admissions.length,
      pending: admissions.filter(adm => adm.status === 'Pending').length,
      partial: admissions.filter(adm => adm.status === 'Partial').length,
      paid: admissions.filter(adm => adm.status === 'Paid').length,
    };
  }, [admissions]);

  // Handlers
  const handleConfirmPayment = (admission: BedAdmissionInvoice) => {
    setSelectedAdmission(admission);
    setIsPaymentModalOpen(true);
  };

  const handleViewHistory = (admission: BedAdmissionInvoice) => {
    setSelectedAdmission(admission);
    setIsHistoryModalOpen(true);
  };

  const handlePrintReceipt = (admission: BedAdmissionInvoice) => {
    if (!settings) return;
    printPOSSlip(settings, {
      title: 'Admission Deposit Receipt',
      sections: [
        {
          title: 'Patient Information',
          items: [
            { label: 'Patient Name', value: admission.patientName },
            { label: 'File Number', value: admission.patientId },
            { label: 'IPD Number', value: admission.ipdNo },
            { label: 'Ward', value: admission.ward }
          ]
        },
        {
          title: 'Payment Details',
          items: [
            { label: 'Total Expected', value: `₦${admission.totalExpected.toLocaleString()}` },
            { label: 'Total Paid', value: `₦${admission.totalPaid.toLocaleString()}` },
            { label: 'Status', value: admission.status }
          ]
        }
      ],
      footer: 'Godiya Hospital - Quality Healthcare Service'
    });
    toast.success('POS Receipt Printed');
  };

  const handlePaymentConfirm = () => {
    fetchData();
  };

  const handleExport = () => {
    toast.success('Export Success', {
      description: `Exporting ${filteredAdmissions.length} bed admission records to CSV`,
    });
  };

  const handlePrintReport = () => {
    toast.success('Report Generated', {
      description: 'Bed admission payments report has been sent to the printer',
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Bed Admission Payments</h1>
          <p className="text-muted-foreground">
            Manage bed admission and ward charges
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bed className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Admissions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partial</p>
                <p className="text-2xl font-bold">{stats.partial}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by IPD No, Name, or File..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={fetchData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-primary" />
            Bed Admission Payments
            <Badge variant="secondary" className="ml-2">
              {filteredAdmissions.length} admissions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isRefreshing && admissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading admission payments...</p>
            </div>
          ) : paginatedAdmissions.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission Details</TableHead>
                    <TableHead>Patient Info</TableHead>
                    <TableHead>Amount Expected</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAdmissions.map((admission) => (
                    <TableRow key={admission.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono font-medium">{admission.ipdNo}</span>
                          <span className="text-xs text-muted-foreground">{admission.ward}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(admission.admissionDate).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{admission.patientName}</span>
                          <span className="text-xs font-mono text-muted-foreground">{admission.patientId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₦{admission.dailyRate.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₦{admission.totalPaid.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={admission.status === 'Paid' ? 'default' : 'secondary'}
                          className={
                            admission.status === 'Paid' ? 'bg-secondary' :
                              admission.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                                'bg-yellow-500/10 text-yellow-700'
                          }
                        >
                          {admission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(admission)}
                            title="Payment History"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          {admission.status !== 'Paid' ? (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmPayment(admission)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Pay
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintReceipt(admission)}
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              Receipt
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
            <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
              <Bed className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold text-muted-foreground">No Pending Admissions</h3>
              <p className="text-sm text-muted-foreground">All bed admission payments are currently up to date.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAdmissions.length)} of {filteredAdmissions.length} admissions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ConfirmPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        admission={selectedAdmission}
        onConfirm={handlePaymentConfirm}
      />

      {selectedAdmission && (
        <PaymentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          patientId={selectedAdmission.patientId}
          patientName={selectedAdmission.patientName}
          referenceId={selectedAdmission.ipdNo}
          amountExpected={selectedAdmission.totalExpected}
          onPaymentUpdate={handlePaymentConfirm}
        />
      )}
    </div>
  );
}
