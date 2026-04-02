import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { AlertCircle, Banknote, BarChart3, Building2, CheckCircle2, Clock, CreditCard, DollarSign, Download, Eye, EyeOff, FileSearch, FileText, Loader2, Printer, Receipt, TrendingUp, User, Users, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { generatePaymentReceiptPDF, generateDailyReportPDF, type ReceiptData, type DailyReportData } from '@/app/emr/utils/pdf-generator';
import { exportDailyReportToCSV, exportPendingPaymentsToCSV } from '@/app/emr/utils/csv-export';

// KPI Card Component (Matching Reception Design Style)
function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className={`hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
              {trend && trendValue && (
                <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-secondary' : 'text-destructive'}`}>
                  <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${color === 'primary' ? 'bg-primary/10' :
              color === 'secondary' ? 'bg-secondary/10' :
                color === 'destructive' ? 'bg-destructive/10' :
                  'bg-blue-100'
              }`}>
              <Icon className={`w-6 h-6 ${color === 'primary' ? 'text-primary' :
                color === 'secondary' ? 'text-secondary' :
                  color === 'destructive' ? 'text-destructive' :
                    'text-blue-600'
                }`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Quick Action Button Component
function QuickActionButton({
  title,
  description,
  icon: Icon,
  onClick,
  variant = 'default'
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'outline';
}) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className="h-auto p-6 flex flex-col items-start gap-3 hover:shadow-lg transition-all w-full"
    >
      <Icon className="w-8 h-8 text-primary" />
      <div className="text-left space-y-1">
        <p className="font-semibold text-base">{title}</p>
        <p className="text-xs text-muted-foreground font-normal">{description}</p>
      </div>
    </Button>
  );
}

// Payment Activity Item
interface PaymentActivity {
  id: string;
  patientName: string;
  fileNo: string;
  paymentType: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Partial';
  timestamp: string;
  paymentMethod?: string;
}

function PaymentActivityItem({ activity, onView }: { activity: PaymentActivity; onView: () => void }) {
  const statusColors = {
    'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Partial': 'bg-orange-100 text-orange-700 border-orange-200'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 hover:border-primary/30 transition-all group"
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-foreground">{activity.patientName}</p>
          <Badge variant="outline" className="text-xs">
            {activity.paymentType}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-3 h-3" />
          <span>{activity.fileNo}</span>
          <span>•</span>
          <Clock className="w-3 h-3" />
          <span>{activity.timestamp}</span>
          {activity.paymentMethod && (
            <>
              <span>•</span>
              <span>{activity.paymentMethod}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-xl text-foreground">₦{activity.amount.toLocaleString()}</p>
          <Badge className={`text-xs border ${statusColors[activity.status]}`}>
            {activity.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Confirm Payment Modal with PIN Integration
function ConfirmPaymentModal({
  isOpen,
  onClose,
  paymentData,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    patientName: string;
    patientId: string;
    fileNo: string;
    paymentType: string;
    amount: number;
    invoiceId: string;
  } | null;
  onConfirm: (pin: string, paymentMethod: string, printReceipt: boolean) => void;
}) {
  const [pin, setPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  // Check if cashier has a PIN on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/cashier_pin.php?action=status', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setHasPin(!!data.has_pin))
        .catch(() => setHasPin(false));
    }
  }, [isOpen]);

  const handleConfirm = async (printReceipt: boolean = false) => {
    // Validate Input
    if (!pin) {
      setPinError('PIN is required');
      toast.error('PIN Required');
      return;
    }

    if (pin.length < 4 || pin.length > 6) {
      setPinError('PIN must be 4-6 digits');
      toast.error('Invalid PIN Length');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsVerifying(true);
    setPinError('');

    try {
      // Verify PIN via backend
      const response = await fetch('/api/cashier_pin.php?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // If verified, proceed with confirmation
      onConfirm(pin, paymentMethod, printReceipt);

      // Reset form and close
      setPin('');
      setPaymentMethod('');
      setShowPin(false);
      onClose();
    } catch (error: any) {
      setPinError(error.message || 'Incorrect PIN');
      toast.error('Incorrect PIN', {
        description: error.message || 'The PIN you entered is incorrect',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    setPaymentMethod('');
    setShowPin(false);
    setPinError('');
    onClose();
  };

  if (!paymentData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Confirm Payment
          </DialogTitle>
          <DialogDescription>
            Review payment details and enter your PIN to authorize
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient & Invoice Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 space-y-4 border-2 border-primary/20">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Patient Details</span>
              <Badge variant="outline">{paymentData.paymentType}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Patient Name</p>
                <p className="font-semibold">{paymentData.patientName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">File Number</p>
                <p className="font-semibold font-mono">{paymentData.fileNo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Patient ID</p>
                <p className="font-semibold font-mono">{paymentData.patientId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Invoice ID</p>
                <p className="font-semibold font-mono text-sm">{paymentData.invoiceId}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-4xl font-bold text-primary">
                  ₦{paymentData.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Select */}
          <div className="space-y-2">
            <Label htmlFor="payment-method" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Method *
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method" className="h-12">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    <span>Cash Payment</span>
                  </div>
                </SelectItem>
                <SelectItem value="Card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Card Payment (POS)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Transfer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cashier PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Enter Your Cashier PIN *
            </Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPin(value);
                  setPinError('');
                }}
                placeholder="••••••"
                className={`text-center text-3xl tracking-[1.5em] font-bold h-16 pr-12 ${pinError ? 'border-destructive' : ''
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {pinError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {pinError}
              </p>
            )}
            {hasPin === false && (
              <p className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-2">
                ⚠️ No PIN set. Please set your PIN in profile settings for enhanced security.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={() => handleConfirm(false)}
            className="flex-1"
            variant="secondary"
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Confirm Only
          </Button>
          <Button
            onClick={() => handleConfirm(true)}
            className="flex-1"
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            Confirm & Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}

// View Payment Details Modal
function ViewPaymentDetailsModal({
  isOpen,
  onClose,
  activity
}: {
  isOpen: boolean;
  onClose: () => void;
  activity: PaymentActivity | null;
}) {
  if (!activity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-primary" />
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Patient Name</span>
              <span className="font-semibold">{activity.patientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">File Number</span>
              <span className="font-mono">{activity.fileNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Type</span>
              <Badge variant="secondary">{activity.paymentType}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold text-primary">₦{activity.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge>{activity.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="font-mono">{activity.timestamp}</span>
            </div>
            {activity.paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <span className="font-semibold">{activity.paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Cashier Dashboard Home Component
export function CashierDashboardHome() {
  const { invoices, patients, updateInvoice } = useEMRStore();
  const authData = JSON.parse(localStorage.getItem('emr_auth') || '{}');

  // ── Live KPI state fetched from backend ──────────────────────────────────
  const [liveStats, setLiveStats] = useState<{
    todayRevenue: number;
    monthlyRevenue: number;
    receiptsToday: number;
    pendingInvoices: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchLiveStats = async () => {
    try {
      const res = await fetch('/api/cashier_reports.php?type=cashier-dashboard-stats', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLiveStats(data);
      }
    } catch (e) {
      console.error('Failed to load cashier stats:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Fallback to 0 while loading
  const todayRevenue = liveStats?.todayRevenue ?? 0;
  const monthlyRevenue = liveStats?.monthlyRevenue ?? 0;
  const receiptsToday = liveStats?.receiptsToday ?? 0;

  const today = new Date().toISOString().split('T')[0];
  const pendingFilePayments = patients.filter(p => p.status === 'Pending').length;

  const pendingConsultationPayments = invoices.filter(
    inv => inv.paymentStatus === 'Unpaid'
  ).length;

  const totalPatients = patients.length;

  // Generate recent payment activities from invoices
  const [paymentActivities, setPaymentActivities] = useState<PaymentActivity[]>([]);

  useEffect(() => {
    const activities: PaymentActivity[] = invoices
      .slice(0, 8)
      .map(inv => {
        const patient = patients.find(p => p.id === inv.patientId);
        return {
          id: inv.id,
          patientName: inv.patientName,
          fileNo: patient?.id || 'N/A',
          paymentType: inv.invoiceType,
          amount: inv.amount,
          status: inv.paymentStatus,
          timestamp: new Date(inv.dateCreated).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          paymentMethod: inv.paymentMethod || undefined
        };
      });
    setPaymentActivities(activities);
  }, [invoices, patients]);

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    patientName: string;
    patientId: string;
    fileNo: string;
    paymentType: string;
    amount: number;
    invoiceId: string;
  } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<PaymentActivity | null>(null);

  // Handler functions
  const handleVerifyFilePayment = () => {
    const pendingPatient = patients.find(p => p.status === 'Pending');

    if (pendingPatient) {
      setSelectedPayment({
        patientName: pendingPatient.fullName,
        patientId: pendingPatient.id,
        fileNo: pendingPatient.id,
        paymentType: 'File Registration',
        amount: pendingPatient.fileType === 'Individual' ? 1500 : 3000,
        invoiceId: `INV-${Date.now()}`
      });
      setIsPaymentModalOpen(true);
    } else {
      toast.info('No Pending File Payments');
    }
  };

  const handleVerifyConsultationPayment = () => {
    const unpaidInvoice = invoices.find(inv => inv.paymentStatus === 'Unpaid');

    if (unpaidInvoice) {
      const patient = patients.find(p => p.id === unpaidInvoice.patientId);
      setSelectedPayment({
        patientName: unpaidInvoice.patientName,
        patientId: patient?.id || 'N/A',
        fileNo: patient?.id || 'N/A',
        paymentType: 'Consultation Fee',
        amount: unpaidInvoice.amount,
        invoiceId: unpaidInvoice.id
      });
      setIsPaymentModalOpen(true);
    } else {
      toast.info('No Pending Consultation Payments');
    }
  };

  const handlePrintDailyReport = () => {
    const todayTransactions = invoices
      .filter(inv => inv.dateCreated.startsWith(today) && inv.paymentStatus === 'Paid')
      .map(inv => ({
        id: inv.id,
        time: new Date(inv.dateCreated).toLocaleTimeString(),
        patientName: inv.patientName,
        type: inv.invoiceType,
        amount: inv.amount,
        method: inv.paymentMethod || 'Cash'
      }));

    const reportData: DailyReportData = {
      date: new Date().toLocaleDateString(),
      totalRevenue: todayRevenue,
      totalTransactions: receiptsToday,
      cashPayments: todayTransactions.filter(t => t.method === 'Cash').reduce((s, t) => s + t.amount, 0),
      cardPayments: todayTransactions.filter(t => t.method === 'Card').reduce((s, t) => s + t.amount, 0),
      transferPayments: todayTransactions.filter(t => t.method === 'Transfer').reduce((s, t) => s + t.amount, 0),
      filePayments: todayTransactions.filter(t => t.type.includes('File')).reduce((s, t) => s + t.amount, 0),
      consultationPayments: todayTransactions.filter(t => t.type.includes('Consultation')).reduce((s, t) => s + t.amount, 0),
      labPayments: todayTransactions.filter(t => t.type.includes('Lab')).reduce((s, t) => s + t.amount, 0),
      pharmacyPayments: todayTransactions.filter(t => t.type.includes('Pharmacy')).reduce((s, t) => s + t.amount, 0),
      transactions: todayTransactions
    };

    generateDailyReportPDF(reportData);
    toast.success('Daily Report Generated');
  };

  const handleExportDailyReport = () => {
    const todayTransactions = invoices
      .filter(inv => inv.dateCreated.startsWith(today) && inv.paymentStatus === 'Paid')
      .map(inv => ({
        id: inv.id,
        time: new Date(inv.dateCreated).toLocaleTimeString(),
        patientName: inv.patientName,
        type: inv.invoiceType,
        amount: inv.amount,
        method: inv.paymentMethod || 'Cash'
      }));

    exportDailyReportToCSV({
      date: new Date().toLocaleDateString(),
      transactions: todayTransactions,
      summary: {
        totalRevenue: todayRevenue,
        totalTransactions: receiptsToday,
        cashPayments: todayTransactions.filter(t => t.method === 'Cash').reduce((s, t) => s + t.amount, 0),
        cardPayments: todayTransactions.filter(t => t.method === 'Card').reduce((s, t) => s + t.amount, 0),
        transferPayments: todayTransactions.filter(t => t.method === 'Transfer').reduce((s, t) => s + t.amount, 0)
      }
    });

    toast.success('Report Exported to CSV');
  };

  const handleExportPending = () => {
    const pendingPayments = invoices
      .filter(inv => inv.paymentStatus === 'Unpaid')
      .map(inv => ({
        patientName: inv.patientName,
        fileNo: patients.find(p => p.id === inv.patientId)?.id || 'N/A',
        paymentType: inv.invoiceType,
        amount: inv.amount,
        status: inv.paymentStatus,
        dateCreated: inv.dateCreated
      }));

    exportPendingPaymentsToCSV(pendingPayments);
    toast.success('Pending Payments Exported');
  };

  const handlePaymentConfirm = (pin: string, paymentMethod: string, printReceipt: boolean) => {
    if (selectedPayment) {
      // Update invoice or patient status
      if (selectedPayment.paymentType === 'File Registration') {
        const patient = patients.find(p => p.id === selectedPayment.patientId);
        if (patient) {
          // In real implementation, update patient status through store
          toast.success('File Payment Confirmed');
        }
      } else {
        updateInvoice(selectedPayment.invoiceId, {
          paymentStatus: 'Paid',
          paymentMethod: paymentMethod
        });
        toast.success('Payment Confirmed Successfully');
      }

      // Print receipt if requested
      if (printReceipt) {
        const receiptData: ReceiptData = {
          receiptId: `GH-RC-${Date.now()}`,
          invoiceId: selectedPayment.invoiceId,
          patientName: selectedPayment.patientName,
          patientId: selectedPayment.patientId,
          fileNo: selectedPayment.fileNo,
          paymentType: selectedPayment.paymentType,
          amount: selectedPayment.amount,
          paymentMethod: paymentMethod,
          paymentDate: new Date().toLocaleDateString(),
          paymentTime: new Date().toLocaleTimeString(),
          cashierName: authData.name || 'Cashier',
          cashierId: 'GH-STF-001'
        };

        generatePaymentReceiptPDF(receiptData);
        toast.success('Receipt Printed');
      }
    }
  };

  const handleViewActivity = (activity: PaymentActivity) => {
    setSelectedActivity(activity);
    setIsViewDetailsModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Cashier Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Financial overview, payment processing, and transaction management
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportPending} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Pending
          </Button>
          <Button variant="outline" onClick={handleExportDailyReport} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handlePrintDailyReport} size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Enhanced KPI Cards - Better Aligned Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Pending Files"
          value={pendingFilePayments}
          icon={FileText}
          color="primary"
          onClick={handleVerifyFilePayment}
        />
        <KPICard
          title="Pending Consultations"
          value={pendingConsultationPayments}
          icon={Clock}
          color="destructive"
          onClick={handleVerifyConsultationPayment}
        />
        <KPICard
          title="Today's Revenue"
          value={statsLoading ? '...' : `₦${todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="Live"
          color="secondary"
        />
        <KPICard
          title="Monthly Revenue"
          value={statsLoading ? '...' : `₦${monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          trend="up"
          trendValue="Live"
          color="secondary"
        />
        <KPICard
          title="Receipts Today"
          value={statsLoading ? '...' : receiptsToday}
          icon={Receipt}
          color="primary"
        />
        <KPICard
          title="Total Patients"
          value={totalPatients}
          icon={Users}
          color="primary"
        />
      </div>

      {/* Quick Actions - Redesigned Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Frequently used payment and reporting actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton
              title="Verify File Payment"
              description="Process file registration payments"
              icon={FileText}
              onClick={handleVerifyFilePayment}
            />
            <QuickActionButton
              title="Verify Consultation"
              description="Process consultation fee payments"
              icon={DollarSign}
              onClick={handleVerifyConsultationPayment}
            />
            <QuickActionButton
              title="Print Daily Report"
              description="Generate today's financial summary"
              icon={Printer}
              onClick={handlePrintDailyReport}
              variant="outline"
            />
            <QuickActionButton
              title="Export Data"
              description="Download reports as CSV"
              icon={Download}
              onClick={handleExportDailyReport}
              variant="outline"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Payment Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Receipt className="w-6 h-6 text-primary" />
                Recent Payment Activities
              </CardTitle>
              <CardDescription>Latest transactions and payment updates</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {paymentActivities.length} activities
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {paymentActivities.length > 0 ? (
            <div className="space-y-3">
              {paymentActivities.map((activity, index) => (
                <div key={activity.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <PaymentActivityItem
                    activity={activity}
                    onView={() => handleViewActivity(activity)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No recent payment activities</p>
              <p className="text-sm mt-1">Payment transactions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ConfirmPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        paymentData={selectedPayment}
        onConfirm={handlePaymentConfirm}
      />

      <ViewPaymentDetailsModal
        isOpen={isViewDetailsModalOpen}
        onClose={() => {
          setIsViewDetailsModalOpen(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
      />
    </div>
  );
}