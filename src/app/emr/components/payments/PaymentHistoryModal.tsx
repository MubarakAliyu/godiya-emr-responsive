import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/app/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/app/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Clock, History, Loader2, DollarSign, User, FileText, CheckCircle2, AlertCircle, CreditCard, Banknote, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getCurrentUser } from '@/app/emr/utils/auth';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { printPOSSlip } from '@/app/emr/utils/pos-print';

interface PaymentRecord {
    payment_id: number;
    patient_unique_id: string;
    reference_id: string;
    amount_expected: string;
    amount_paid: string;
    balance: string;
    payment_method: string;
    payment_description: string;
    cashier_id: string;
    created_at: string;
}

interface HistoryData {
    payments: PaymentRecord[];
    total_paid: number;
    amount_expected: number;
    balance: number;
    status: 'Paid' | 'Partial' | 'Pending';
}

interface PaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    referenceId?: string; // Optional: filter by specific bill
    title?: string;
    onPaymentSuccess?: () => void;
}

export function PaymentHistoryModal({
    isOpen,
    onClose,
    patientId,
    patientName,
    referenceId,
    title = "Transaction Ledger",
    onPaymentSuccess
}: PaymentHistoryModalProps) {
    const { settings } = useEMRStore();
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [summary, setSummary] = useState<HistoryData | null>(null);
    const [loading, setLoading] = useState(false);

    // Payment form states
    const [amountToPay, setAmountToPay] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [pin, setPin] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && patientId) {
            fetchHistory();
        }
    }, [isOpen, patientId, referenceId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const url = `/api/payments.php?action=history&patient_unique_id=${patientId}${referenceId ? `&reference_id=${referenceId}` : ''}`;
            const res = await fetch(url, { credentials: 'include' });
            const data = await res.json();
            if (data.payments) {
                setPayments(data.payments);
                setSummary(data);
                // Pre-fill amount to pay with remaining balance
                if (data.balance > 0) {
                    setAmountToPay(data.balance.toString());
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch payment history:', error);
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    };

    const currentBalance = summary?.balance || 0;

    const handleProcessPayment = async (printReceipt: boolean = false) => {
        const paidAmount = parseFloat(amountToPay);
        if (isNaN(paidAmount) || paidAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (paidAmount > currentBalance) {
            toast.error(`Amount exceeds current balance: ₦${currentBalance.toLocaleString()}`);
            return;
        }

        if (!pin) {
            toast.error('PIN is required to process payment');
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Verify PIN
            const pinRes = await fetch('/api/cashier_pin.php?action=verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin }),
            });
            const pinData = await pinRes.json();
            if (!pinData.verified) {
                toast.error(pinData.error || 'Invalid PIN');
                setIsProcessing(false);
                return;
            }

            // 2. Record Payment
            const user = getCurrentUser();
            const paymentDescription = `Balance Payment for ${title} ${paidAmount < currentBalance ? '(Partial)' : '(Completion)'}`;
            const balanceAfter = currentBalance - paidAmount;

            const paymentRes = await fetch('/api/payments.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_unique_id: patientId,
                    reference_id: referenceId,
                    appointment_number: referenceId && referenceId.includes('REG-') ? '' : (referenceId && referenceId.includes('IPD-') ? '' : referenceId),
                    amount_expected: summary?.amount_expected,
                    amount_paid: paidAmount,
                    payment_method: paymentMethod,
                    payment_description: paymentDescription,
                    cashier_id: user?.email || 'System'
                }),
            });

            if (paymentRes.ok) {
                // 3. Print if requested
                if (printReceipt) {
                    printPOSSlip(settings, {
                        title: 'Payment Receipt',
                        sections: [
                            {
                                title: 'Patient Information',
                                items: [
                                    { label: 'Patient Name', value: patientName },
                                    { label: 'Patient ID', value: patientId },
                                    { label: 'Reference', value: referenceId || 'N/A' }
                                ]
                            },
                            {
                                title: 'Payment Details',
                                items: [
                                    { label: 'Description', value: paymentDescription },
                                    { label: 'Total Bill', value: `₦${summary?.amount_expected.toLocaleString()}` },
                                    { label: 'Amount Paid', value: `₦${paidAmount.toLocaleString()}` },
                                    { label: 'Balance', value: `₦${balanceAfter.toLocaleString()}` },
                                    { label: 'Method', value: paymentMethod }
                                ]
                            }
                        ],
                        footer: 'Thank you for your payment at Godiya Hospital.'
                    });
                }

                toast.success('Payment processed successfully');
                setAmountToPay('');
                setPin('');
                fetchHistory();
                if (onPaymentSuccess) onPaymentSuccess();
            } else {
                const err = await paymentRes.json();
                toast.error(err.error || 'Failed to process payment');
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            toast.error('An error occurred while processing payment');
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[850px] max-h-[95vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <History className="w-6 h-6 text-primary" />
                                {title}
                            </DialogTitle>
                            <DialogDescription>
                                Ledger for <span className="font-semibold text-foreground">{patientName}</span> ({patientId})
                            </DialogDescription>
                        </div>
                        {summary && (
                            <Badge variant={summary.status === 'Paid' ? 'success' : summary.status === 'Partial' ? 'warning' : 'outline'} className="px-3 py-1 text-sm">
                                {summary.status === 'Paid' && <CheckCircle2 className="w-4 h-4 mr-1" />}
                                {summary.status === 'Partial' && <Clock className="w-4 h-4 mr-1" />}
                                {summary.status.toUpperCase()}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    {loading && payments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p>Loading transaction logs...</p>
                        </div>
                    ) : payments.length > 0 ? (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Bill</p>
                                    <p className="text-2xl font-bold tracking-tight">₦{summary?.amount_expected.toLocaleString()}</p>
                                </div>
                                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                    <p className="text-xs text-green-600 uppercase font-bold mb-1">Paid to Date</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-bold text-green-700 tracking-tight">₦{summary?.total_paid.toLocaleString()}</p>
                                        <p className="text-xs text-green-600/70 font-medium">({((summary?.total_paid || 0) / (summary?.amount_expected || 1) * 100).toFixed(0)}%)</p>
                                    </div>
                                </div>
                                <div className={`${currentBalance > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-green-50/50 border-green-100'} p-4 rounded-xl border`}>
                                    <p className={`text-xs ${currentBalance > 0 ? 'text-amber-600' : 'text-green-600'} uppercase font-bold mb-1`}>Outstanding</p>
                                    <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-amber-700' : 'text-green-700'} tracking-tight`}>
                                        ₦{currentBalance.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Transaction Table */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground/80 lowercase">
                                    <Clock className="w-4 h-4" />
                                    Transaction flow
                                </h4>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="w-[180px]">Date & Time</TableHead>
                                                <TableHead>Activity</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-right">Ref Balance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.map((p) => (
                                                <TableRow key={p.payment_id} className="group transition-colors hover:bg-muted/20">
                                                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                                        {format(new Date(p.created_at), 'dd MMM yyyy, HH:mm')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-medium leading-none">{p.payment_description}</p>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                <User className="w-3 h-3" />
                                                                Cashier: {p.cashier_id}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-normal text-[10px] h-5">
                                                            {p.payment_method === 'Cash' ? <Banknote className="w-3 h-3 mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                                                            {p.payment_method}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-green-600 font-bold text-sm">
                                                        ₦{parseFloat(p.amount_paid).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-xs font-semibold ${parseFloat(p.balance) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                                        ₦{parseFloat(p.balance).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 space-y-3">
                            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto opacity-20">
                                <FileText className="w-8 h-8" />
                            </div>
                            <p className="text-muted-foreground font-medium">No financial transactions recorded for this entry.</p>
                        </div>
                    )}

                    {/* Pay Balance Form */}
                    {summary && summary.status !== 'Paid' && (
                        <div className="mt-8 bg-primary/[0.03] border border-primary/10 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="bg-primary/10 p-2.5 rounded-full">
                                    <DollarSign className="w-5 h-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold leading-none">Complete Payment</h3>
                                    <p className="text-sm text-muted-foreground italic">Add a payment transaction to clear the outstanding balance of ₦{currentBalance.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white/50 p-4 rounded-xl border border-primary/5 shadow-inner">
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Amount Paid (₦)</Label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/40 group-focus-within:text-primary/50 transition-colors">₦</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            className="pl-8 h-11 text-lg font-bold border-muted-foreground/20 focus:border-primary/50 bg-white transition-all shadow-sm"
                                            placeholder="0.00"
                                            value={amountToPay}
                                            onChange={(e) => setAmountToPay(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="method" className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger id="method" className="h-11 bg-white border-muted-foreground/20 shadow-sm">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="POS">Card (POS)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pin" className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Cashier PIN</Label>
                                    <Input
                                        id="pin"
                                        type="password"
                                        className="h-11 text-center tracking-[0.5em] font-black border-muted-foreground/20 bg-white shadow-sm"
                                        maxLength={4}
                                        placeholder="••••"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        className="h-[22px] text-[9px] font-bold uppercase tracking-tighter bg-primary/10 text-primary hover:bg-primary/20 border-none transition-all py-0"
                                        variant="outline"
                                        onClick={() => handleProcessPayment(false)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <>Record Only</>
                                        )}
                                    </Button>
                                    <Button
                                        className="h-[34px] font-bold text-sm shadow-md bg-primary hover:bg-primary/90 transition-all"
                                        onClick={() => handleProcessPayment(true)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <><Printer className="w-4 h-4 mr-2" /> Record & Print</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
                        <AlertCircle className="w-4 h-4" />
                        Transactions are immutable once recorded in the ledger.
                    </div>
                    <Button variant="outline" className="h-10 px-8" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
