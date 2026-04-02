import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Printer,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Eye,
  Trash2,
  RefreshCw,
  Loader2,
  Banknote,
  CreditCard,
  Building2,
  Download,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
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
import { Patient } from '@/app/emr/store/types';
import { getCurrentUser } from '@/app/emr/utils/auth';
import { printPOSSlip } from '@/app/emr/utils/pos-print';
import { PaymentHistoryModal } from '@/app/emr/components/payments/PaymentHistoryModal';
import { exportFilePaymentsToCSV } from '@/app/emr/utils/csv-export';

// Confirm Payment Modal
function ConfirmPaymentModal({
  isOpen,
  onClose,
  patient,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onConfirm: () => void;
}) {
  const { settings } = useEMRStore();
  const [pin, setPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Transfer'>('Cash');
  const [amountToPay, setAmountToPay] = useState<string>('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  const individualFee = settings?.billing?.individualFileFee || 1500;
  const familyFee = settings?.billing?.familyFileFee || 5000;
  const totalExpected = patient?.fileType === 'Family' ? familyFee : individualFee;
  const alreadyPaid = patient?.totalPaid || 0;
  const remainingBalance = totalExpected - alreadyPaid;

  // Check if cashier has a PIN on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/cashier_pin.php?action=status', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setHasPin(!!data.has_pin));

      // Default amount to remaining balance
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
      const paymentDescription = `${patient.fileType} File Registration ${paidAmount < remainingBalance ? '(Partial)' : '(Completion)'}`;
      const balanceAfter = remainingBalance - paidAmount;

      const user = getCurrentUser();
      const paymentRes = await fetch('/api/payments.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_unique_id: patient.id,
          reference_id: `REG-${patient.id}`,
          amount_expected: totalExpected,
          amount_paid: paidAmount,
          balance: balanceAfter,
          payment_method: paymentMethod,
          payment_description: paymentDescription,
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
          title: 'File Registration Receipt',
          sections: [
            {
              title: 'Patient Information',
              items: [
                { label: 'Patient Name', value: patient.fullName },
                { label: 'File Number', value: patient.id },
                { label: 'File Type', value: patient.fileType }
              ]
            },
            {
              title: 'Payment Details',
              items: [
                { label: 'Description', value: paymentDescription },
                { label: 'Total Expected', value: `₦${totalExpected.toLocaleString()}` },
                { label: 'Amount Paid', value: `₦${paidAmount.toLocaleString()}` },
                { label: 'Balance', value: `₦${balanceAfter.toLocaleString()}` },
                { label: 'Payment Method', value: paymentMethod }
              ]
            }
          ],
          footer: 'Thank you for choosing Godiya Hospital.'
        });
      }

      toast.success('Payment recorded successfully');
      onConfirm();
      onClose();
      // Reset logic
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

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirm File Payment</DialogTitle>
          <DialogDescription>
            Enter payment details and your PIN to confirm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Patient</span>
              <span className="font-semibold">{patient.fullName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">File No</span>
              <span className="font-mono">{patient.id}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">File Type</span>
              <Badge variant={patient.fileType === 'Family' ? 'default' : 'secondary'}>
                {patient.fileType}
              </Badge>
            </div>
            {alreadyPaid > 0 && (
              <>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="font-semibold text-green-600">₦{alreadyPaid.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Balance Due</span>
                  <span className="font-semibold text-amber-600">₦{remainingBalance.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between font-semibold pt-2 border-t text-lg">
              <span>{alreadyPaid > 0 ? 'Total Due' : 'Grand Total'}</span>
              <span className="text-primary">₦{totalExpected.toLocaleString()}</span>
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

// View Subfiles Modal (for Family Files)
function ViewSubfilesModal({
  isOpen,
  onClose,
  parentPatient,
  subfiles
}: {
  isOpen: boolean;
  onClose: () => void;
  parentPatient: Patient | null;
  subfiles: Patient[];
}) {
  if (!parentPatient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Family Members - {parentPatient.fullName}
          </DialogTitle>
          <DialogDescription>
            Viewing all subfiles under this family file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Parent File Info */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{parentPatient.fullName} (Parent File)</p>
                <p className="text-sm text-muted-foreground">File No: {parentPatient.id}</p>
              </div>
              <Badge variant="default">Family</Badge>
            </div>
          </div>

          {/* Subfiles Table */}
          {subfiles.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S/N</TableHead>
                    <TableHead>Member Name</TableHead>
                    <TableHead>File No</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subfiles.map((subfile, index) => (
                    <TableRow key={subfile.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{subfile.fullName}</TableCell>
                      <TableCell className="font-mono text-sm">{subfile.id}</TableCell>
                      <TableCell>{subfile.gender}</TableCell>
                      <TableCell>
                        <Badge variant={subfile.status === 'Active' ? 'default' : 'secondary'}>
                          {subfile.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No subfiles found under this family file</p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Cancel Payment Modal
function CancelPaymentModal({
  isOpen,
  onClose,
  patient,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onConfirm: () => void;
}) {
  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-destructive">
            <AlertCircle className="w-6 h-6" />
            Cancel Payment
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
            <p className="text-sm text-muted-foreground mb-2">Patient:</p>
            <p className="font-semibold text-lg">{patient.fullName}</p>
            <p className="text-sm text-muted-foreground">File No: {patient.id}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Canceling this payment will permanently remove the payment record.
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            No, Keep It
          </Button>
          <Button variant="destructive" onClick={() => {
            onConfirm();
            onClose();
          }}>
            <Trash2 className="w-4 h-4 mr-2" />
            Yes, Cancel Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CashierFilePaymentsPage() {
  const { patients, updatePatient, settings, refreshData } = useEMRStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fees from settings
  const individualFee = settings?.billing?.individualFileFee || 1500;
  const familyFee = settings?.billing?.familyFileFee || 5000;

  // Filter to show only patients (files) - both Individual and Family
  const allFiles = useMemo(() => {
    return patients.filter(p => !p.parentFileId); // Exclude subfiles
  }, [patients]);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubfilesModalOpen, setIsSubfilesModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Filter and search files
  const filteredFiles = useMemo(() => {
    return allFiles.filter(file => {
      const matchesSearch =
        file.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.phoneNumber.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && file.isPaid) ||
        (statusFilter === 'pending' && !file.isPaid);

      return matchesSearch && matchesStatus;
    });
  }, [allFiles, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get subfiles for a family file
  const getSubfiles = (parentId: string) => {
    return patients.filter(p => p.parentFileId === parentId);
  };

  // Handlers
  const handleConfirmPayment = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsPaymentModalOpen(true);
  };

  const handleViewHistory = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsHistoryModalOpen(true);
  };

  const handleViewSubfiles = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsSubfilesModalOpen(true);
  };

  const handlePrintReceipt = (patient: Patient) => {
    const fee = patient.fileType === 'Family' ? familyFee : individualFee;

    printPOSSlip(settings, {
      title: 'File Registration Receipt',
      sections: [
        {
          title: 'Patient Information',
          items: [
            { label: 'Patient Name', value: patient.fullName },
            { label: 'File Number', value: patient.id },
            { label: 'File Type', value: patient.fileType }
          ]
        },
        {
          title: 'Payment Details',
          items: [
            { label: 'Description', value: `${patient.fileType} File Registration (Reprint)` },
            { label: 'Amount Paid', value: `₦${fee.toLocaleString()}` },
            { label: 'Payment Status', value: 'Paid' }
          ]
        }
      ],
      footer: 'Thank you for your payment.'
    });

    toast.success('POS Receipt Printed');
  };

  const handleCancelPayment = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsCancelModalOpen(true);
  };

  const handlePaymentConfirm = () => {
    refreshData(); // Refresh everything from source of truth
  };

  const handleExport = () => {
    const exportData = filteredFiles.map(p => {
      const regFee = p.fileType === 'Family' ? 5000 : 2000;
      return {
        receiptId: `REG-${p.id}`,
        patientName: p.fullName,
        fileNo: p.id,
        fileType: p.fileType,
        amount: regFee,
        paymentStatus: p.isPaid ? 'Paid' : (p.totalPaid > 0 ? 'Partial' : 'Pending'),
        paymentMethod: p.totalPaid > 0 ? 'Various' : 'N/A',
        dateCreated: p.dateRegistered,
        datePaid: p.isPaid ? p.dateRegistered : 'N/A'
      };
    });

    exportFilePaymentsToCSV(exportData);

    toast.success('Export Success', {
      description: `Exporting ${filteredFiles.length} file registration records to CSV`,
    });
  };

  const handleCancelConfirm = async () => {
    if (selectedPatient) {
      try {
        updatePatient(selectedPatient.id, {
          isPaid: false,
          status: 'Pending Payment'
        });
        toast.success('Payment status reset to pending');
      } catch (error) {
        toast.error('Failed to reset payment status');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
    toast.info('Data refreshed');
  };

  // Calculate statistics
  const stats = {
    total: allFiles.length,
    pending: allFiles.filter(f => !f.isPaid).length,
    paid: allFiles.filter(f => f.isPaid).length,
    individual: allFiles.filter(f => f.fileType === 'Individual').length,
    family: allFiles.filter(f => f.fileType === 'Family').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">File Payments</h1>
          <p className="text-muted-foreground">
            Manage and confirm file registration payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Files</p>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Individual</p>
                <p className="text-2xl font-bold">{stats.individual}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Family</p>
                <p className="text-2xl font-bold">{stats.family}</p>
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
                  placeholder="Search by File No, Name, or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            File Registration Payments
            <Badge variant="secondary" className="ml-2">
              {filteredFiles.length} files
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedFiles.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S/N</TableHead>
                    <TableHead>File No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>File Type</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFiles.map((file, index) => {
                    const isPaid = file.isPaid;
                    const fee = file.fileType === 'Family' ? familyFee : individualFee;
                    const subfiles = getSubfiles(file.id);

                    return (
                      <TableRow key={file.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{file.id}</TableCell>
                        <TableCell className="font-medium">{file.fullName}</TableCell>
                        <TableCell>{file.gender}</TableCell>
                        <TableCell>{file.phoneNumber}</TableCell>
                        <TableCell>
                          <Badge variant={file.fileType === 'Family' ? 'default' : 'secondary'}>
                            {file.fileType}
                            {file.fileType === 'Family' && subfiles.length > 0 && (
                              <span className="ml-1">({subfiles.length})</span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">₦{fee.toLocaleString()}</TableCell>
                        <TableCell>
                          {isPaid ? (
                            <Badge variant="default" className="bg-secondary">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (file.totalPaid || 0) > 0 ? (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Partial (₦{(file.totalPaid || 0).toLocaleString()})
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(file)}
                              title="View Payment History"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            {!isPaid ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleConfirmPayment(file)}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintReceipt(file)}
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No files found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'File registrations will appear here'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredFiles.length)} of{' '}
                {filteredFiles.length} files
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

      {/* History Modal */}
      {selectedPatient && (
        <PaymentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          patientId={selectedPatient.id}
          patientName={selectedPatient.fullName}
          referenceId={`REG-${selectedPatient.id}`}
          onPaymentSuccess={refreshData}
        />
      )}

      {/* New Confirm Payment Modal */}
      {selectedPatient && (
        <ConfirmPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          onConfirm={handlePaymentConfirm}
        />
      )}

      {/* Modals */}
      <ViewSubfilesModal
        isOpen={isSubfilesModalOpen}
        onClose={() => {
          setIsSubfilesModalOpen(false);
          setSelectedPatient(null);
        }}
        parentPatient={selectedPatient}
        subfiles={selectedPatient ? getSubfiles(selectedPatient.id) : []}
      />

      <CancelPaymentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}