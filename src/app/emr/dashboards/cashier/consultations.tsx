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
  FileText,
  Calendar,
  User,
  Building2,
  Stethoscope,
  Download,
  Filter,
  Banknote,
  CreditCard,
  RefreshCw,
  Loader2,
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
import { Appointment } from '@/app/emr/store/types';
import { getCurrentUser } from '@/app/emr/utils/auth';
import { printPOSSlip, PrintData } from '@/app/emr/utils/pos-print';
import { PaymentHistoryModal } from '@/app/emr/components/payments/PaymentHistoryModal';
import { exportConsultationPaymentsToCSV } from '@/app/emr/utils/csv-export';

// View Appointment Details Modal
function ViewAppointmentModal({
  isOpen,
  onClose,
  appointment
}: {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}) {
  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            Complete information for appointment {appointment.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment Info Card */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Appointment ID</p>
                <p className="font-mono font-semibold">{appointment.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={
                    appointment.status === 'Completed' ? 'default' :
                      appointment.status === 'In Progress' ? 'secondary' :
                        appointment.status === 'Cancelled' ? 'destructive' :
                          'outline'
                  }
                >
                  {appointment.status}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                  <p className="font-semibold">{appointment.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patient ID</p>
                  <p className="font-mono text-sm">{appointment.patientId}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Doctor</p>
                  <p className="font-semibold">{appointment.doctorName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-medium">{appointment.department}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Time</p>
                  <p className="font-medium">{appointment.time}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Appointment Type</p>
                <Badge variant="outline">{appointment.appointmentType}</Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Priority</p>
                <Badge
                  variant={
                    appointment.priority === 'Critical' ? 'destructive' :
                      appointment.priority === 'High' ? 'secondary' :
                        'outline'
                  }
                >
                  {appointment.priority}
                </Badge>
              </div>
            </div>

            {appointment.notes && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{appointment.notes}</p>
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

// Confirm Consultation Payment Modal
function ConfirmConsultationPaymentModal({
  isOpen,
  onClose,
  appointment,
  consultationFee,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  consultationFee: number;
  onConfirm: () => void;
}) {
  const { settings } = useEMRStore();
  const [pin, setPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Transfer'>('Cash');
  const [amountToPay, setAmountToPay] = useState<string>('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  const totalExpected = consultationFee;
  const alreadyPaid = appointment?.totalPaid || 0;
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
      const paymentDescription = `Consultation Fee ${paidAmount < remainingBalance ? '(Partial)' : '(Completion)'} for ${appointment?.patientName}`;
      const balanceAfter = remainingBalance - paidAmount;

      const user = getCurrentUser();
      const paymentRes = await fetch('/api/payments.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_unique_id: appointment?.patientId,
          reference_id: appointment?.id,
          appointment_number: appointment?.id,
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
          title: 'Consultation Payment Receipt',
          sections: [
            {
              title: 'Patient & Appointment',
              items: [
                { label: 'Patient Name', value: appointment?.patientName || '' },
                { label: 'File Number', value: appointment?.patientId || '' },
                { label: 'Apt ID', value: appointment?.id || '' },
                { label: 'Doctor', value: appointment?.doctorName || '' }
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

      toast.success('Consultation payment recorded');
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

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirm Patient Consultation Payment</DialogTitle>
          <DialogDescription>
            Enter payment details and your PIN to confirm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Patient</span>
              <span className="font-semibold">{appointment.patientName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Doctor</span>
              <span className="font-semibold">{appointment.doctorName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Apt date</span>
              <Badge variant="outline">
                {new Date(appointment.date).toLocaleDateString()}
              </Badge>
            </div>
            {/* Fee Breakdown */}
            <div className="pt-2 border-t border-dashed space-y-1">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Consultation Fee</span>
                <span>₦{consultationFee.toLocaleString()}</span>
              </div>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountToPay(e.target.value)}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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

export function CashierConsultationsPage() {
  const { settings } = useEMRStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fee is now fetched dynamically from the appointment table (appointment.totalFee)

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/appointments.php', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped = data.map((a: any) => ({
          id: a.appointment_number,
          dbId: a.appointment_id,
          patientId: a.display_file_id || a.appointment_fileid,
          patientName: a.patient_name || a.appointment_fileid,
          gender: a.gender,
          appointmentType: a.appointment_type || 'Consultation',
          department: a.appointment_department || 'General',
          doctorName: a.doctor_name || a.appointment_doctor,
          doctorId: a.appointment_doctor,
          date: a.appointment_date,
          time: a.appointment_shift,
          priority: a.appointment_priority,
          status: a.appointment_sta,
          isPaid: Boolean(parseInt(a.appointment_ispaid)),
          totalPaid: a.total_paid ? parseFloat(a.total_paid) : 0,
          totalFee: a.appointment_fee ? parseFloat(a.appointment_fee) : 0,
          isSubfile: Boolean(parseInt(a.is_subfile)),
          notes: a.appointment_messege || ''
        }));
        setAppointments(mapped);
      }
      setLastRefreshed(new Date());
    } catch (error) {
      toast.error('Failed to fetch appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Get unique doctors and departments for filters
  const uniqueDoctors = useMemo(() => {
    return Array.from(new Set(appointments.map(a => a.doctorName))).sort();
  }, [appointments]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(appointments.map(a => a.department))).sort();
  }, [appointments]);

  // Filter and search appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch =
        apt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patientId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDoctor = doctorFilter === 'all' || apt.doctorName === doctorFilter;
      const matchesDepartment = departmentFilter === 'all' || apt.department === departmentFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && apt.isPaid) ||
        (statusFilter === 'pending' && !apt.isPaid);

      let matchesDate = true;
      if (dateFrom && dateTo) {
        const aptDate = new Date(apt.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        matchesDate = aptDate >= fromDate && aptDate <= toDate;
      } else if (dateFrom) {
        const aptDate = new Date(apt.date);
        const fromDate = new Date(dateFrom);
        matchesDate = aptDate >= fromDate;
      } else if (dateTo) {
        const aptDate = new Date(apt.date);
        const toDate = new Date(dateTo);
        matchesDate = aptDate <= toDate;
      }

      const today = new Date().toISOString().split('T')[0];
      const matchesDateConstraint = apt.date >= today;

      return matchesSearch && matchesDoctor && matchesDepartment && matchesStatus && matchesDate && matchesDateConstraint;
    });
  }, [appointments, searchQuery, doctorFilter, departmentFilter, statusFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const visibleAppointments = appointments.filter(a => a.date >= todayStr);

    return {
      total: visibleAppointments.length,
      pending: visibleAppointments.filter(a => !a.isPaid).length,
      paid: visibleAppointments.filter(a => a.isPaid).length,
      today: visibleAppointments.filter(a => a.date === todayStr).length,
      revenue: visibleAppointments.filter(a => a.isPaid).reduce((acc, a) => acc + (a.totalFee || 0), 0),
    };
  }, [appointments]);

  // Handlers
  const handleConfirmPayment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsPaymentModalOpen(true);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };

  const handleViewHistory = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsHistoryModalOpen(true);
  };

  const handlePaymentConfirm = () => {
    fetchAppointments(); // Refresh list after payment
  };

  const handlePrintReceipt = (appointment: Appointment) => {
    if (!appointment.isPaid) return;

    const printData: PrintData = {
      title: 'Consultation Fee Receipt',
      sections: [
        {
          title: 'Patient Information',
          items: [
            { label: 'Patient Name', value: appointment.patientName },
            { label: 'File No', value: appointment.patientId },
            { label: 'Appointment ID', value: appointment.id },
          ]
        },
        {
          title: 'Payment Details',
          items: [
            { label: 'Description', value: `Consultation Fee for ${appointment.patientName}` },
            { label: 'Amount Paid', value: `₦${(appointment.totalFee || 0).toLocaleString()}` },
            { label: 'Status', value: 'Full Payment' },
            { label: 'Payment Method', value: 'Cash' },
            { label: 'Date', value: new Date(appointment.date).toLocaleDateString() },
          ]
        }
      ],
      footer: 'Thank you for your payment. Please proceed to the vital signs station.'
    };

    printPOSSlip(settings!, printData);
    toast.success('Receipt Printed');
  };

  const handleExport = () => {
    const exportData = filteredAppointments.map(app => ({
      appointmentId: app.id,
      patientName: app.patientName,
      fileNo: app.patientId,
      doctorName: app.doctorName,
      department: app.department,
      consultationFee: app.totalFee || 0,
      paymentStatus: app.isPaid ? 'Paid' : ((app.totalPaid || 0) > 0 ? 'Partial' : 'Pending'),
      paymentMethod: (app.totalPaid || 0) > 0 ? 'Various' : 'N/A',
      appointmentDate: app.date,
      paymentDate: app.isPaid ? app.date : 'N/A' // Fallback
    }));

    exportConsultationPaymentsToCSV(exportData);

    toast.success('Export Success', {
      description: `Exporting ${filteredAppointments.length} consultation records to CSV`,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDoctorFilter('all');
    setDepartmentFilter('all');
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Consultation Payments</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <p>Manage and confirm consultation fee payments</p>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAppointments} variant="outline" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline">
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
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
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
                <p className="text-sm text-muted-foreground">Pending Payment</p>
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
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">₦{stats.revenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by Appointment ID, File No, or Patient Name..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filter by Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {uniqueDoctors.map(doctor => (
                    <SelectItem key={doctor} value={doctor}>{doctor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="date-from" className="text-sm mb-2 block">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="date-to" className="text-sm mb-2 block">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Consultation Payments
            <Badge variant="secondary" className="ml-2">
              {filteredAppointments.length} appointments
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedAppointments.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S/N</TableHead>
                    <TableHead>Appointment ID</TableHead>
                    <TableHead>File No</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.map((appointment, index) => {
                    const isPaid = appointment.isPaid;

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{appointment.id}</TableCell>
                        <TableCell className="font-mono text-sm">{appointment.patientId}</TableCell>
                        <TableCell className="font-medium">{appointment.patientName}</TableCell>
                        <TableCell>{appointment.gender || 'N/A'}</TableCell>
                        <TableCell>{appointment.doctorName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{appointment.department}</Badge>
                        </TableCell>
                        <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">₦{(appointment.totalFee || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {appointment.isPaid ? (
                            <Badge variant="default" className="bg-secondary">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (appointment.totalPaid || 0) > 0 ? (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Partial (₦{(appointment.totalPaid || 0).toLocaleString()})
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
                              onClick={() => handleViewHistory(appointment)}
                              title="View Payment History"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            {!isPaid ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleConfirmPayment(appointment)}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintReceipt(appointment)}
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAppointment(appointment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
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
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No appointments found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || doctorFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo
                  ? 'Try adjusting your search or filters'
                  : 'Consultation appointments will appear here'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of{' '}
                {filteredAppointments.length} appointments
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
      {/* History Modal */}
      {selectedAppointment && (
        <PaymentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          patientId={selectedAppointment.patientId}
          patientName={selectedAppointment.patientName}
          referenceId={selectedAppointment.id} // Appointment Number
          onPaymentSuccess={fetchAppointments}
        />
      )}

      {/* Appointment Details Modal */}
      <ViewAppointmentModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        appointment={selectedAppointment}
      />

      {/* Payment Confirmation Modal */}
      <ConfirmConsultationPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        consultationFee={selectedAppointment?.totalFee || 0}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
}