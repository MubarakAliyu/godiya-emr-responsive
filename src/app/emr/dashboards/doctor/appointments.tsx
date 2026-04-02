import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/app/emr/utils/auth';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Search, Filter, RotateCcw, Eye, User, Phone, MapPin,
  ChevronLeft, ChevronRight, CalendarCheck, Video, MessageSquare,
  Send, Stethoscope, FileText
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
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
import { toast } from 'sonner';

// Appointment Interface
interface Appointment {
  id: string;
  appointmentNo: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  appointmentDate: string;
  appointmentTime: string;
  type: 'OPD' | 'Follow-up' | 'Emergency' | 'Consultation';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  complaints: string;
  notes?: string;
}

// View Appointment Modal
function ViewAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onStartConsultation,
  onSendMessage
}: {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onStartConsultation: (appointment: Appointment) => void;
  onSendMessage: (appointment: Appointment) => void;
}) {
  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-primary" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            Appointment #{appointment.appointmentNo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Patient Name</p>
                <p className="font-semibold">{appointment.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">File Number</p>
                <p className="font-mono text-sm">{appointment.patientId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{appointment.age} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{appointment.gender}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{appointment.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">{appointment.type}</Badge>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Appointment Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{new Date(appointment.appointmentDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{appointment.appointmentTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    appointment.status === 'Completed' ? 'default' :
                      appointment.status === 'In Progress' ? 'secondary' :
                        appointment.status === 'Cancelled' ? 'destructive' :
                          'outline'
                  }
                  className={
                    appointment.status === 'Completed' ? 'bg-secondary' :
                      appointment.status === 'In Progress' ? 'bg-blue-500/10 text-blue-700' :
                        ''
                  }
                >
                  {appointment.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Complaints */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="font-semibold mb-2">Chief Complaints</h3>
            <p className="text-sm">{appointment.complaints}</p>
          </div>

          {appointment.notes && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm">{appointment.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Start Consultation Modal
function StartConsultationModal({
  isOpen,
  onClose,
  appointment,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirm: (notes: string) => void;
}) {
  const [consultationNotes, setConsultationNotes] = useState('');

  if (!appointment) return null;

  const handleSubmit = () => {
    if (!consultationNotes.trim()) {
      toast.error('Notes Required', {
        description: 'Please enter consultation notes before starting',
      });
      return;
    }
    onConfirm(consultationNotes);
    setConsultationNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            Start Consultation
          </DialogTitle>
          <DialogDescription>
            Starting consultation with {appointment.patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Summary */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-semibold">{appointment.patientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">File Number</p>
                <p className="font-mono">{appointment.patientId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Appointment Type</p>
                <p className="font-medium">{appointment.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium">{appointment.appointmentTime}</p>
              </div>
            </div>
          </div>

          {/* Chief Complaints */}
          <div>
            <Label className="font-semibold mb-2 block">Chief Complaints</Label>
            <div className="bg-muted/30 rounded-lg p-3 text-sm border border-border">
              {appointment.complaints}
            </div>
          </div>

          {/* Consultation Notes */}
          <div>
            <Label htmlFor="consultation-notes" className="font-semibold mb-2 block">
              Initial Consultation Notes *
            </Label>
            <Textarea
              id="consultation-notes"
              placeholder="Enter your initial observations and consultation notes..."
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              These notes will be added to the patient's consultation record
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            <Video className="w-4 h-4 mr-2" />
            Start Consultation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Send Message Modal
function SendMessageModal({
  isOpen,
  onClose,
  appointment,
  onSend
}: {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSend: (message: string) => void;
}) {
  const [message, setMessage] = useState('');

  if (!appointment) return null;

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Message Required', {
        description: 'Please enter a message to send',
      });
      return;
    }
    onSend(message);
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Send Message
          </DialogTitle>
          <DialogDescription>
            Send a message to {appointment.patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{appointment.patientName}</p>
                <p className="text-xs text-muted-foreground">
                  {appointment.patientId} • {appointment.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <Label htmlFor="message" className="font-semibold mb-2 block">
              Your Message *
            </Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend}>
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mark Complete Confirmation Modal
function MarkCompleteModal({
  isOpen,
  onClose,
  appointment,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirm: () => void;
}) {
  if (!appointment) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-secondary" />
            Mark Appointment as Complete?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to mark this appointment as <strong>complete</strong>. Are you sure?
          </AlertDialogDescription>
          <div className="bg-muted/50 rounded-lg p-3 border border-border mt-2">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold text-foreground">{appointment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Appointment:</span>
                <span className="font-medium text-foreground">{appointment.appointmentNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium text-foreground">{appointment.type}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This will update the appointment status to "Completed" and update all statistics.
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-secondary hover:bg-secondary/90">
            <CheckCircle className="w-4 h-4 mr-2" />
            Yes, I'm Sure
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      key={`${label}-${value}`} // Key to trigger re-animation on value change
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <motion.p
            className="text-3xl font-bold"
            key={value}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {value}
          </motion.p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

export function DoctorAppointmentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const authData = getCurrentUser();

  // Real appointments from DB
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments for this doctor with status = processed
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!authData?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          doctor: authData.id,   // appointment_doctor stores the user ID, not the name
          // Only fetch appointments ready for consultation (nurse has processed & payment confirmed)
          status: 'processed',
          is_paid: '1',
        });
        const res = await fetch(`/api/appointments.php?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch appointments');
        const data = await res.json();

        // Map DB columns → Appointment interface
        const mapped: Appointment[] = (data || []).map((row: any) => ({
          id: String(row.appointment_id),
          appointmentNo: row.appointment_number || `APT-${row.appointment_id}`,
          patientId: row.display_file_id || row.appointment_fileid,
          patientName: row.patient_name || 'Unknown Patient',
          age: 0,
          gender: row.gender || '',
          phone: row.appointment_alternate_address || '',
          appointmentDate: row.appointment_date || '',
          appointmentTime: row.appointment_shift || '',
          type: (row.appointment_department || 'OPD') as Appointment['type'],
          status: mapStatus(row.appointment_sta),
          complaints: row.appointment_messege || '',
          notes: undefined,
        }));
        setAppointments(mapped);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [authData?.id]);

  // Helper: map DB status value → UI status
  function mapStatus(sta: string): Appointment['status'] {
    const s = (sta || '').toLowerCase();
    if (s === 'processed') return 'Scheduled';
    if (s === 'in progress') return 'In Progress';
    if (s === 'completed' || s === 'finished') return 'Completed';
    if (s === 'cancelled') return 'Cancelled';
    return 'Scheduled';
  }

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStartConsultationModalOpen, setIsStartConsultationModalOpen] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [isMarkCompleteModalOpen, setIsMarkCompleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        searchTerm === '' ||
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.appointmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      const matchesType = typeFilter === 'all' || appointment.type === typeFilter;
      const today = new Date().toISOString().split('T')[0];
      const matchesDate = appointment.appointmentDate >= today;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [appointments, searchTerm, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate KPIs with live updates
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => apt.appointmentDate.startsWith(today));

    return {
      total: todayAppointments.length,
      scheduled: todayAppointments.filter(apt => apt.status === 'Scheduled').length,
      inProgress: todayAppointments.filter(apt => apt.status === 'In Progress').length,
      completed: todayAppointments.filter(apt => apt.status === 'Completed').length,
    };
  }, [appointments]);

  // Handlers with live state updates
  const handleViewAppointment = (appointment: Appointment) => {
    // Status-based VIEW behavior
    if (appointment.status === 'Scheduled') {
      // Scheduled → Open Appointment Details Modal
      setSelectedAppointment(appointment);
      setIsViewModalOpen(true);
    } else if (appointment.status === 'Completed') {
      // Completed → Navigate to Consultation Page (Editable)
      toast.info('Opening Consultation', {
        description: `Loading consultation record for ${appointment.patientName}`,
      });
      navigate(`/emr/doctor/patients/${appointment.patientId}/consultation?appointmentId=${appointment.id}`);
    } else {
      // In Progress or other statuses → Open modal
      setSelectedAppointment(appointment);
      setIsViewModalOpen(true);
    }
  };

  const handleStartConsultation = (appointment: Appointment) => {
    // REMOVE modal - directly navigate to consultation page
    // Update status to In Progress
    setAppointments(prev => prev.map(apt =>
      apt.id === appointment.id
        ? { ...apt, status: 'In Progress' as const }
        : apt
    ));

    // Show success notification
    toast.success('Consultation Started', {
      description: `Dr. started consultation with ${appointment.patientName}`,
    });

    // Navigate directly to consultation/patient file page
    navigate(`/emr/doctor/patients/${appointment.patientId}/consultation?appointmentId=${appointment.id}`);
  };

  const handleSendMessageClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsSendMessageModalOpen(true);
  };

  const handleSendMessage = (message: string) => {
    if (!selectedAppointment) return;

    toast.success('Message Sent', {
      description: `Message sent to ${selectedAppointment.patientName}`,
    });
  };

  const handleMarkCompleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsMarkCompleteModalOpen(true);
  };

  const handleMarkComplete = () => {
    if (!selectedAppointment) return;

    // Update appointment status to "Completed"
    setAppointments(prev => prev.map(apt =>
      apt.id === selectedAppointment.id
        ? { ...apt, status: 'Completed' as const }
        : apt
    ));

    toast.success('Appointment Completed', {
      description: `Dr. completed consultation with ${selectedAppointment.patientName}`,
    });

    setIsMarkCompleteModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Appointments</h1>
          <p className="text-muted-foreground">
            Manage and view your scheduled appointments
          </p>
        </div>
      </div>

      {/* KPI Cards with live updates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          icon={Calendar}
          label="Today's Appointments"
          value={kpis.total}
          color="bg-blue-100 text-blue-600"
          delay={0.1}
        />
        <KPICard
          icon={Clock}
          label="Scheduled"
          value={kpis.scheduled}
          color="bg-orange-100 text-orange-600"
          delay={0.2}
        />
        <KPICard
          icon={AlertCircle}
          label="In Progress"
          value={kpis.inProgress}
          color="bg-purple-100 text-purple-600"
          delay={0.3}
        />
        <KPICard
          icon={CheckCircle}
          label="Completed"
          value={kpis.completed}
          color="bg-green-100 text-green-600"
          delay={0.4}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filters
          </CardTitle>
          <CardDescription>Search and filter appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, appointment no, file no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="OPD">OPD</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments List</CardTitle>
          <CardDescription>
            Showing {paginatedAppointments.length} of {filteredAppointments.length} appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appointment No</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Complaints</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Loading appointments...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : paginatedAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No processed appointments found for your account
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-mono font-semibold">{appointment.appointmentNo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{appointment.patientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {appointment.patientId} • {appointment.age}y, {appointment.gender}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{new Date(appointment.appointmentDate).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{appointment.appointmentTime}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            appointment.type === 'Emergency' ? 'border-red-500 text-red-700' : ''
                          }
                        >
                          {appointment.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {appointment.complaints}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            appointment.status === 'Completed' ? 'default' :
                              appointment.status === 'In Progress' ? 'secondary' :
                                appointment.status === 'Cancelled' ? 'destructive' :
                                  'outline'
                          }
                          className={
                            appointment.status === 'Completed' ? 'bg-secondary' :
                              appointment.status === 'In Progress' ? 'bg-blue-500/10 text-blue-700' :
                                ''
                          }
                        >
                          {appointment.status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {appointment.status === 'In Progress' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {appointment.status === 'Scheduled' && <Clock className="w-3 h-3 mr-1" />}
                          {appointment.status === 'Cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewAppointment(appointment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {appointment.status === 'Scheduled' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartConsultation(appointment)}
                            >
                              <Video className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {appointment.status === 'In Progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkCompleteClick(appointment)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          {appointment.status === 'Completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/emr/doctor/patients/${appointment.patientId}/consultation?appointmentId=${appointment.id}`)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Edit
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

      {/* View Appointment Modal */}
      <ViewAppointmentModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        appointment={selectedAppointment}
        onStartConsultation={handleStartConsultation}
        onSendMessage={handleSendMessageClick}
      />

      {/* Start Consultation Modal */}
      <StartConsultationModal
        isOpen={isStartConsultationModalOpen}
        onClose={() => setIsStartConsultationModalOpen(false)}
        appointment={selectedAppointment}
        onConfirm={handleStartConsultation}
      />

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={isSendMessageModalOpen}
        onClose={() => setIsSendMessageModalOpen(false)}
        appointment={selectedAppointment}
        onSend={handleSendMessage}
      />

      {/* Mark Complete Confirmation Modal */}
      <MarkCompleteModal
        isOpen={isMarkCompleteModalOpen}
        onClose={() => setIsMarkCompleteModalOpen(false)}
        appointment={selectedAppointment}
        onConfirm={handleMarkComplete}
      />
    </div>
  );
}