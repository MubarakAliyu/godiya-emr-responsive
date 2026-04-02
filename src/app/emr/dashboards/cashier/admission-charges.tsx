import { toast } from 'sonner';
import { motion } from 'motion/react';
import React, { useState, useMemo, useEffect } from 'react';
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
  Activity,
  Download,
  Filter,
  Banknote,
  CreditCard,
  Building2,
  Trash2,
  User,
  FileText,
  PlusCircle
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

// Charge Item Interface
interface ChargeItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface PaymentRecord {
  payment_id: string | number;
  amount: number;
  method: string;
  date: string;
  cashier: string;
}

// Admission Charge Invoice Interface
interface AdmissionChargeInvoice {
  id: string;
  chargeNo: string;
  patientId: string;
  patientName: string;
  patientUniqueId: string;
  admissionId: string;
  ipd_number: string;
  charges: ChargeItem[];
  amount: number;
  amountPaid: number;
  balance: number;
  date: string;
  status: 'Paid' | 'Partial' | 'Pending';
  paymentMethod?: string;
  paymentDate?: string;
  paymentTime?: string;
  chargedBy: string;
  category: string;
  is_subfile: boolean;
  parentFileId?: string;
  paymentHistory: PaymentRecord[];
}

// Charge Breakdown Modal
function ChargeBreakdownModal({
  isOpen,
  onClose,
  charge
}: {
  isOpen: boolean;
  onClose: () => void;
  charge: AdmissionChargeInvoice | null;
}) {
  if (!charge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Admission Charge Details
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown for charge invoice {charge.chargeNo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Charge Info Card */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Charge No</p>
                <p className="font-mono font-semibold">{charge.chargeNo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={charge.status === 'Paid' ? 'default' : 'secondary'}
                  className={
                    charge.status === 'Paid' ? 'bg-secondary' :
                      charge.status === 'Partial' ? 'bg-blue-500/10 text-blue-700' :
                        'bg-yellow-500/10 text-yellow-700'
                  }
                >
                  {charge.status === 'Paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {charge.status === 'Partial' && <Clock className="w-3 h-3 mr-1" />}
                  {charge.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                  {charge.status}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                  <p className="font-semibold">{charge.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">File Number</p>
                  <p className="font-mono text-sm">
                    {charge.patientId}
                    {charge.is_subfile && charge.parentFileId && (
                      <span className="block text-xs text-muted-foreground">
                        Parent: {charge.parentFileId}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">IPD Number</p>
                  <Badge variant="outline" className="font-mono">
                    {charge.ipd_number}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <Badge variant="outline" className="font-medium">
                    {charge.category}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Charged By</p>
                  <Badge variant="outline">
                    <User className="w-3 h-3 mr-1" />
                    {charge.chargedBy}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">{new Date(charge.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charges Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Charge Items
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charge.charges.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center text-muted-foreground font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-semibold">{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total Amount */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Total Amount</span>
              <span className="text-3xl font-bold text-white">
                ₦{charge.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {charge.status === 'Paid' && charge.paymentMethod && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <Badge variant="outline">{charge.paymentMethod}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
                  <p className="font-medium">{charge.paymentDate}</p>
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
  charge,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  charge: AdmissionChargeInvoice | null;
  onConfirm: (pin: string, paymentMethod: string, amountToPay: number, shouldPrint: boolean) => void;
}) {
  const [pin, setPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountToPay, setAmountToPay] = useState<string>('');
  const [pinError, setPinError] = useState('');

  // Set initial amount to pay to balance
  useEffect(() => {
    if (charge) {
      setAmountToPay(charge.balance.toString());
    }
  }, [charge]);

  const handleConfirm = (printReceipt: boolean = false) => {
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
    const payAmount = parseFloat(amountToPay);
    if (isNaN(payAmount) || payAmount <= 0) {
      toast.error('Invalid Amount', {
        description: 'Please enter a valid amount to pay',
      });
      return;
    }
    if (charge && payAmount > charge.balance) {
      toast.error('Amount Exceeds Balance', {
        description: `You cannot pay more than the remaining balance (₦${charge.balance.toLocaleString()})`,
      });
      return;
    }
    if (!paymentMethod) {
      toast.error('Payment Method Required', {
        description: 'Please select a payment method',
      });
      return;
    }

    // Simulate PIN verification
    if (pin !== '1234') {
      setPinError('Incorrect PIN');
      toast.error('Invalid PIN', {
        description: 'The PIN you entered is incorrect. Please try again.',
      });
      return;
    }

    // Clear errors
    setPinError('');

    // Confirm payment
    onConfirm(pin, paymentMethod, payAmount, printReceipt);

    // Print receipt if requested
    if (printReceipt && charge) {
      setTimeout(() => {
        toast.success('Receipt Printed', {
          description: `Admission charge receipt for ${charge.patientName} has been sent to the printer`,
        });
      }, 500);
    }

    // Reset form
    setPin('');
    setPaymentMethod('');
    onClose();
  };

  const handleCancel = () => {
    setPin('');
    setPaymentMethod('');
    setPinError('');
    onClose();
  };

  if (!charge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirm Admission Charge Payment</DialogTitle>
          <DialogDescription>
            Review charge details and enter your PIN to confirm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Charge Summary Card */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Charge No</span>
              <span className="font-mono font-semibold">{charge.chargeNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Patient Name</span>
              <span className="font-semibold">{charge.patientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">File Number</span>
              <div className="text-right">
                <span className="font-medium font-mono block">{charge.patientId}</span>
                {charge.is_subfile && charge.parentFileId && (
                  <span className="text-xs text-muted-foreground block">
                    Parent: {charge.parentFileId}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">IPD Number</span>
              <span className="font-mono">{charge.ipd_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <Badge variant="outline">{charge.category}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Charge Items</span>
              <span className="font-medium">{charge.charges.length} item(s)</span>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Amount</span>
                <span className="text-3xl font-bold text-primary">
                  ₦{charge.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Pay (₦) *</Label>
            <Input
              id="amount"
              type="number"
              value={amountToPay}
              onChange={(e) => setAmountToPay(e.target.value)}
              placeholder="0.00"
              className="text-2xl font-bold text-primary"
            />
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
              onChange={(e) => {
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
            <p className="text-xs text-muted-foreground">Default PIN: 1234</p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                size="lg"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={() => handleConfirm(false)}
                className="flex-1"
                size="lg"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm
              </Button>
            </div>
            <Button
              onClick={() => handleConfirm(true)}
              className="w-full"
              size="lg"
            >
              <Printer className="w-4 h-4 mr-2" />
              Confirm & Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Payment History Modal
function PaymentHistoryModal({
  isOpen,
  onClose,
  charge,
  onPayAgain
}: {
  isOpen: boolean;
  onClose: () => void;
  charge: AdmissionChargeInvoice | null;
  onPayAgain: () => void;
}) {
  if (!charge) return null;

  const handlePrintPayment = (payment: PaymentRecord) => {
    toast.success('POS Receipt Printed', {
      description: `Receipt for ₦${payment.amount.toLocaleString()} has been sent to the POS printer`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-secondary" />
            Payment History
          </DialogTitle>
          <DialogDescription>
            Transaction history for {charge.chargeNo} - {charge.patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-4 border border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Balanced</p>
              <p className="text-xl font-bold text-secondary">₦{charge.balance.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
              <p className="text-xl font-bold text-primary">₦{charge.amountPaid.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Transaction Logs
            </h4>
            {charge.paymentHistory.length === 0 ? (
              <div className="text-center py-6 border rounded-lg border-dashed">
                <p className="text-muted-foreground">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {charge.paymentHistory.map((payment, idx) => (
                  <div key={idx} className="bg-white border rounded-lg p-3 flex items-center justify-between hover:border-primary/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">₦{payment.amount.toLocaleString()}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{payment.method}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.date).toLocaleString()}
                        <span className="mx-1">•</span>
                        <User className="w-3 h-3" />
                        {payment.cashier}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePrintPayment(payment)}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {charge.balance > 0 && (
            <Button onClick={onPayAgain} className="w-full sm:flex-1 bg-secondary hover:bg-secondary/90">
              <PlusCircle className="w-4 h-4 mr-2" />
              Update Payment
            </Button>
          )}
          <Button onClick={onClose} variant="outline" className="w-full sm:flex-1">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CashierAdmissionChargesPage() {
  const [charges, setCharges] = useState<AdmissionChargeInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch charges from API
  const fetchCharges = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admission_charges.php');
      const data = await response.json();

      if (Array.isArray(data)) {
        const mappedCharges = data.map((item: any) => {
          const total = parseFloat(item.total_amount) || 0;
          const paid = parseFloat(item.total_paid) || 0;
          const balance = total - paid;

          const descriptions = (item.grouped_descriptions || '').split('||').map((desc: string, idx: number) => ({
            id: `item-${idx}`,
            description: desc,
            quantity: 1,
            unitPrice: 0, // Individual prices are lost in grouping unless we change SQL, but we sum them
            subtotal: 0
          }));

          return {
            id: item.charge_ids, // Comma separated IDs
            chargeNo: `IPD-BILL-${item.ipd_number}`,
            patientId: item.patient_unique_id,
            patientName: item.patient_name,
            patientUniqueId: item.patient_unique_id,
            admissionId: item.admission_id,
            ipd_number: item.ipd_number,
            amount: total,
            amountPaid: paid,
            balance: balance,
            date: item.admission_date || new Date().toISOString(),
            status: (paid >= total ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending')) as 'Paid' | 'Partial' | 'Pending',
            chargedBy: 'Nurse/Doctor',
            category: 'Consolidated IPD Charges',
            charges: descriptions,
            is_subfile: !!item.admission_is_subfile,
            parentFileId: item.parent_file_id,
            paymentHistory: (item.grouped_history || '').split('||').flatMap((h: string) => {
              try {
                return JSON.parse(h) || [];
              } catch (e) {
                return [];
              }
            }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          };
        });
        setCharges(mappedCharges);
      }
    } catch (error) {
      toast.error('Failed to fetch charges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, []);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<AdmissionChargeInvoice | null>(null);

  // Filter and search charges
  const filteredCharges = useMemo(() => {
    return charges.filter(charge => {
      const chargeDescriptions = charge.charges.map(c => c.description).join(' ').toLowerCase();
      const matchesSearch =
        charge.chargeNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        charge.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        charge.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        charge.ipd_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        charge.chargedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chargeDescriptions.includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        charge.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === 'all' ||
        charge.category === categoryFilter;

      let matchesDate = true;
      if (dateFrom && dateTo) {
        const chargeDate = new Date(charge.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        matchesDate = chargeDate >= fromDate && chargeDate <= toDate;
      } else if (dateFrom) {
        const chargeDate = new Date(charge.date);
        const fromDate = new Date(dateFrom);
        matchesDate = chargeDate >= fromDate;
      } else if (dateTo) {
        const chargeDate = new Date(charge.date);
        const toDate = new Date(dateTo);
        matchesDate = chargeDate <= toDate;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [charges, searchQuery, statusFilter, categoryFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredCharges.length / itemsPerPage);
  const paginatedCharges = filteredCharges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayCharges = charges.filter(chg => chg.date.startsWith(today));
    const paidToday = todayCharges.filter(chg => chg.status === 'Paid');
    const revenueToday = paidToday.reduce((sum, chg) => sum + chg.amount, 0);

    return {
      total: charges.length,
      paidToday: paidToday.length,
      pending: charges.filter(chg => chg.status !== 'Paid').length,
      revenue: revenueToday,
    };
  }, [charges]);

  // Handlers
  const handleConfirmPayment = (charge: AdmissionChargeInvoice) => {
    setSelectedCharge(charge);
    setIsPaymentModalOpen(true);
  };

  const handleViewCharge = (charge: AdmissionChargeInvoice) => {
    setSelectedCharge(charge);
    setIsViewModalOpen(true);
  };

  const handleViewHistory = (charge: AdmissionChargeInvoice) => {
    setSelectedCharge(charge);
    setIsHistoryModalOpen(true);
  };

  const handleDeleteCharge = (charge: AdmissionChargeInvoice) => {
    setSelectedCharge(charge);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCharge) {
      setCharges(prev => prev.filter(chg => chg.id !== selectedCharge.id));
      toast.success('Charge Deleted', {
        description: `Charge ${selectedCharge.chargeNo} has been deleted successfully`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedCharge(null);
    }
  };

  const handlePrintReceipt = (charge: AdmissionChargeInvoice) => {
    toast.success('Receipt Printed', {
      description: `Admission charge receipt for ${charge.patientName} (${charge.chargeNo}) has been sent to the printer`,
    });
  };

  const handlePaymentConfirm = async (pin: string, paymentMethod: string, amountToPay: number, shouldPrint: boolean) => {
    if (selectedCharge) {
      try {
        // Since we are paying for multiple charges grouped together, 
        // we send them as a single payment record with a reference to the main ID or comma-list.
        // The backend updated logic for references starting with ADM-CHG- needs to handle this.
        // For simplicity, we can treat the whole group as one bill.

        const response = await fetch('/api/payments.php', {
          method: 'POST',
          body: JSON.stringify({
            patient_unique_id: selectedCharge.patientUniqueId,
            reference_id: `ADM-CHG-GRP-${selectedCharge.id}`, // GRP indicates multiple IDs
            amount_expected: selectedCharge.amount,
            amount_paid: amountToPay,
            payment_method: paymentMethod,
            payment_description: `Consolidated Payment for ${selectedCharge.ipd_number}`,
            cashier_id: 'GH-CSH-01',
            pin: pin
          })
        });

        const result = await response.json();

        if (result.message || result.payment_id) {
          toast.success('Payment Recorded', {
            description: `Payment of ₦${amountToPay.toLocaleString()} recorded successfully.`
          });

          if (shouldPrint) {
            handlePrintReceipt(selectedCharge);
          }

          fetchCharges();
          setIsPaymentModalOpen(false);
          setSelectedCharge(null);
        } else {
          toast.error(result.error || 'Payment failed');
        }
      } catch (error) {
        toast.error('Connection error occurred');
      }
    }
  };

  const handleExport = () => {
    toast.success('Export Success', {
      description: `Exporting ${filteredCharges.length} admission charge records to CSV`,
    });
  };

  const handlePrintReport = () => {
    toast.success('Report Generated', {
      description: 'Admission charges report has been sent to the printer',
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admission Charges</h1>
          <p className="text-muted-foreground">
            Manage additional charges during patient admission
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
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Charges</p>
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
                  <p className="text-sm text-muted-foreground">Pending</p>
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
                <div className="p-2 rounded-lg bg-secondary/10">
                  <DollarSign className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">₦{stats.revenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>Filter charges by search query, status, category, and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by charge no, patient, admission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Medical Procedures">Medical Procedures</SelectItem>
                  <SelectItem value="Diagnostic & Treatment">Diagnostic & Treatment</SelectItem>
                  <SelectItem value="Diagnostic Tests">Diagnostic Tests</SelectItem>
                  <SelectItem value="Surgical Procedures">Surgical Procedures</SelectItem>
                  <SelectItem value="Therapy & Care">Therapy & Care</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charges Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admission Charge Invoices</CardTitle>
              <CardDescription>
                Showing {paginatedCharges.length} of {filteredCharges.length} charges
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Charge No</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCharges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No charges found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>
                        <div className="font-mono font-semibold">{charge.chargeNo}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(charge.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{charge.patientName}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {charge.patientId}
                          {charge.is_subfile && charge.parentFileId && (
                            <span className="block text-[10px] text-muted-foreground">
                              Parent: {charge.parentFileId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{charge.ipd_number}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{charge.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{charge.charges.length} item(s)</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-secondary">₦{charge.amount.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={charge.status === 'Paid' ? 'default' : 'secondary'}
                          className={
                            charge.status === 'Paid' ? 'bg-secondary' :
                              charge.status === 'Partial' ? 'bg-blue-500/10 text-blue-700' :
                                'bg-yellow-500/10 text-yellow-700'
                          }
                        >
                          {charge.status === 'Paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {charge.status === 'Partial' && <Clock className="w-3 h-3 mr-1" />}
                          {charge.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                          {charge.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewCharge(charge)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewHistory(charge)}
                            title="Payment History"
                          >
                            <DollarSign className="w-4 h-4 text-secondary" />
                          </Button>
                          {charge.status === 'Pending' ? (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmPayment(charge)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pay
                            </Button>
                          ) : charge.status === 'Partial' ? (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmPayment(charge)}
                              className="bg-secondary hover:bg-secondary/90"
                            >
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Pay
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintReceipt(charge)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ChargeBreakdownModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        charge={selectedCharge}
      />

      <ConfirmPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        charge={selectedCharge}
        onConfirm={handlePaymentConfirm}
      />

      <PaymentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        charge={selectedCharge}
        onPayAgain={() => {
          setIsHistoryModalOpen(false);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Charge Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete charge {selectedCharge?.chargeNo} for {selectedCharge?.patientName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
