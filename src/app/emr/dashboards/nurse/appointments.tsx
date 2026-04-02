import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Search,
  Eye,
  Activity,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Clock,
  XCircle,
  FlaskConical,
  Plus,
  Trash2,
  AlertTriangle,
  Bell,
  BadgeCheck,
  MessageSquare,
  Loader2,
  ClipboardList,
  Camera,
  Upload,
  FileText,
  Download,
} from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { Appointment, AppointmentStatus, AppointmentPriority } from '@/app/emr/store/types';
import { getCurrentUser } from '@/app/emr/utils/auth';

// Vitals interface with all required fields
interface VitalsForm {
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  rbs: string;
  bmi: string;
  notes: string;
}

interface LabTest {
  id: string;
  name: string;
  cat: string;
  fees: number;
}

export function NurseAppointmentsPage() {
  const { appointments, patients, updateAppointment, deleteAppointment, addNotification, addActivityLog } = useEMRStore();
  const currentUser = getCurrentUser();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
  const [labResultViewModalOpen, setLabResultViewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Complaint form state
  const [complaintForm, setComplaintForm] = useState({
    complaint: '',
    duration: '',
    severity: 'Moderate',
  });
  const [isSavingComplaint, setIsSavingComplaint] = useState(false);

  // Lab order state
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [testItems, setTestItems] = useState<{ item_id: string, item_name: string, item_fees: string }[]>([]);
  const [newTestEntry, setNewTestEntry] = useState({ id: '', name: '', fees: '' });
  const [isOrderingLab, setIsOrderingLab] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Lab approvals state
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [isApproving, setIsApproving] = useState<number | null>(null);

  // Upload result state
  const [uploadResultModalOpen, setUploadResultModalOpen] = useState(false);
  const [isUploadingResult, setIsUploadingResult] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    summary: '',
    picture: '',
    invoice_id: '',
    patient_name: ''
  });

  // Vitals form state with all fields
  const [vitals, setVitals] = useState<VitalsForm>({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    rbs: '',
    bmi: '',
    notes: ''
  });

  // Fetch lab test items
  const fetchTestItems = async () => {
    setIsLoadingItems(true);
    try {
      const res = await fetch('/api/laboratory.php?action=get_items', { credentials: 'include' });
      const data = await res.json();
      setTestItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load test items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchTestItems();
    fetchPendingApprovals();
  }, []);

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const weight = parseFloat(vitals.weight);
    const height = parseFloat(vitals.height) / 100;

    if (weight > 0 && height > 0) {
      const calculatedBMI = (weight / (height * height)).toFixed(1);
      if (calculatedBMI !== vitals.bmi) {
        setVitals(prev => ({ ...prev, bmi: calculatedBMI }));
      }
    } else if (vitals.bmi !== '') {
      setVitals(prev => ({ ...prev, bmi: '' }));
    }
  }, [vitals.weight, vitals.height]);


  // Fetch pending lab approvals
  const fetchPendingApprovals = async () => {
    setIsLoadingApprovals(true);
    try {
      const res = await fetch('/api/nurse_opd.php?action=pending_approvals', { credentials: 'include' });
      const data = await res.json();
      setPendingApprovals(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // Filter and search appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Only show paid appointments in the nurse portal
      if (!appointment.isPaid) return false;

      const matchesSearch =
        searchQuery === '' ||
        appointment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.patientId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = priorityFilter === 'all' || appointment.priority === priorityFilter;
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

      const today = new Date().toISOString().split('T')[0];
      const matchesDate = appointment.date >= today;

      return matchesSearch && matchesPriority && matchesStatus && matchesDate;
    });
  }, [appointments, searchQuery, priorityFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / pageSize);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handlers
  const handleClearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };

  // Open vitals modal directly with fetching
  const handleRecordVitals = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setVitals({
      temperature: '', bloodPressure: '', heartRate: '',
      respiratoryRate: '', oxygenSaturation: '', weight: '',
      height: '', rbs: '', bmi: '', notes: ''
    });

    try {
      const response = await fetch(`/api/vitals.php?appointment_number=${appointment.id}`);
      const data = await response.json();
      if (data && !data.error && data.vital_id) {
        setVitals({
          temperature: data.vital_temperature?.toString() || '',
          bloodPressure: data.vital_bloodpressure || '',
          heartRate: data.vital_heartrate?.toString() || '',
          respiratoryRate: data.vital_respiratory?.toString() || '',
          oxygenSaturation: data.vital_oxygen?.toString() || '',
          weight: data.vital_weight?.toString() || '',
          height: data.vital_height?.toString() || '',
          rbs: data.vital_rbs?.toString() || '',
          bmi: data.vital_bmi?.toString() || '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error fetching existing vitals:', error);
    }
    setVitalsModalOpen(true);
  };

  // Open complaint modal
  const handleOpenComplaint = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setComplaintForm({ complaint: '', duration: '', severity: 'Moderate' });
    try {
      const res = await fetch(`/api/nurse_opd.php?action=get_complaint&appointment_number=${appointment.id}`, { credentials: 'include' });
      const data = await res.json();
      if (data && !data.error) {
        setComplaintForm({
          complaint: data.complaint || '',
          duration: data.duration || '',
          severity: data.severity || 'Moderate',
        });
      }
    } catch (e) { /* ignore */ }
    setComplaintModalOpen(true);
  };

  // Open lab investigation modal
  const handleOpenLabOrder = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setLabTests([]);
    setNewTestEntry({ name: '', fees: '' });
    setLabModalOpen(true);

    // Fetch existing tests if any to allow updating/adding more
    try {
      const res = await fetch(`/api/nurse_opd.php?action=get_appointment_labs&appointment_number=${appointment.id}`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Find the most recent unpaid or pending test list
        const lastOrder = data[0];
        try {
          const existingTests = JSON.parse(lastOrder.test_list);
          if (Array.isArray(existingTests)) {
            // Map from new format [{"test_name":...}] to UI format {name:...}
            const mappedTests = existingTests.map((t: any) => ({
              id: '',
              name: t.test_name || (typeof t === 'string' ? t : 'Unknown Test'),
              cat: 'Lab',
              fees: 0
            }));
            setLabTests(mappedTests);
          }
        } catch (e) { /* ignore parse error */ }
      }
    } catch (e) { /* ignore fetch error */ }
  };

  // Check-in flow
  const handleCheckIn = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCheckInModalOpen(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    deleteAppointment(appointment.id);
    toast.success('Appointment Deleted', { description: `${appointment.patientName}'s appointment has been removed permanently` });
  };

  // Confirm check-in and auto-open vitals modal
  const handleConfirmCheckIn = () => {
    if (!selectedAppointment) return;
    updateAppointment(selectedAppointment.id, { status: 'In Progress' as AppointmentStatus });
    addNotification({
      id: `notif-checkin-${Date.now()}`,
      type: 'success',
      category: 'appointment',
      icon: 'CheckCircle',
      title: 'Patient Checked In',
      description: `${selectedAppointment.patientName} has been checked in`,
      message: `Appointment ${selectedAppointment.id} - ${selectedAppointment.date} at ${selectedAppointment.time}`,
      module: 'Appointments',
      timestamp: new Date().toISOString(),
      unread: true,
    });
    addActivityLog({
      id: `log-checkin-${Date.now()}`,
      action: `Checked in ${selectedAppointment.patientName} for appointment ${selectedAppointment.id}`,
      module: 'Appointments',
      user: currentUser?.fullName || 'Nurse',
      timestamp: new Date().toISOString(),
      icon: 'CheckCircle',
    });
    toast.success('Patient checked in', { description: `${selectedAppointment.patientName} has been marked as checked in` });
    setCheckInModalOpen(false);
    setTimeout(() => { handleRecordVitals(selectedAppointment); }, 300);
  };

  // Save vitals
  const handleSaveVitals = async () => {
    if (!selectedAppointment) return;
    if (!vitals.temperature || !vitals.bloodPressure || !vitals.heartRate) {
      toast.error('Required Fields Missing', { description: 'Please fill in Temperature, Blood Pressure, and Heart Rate' });
      return;
    }
    try {
      const response = await fetch('/api/vitals.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vital_pid: selectedAppointment.patientId,
          vital_is_sub: selectedAppointment.isSubfile ? 1 : 0,
          vital_temperature: vitals.temperature,
          vital_bloodpressure: vitals.bloodPressure,
          vital_heartrate: vitals.heartRate,
          vital_respiratory: vitals.respiratoryRate,
          vital_oxygen: vitals.oxygenSaturation,
          vital_weight: vitals.weight,
          vital_height: vitals.height,
          vital_bmi: vitals.bmi,
          vital_rbs: vitals.rbs,
          vital_appointment: selectedAppointment.id
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to save vitals');

      // Removed auto-update to Processed per user request. 
      // Nurses will now mark as processed manually using the button.
      // updateAppointment(selectedAppointment.id, { status: 'Processed' as AppointmentStatus });
      const vitalsSummary = `Temp: ${vitals.temperature}°C, BP: ${vitals.bloodPressure}, HR: ${vitals.heartRate} bpm`;
      addNotification({
        id: `notif-vitals-${Date.now()}`,
        type: 'success',
        category: 'clinical',
        icon: 'Activity',
        title: 'Vitals Recorded Successfully',
        description: `Vital signs recorded for ${selectedAppointment.patientName}`,
        message: vitalsSummary,
        module: 'Patients',
        timestamp: new Date().toISOString(),
        unread: true,
      });
      addActivityLog({
        id: `log-vitals-${Date.now()}`,
        action: `Recorded vital signs for ${selectedAppointment.patientName} (${selectedAppointment.patientId})`,
        module: 'Patients',
        user: currentUser?.fullName || 'Nurse',
        timestamp: new Date().toISOString(),
        icon: 'Activity',
      });
      toast.success('Vitals saved successfully', { description: 'Vital signs recorded. You can now record complaints and order lab investigations.' });
      setVitalsModalOpen(false);
      setVitals({ temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '', oxygenSaturation: '', weight: '', height: '', rbs: '', bmi: '', notes: '' });
      setSelectedAppointment(null);
    } catch (error: any) {
      toast.error('Error saving vitals', { description: error.message || 'An error occurred' });
    }
  };

  // Save complaint
  const handleSaveComplaint = async () => {
    if (!selectedAppointment || !complaintForm.complaint.trim()) {
      toast.error('Complaint description is required');
      return;
    }
    setIsSavingComplaint(true);
    try {
      const res = await fetch('/api/nurse_opd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'record_complaint',
          appointment_number: selectedAppointment.id,
          patient_id: selectedAppointment.patientId,
          complaint: complaintForm.complaint,
          duration: complaintForm.duration,
          severity: complaintForm.severity,
          nurse_id: currentUser?.id || 'System',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save complaint');
      toast.success('Complaint recorded successfully');
      setComplaintModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to record complaint');
    } finally {
      setIsSavingComplaint(false);
    }
  };

  // Add test via dynamic input
  const handleAddLabTest = () => {
    const name = newTestEntry.name.trim();
    if (!name) { toast.error('Test name is required'); return; }
    if (labTests.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      toast.error('This test has already been added'); return;
    }
    const fees = parseFloat(newTestEntry.fees) || 0;
    setLabTests(prev => [...prev, { id: newTestEntry.id, name, cat: 'Lab', fees }]);
    setNewTestEntry({ id: '', name: '', fees: '' });
  };

  const handleRemoveLabTest = (name: string) => {
    setLabTests(prev => prev.filter(t => t.name !== name));
  };

  // Submit lab order
  const handleOrderLabInvestigation = async () => {
    if (!selectedAppointment || labTests.length === 0) {
      toast.error('Please add at least one lab test');
      return;
    }
    setIsOrderingLab(true);
    try {
      const res = await fetch('/api/nurse_opd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'order_lab_investigation',
          appointment_number: selectedAppointment.id,
          patient_id: selectedAppointment.patientId,
          is_subfile: selectedAppointment.isSubfile ? 1 : 0,
          tests: labTests.map(({ id, name, cat, fees }) => ({ id, name, cat, fees })),
          nurse_id: currentUser?.id || 'System',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to order lab investigation');
      toast.success('Lab investigation ordered!', { description: `${labTests.length} test(s) added to the clinical record.` });
      setLabModalOpen(false);
      setLabTests([]);
      fetchPendingApprovals(); // Refresh approvals
    } catch (e: any) {
      toast.error(e.message || 'Failed to order lab investigation');
    } finally {
      setIsOrderingLab(false);
    }
  };

  // Approve lab result -> updates appointment status
  const handleApproveLabResult = async (appointmentNumber: string) => {
    setIsApproving(999); // dummy ID for loading state
    try {
      const res = await fetch('/api/nurse_opd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'approve_lab_result',
          appointment_number: appointmentNumber,
          nurse_id: currentUser?.id || 'System',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to approve');
      toast.success('Appointment Marked as Processed!', { description: 'The patient is now ready for consultation.' });
      fetchPendingApprovals();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve');
    } finally {
      setIsApproving(null);
    }
  };

  const handleOpenUploadResult = (ap: any) => {
    setUploadForm({
      summary: ap.result_list || '',
      picture: ap.result_picture || '',
      invoice_id: ap.invoice_id,
      patient_name: ap.patient_name
    });
    setUploadResultModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File too large', { description: 'Please select an image smaller than 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadForm(prev => ({ ...prev, picture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLabResult = async () => {
    if (!uploadForm.invoice_id) return;
    setIsUploadingResult(true);
    try {
      const res = await fetch('/api/nurse_opd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'upload_lab_result',
          invoice_id: uploadForm.invoice_id,
          result_summary: uploadForm.summary,
          result_picture: uploadForm.picture,
          nurse_id: currentUser?.id || 'System',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to upload result');

      toast.success('Lab result saved successfully');
      setUploadResultModalOpen(false);
      fetchPendingApprovals(); // Refresh the list
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload result');
    } finally {
      setIsUploadingResult(false);
    }
  };

  const handleViewLabResult = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setLabResultViewModalOpen(true);
  };

  const handleMarkAsProcessed = async (appointment: Appointment) => {
    try {
      const res = await fetch('/api/nurse_opd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'mark_appointment_processed',
          appointment_number: appointment.id,
          nurse_id: currentUser?.id || 'System',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status');

      updateAppointment(appointment.id, { status: 'Processed' as AppointmentStatus });

      toast.success('Appointment Marked as Processed', {
        description: `${appointment.patientName} is now ready for consultation.`
      });

      addNotification({
        id: `notif-processed-${Date.now()}`,
        type: 'info',
        category: 'clinical',
        icon: 'BadgeCheck',
        title: 'Appointment Processed',
        description: `${appointment.patientName} has been marked as processed and ready for consultation`,
        message: `Appointment ${appointment.id} is now in the doctor's queue`,
        module: 'Appointments',
        timestamp: new Date().toISOString(),
        unread: true,
      });

      addActivityLog({
        id: `log-processed-${Date.now()}`,
        action: `Marked appointment ${appointment.id} (${appointment.patientName}) as Processed`,
        module: 'Appointments',
        user: currentUser?.fullName || 'Nurse',
        timestamp: new Date().toISOString(),
        icon: 'BadgeCheck',
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to mark appointment as processed');
    }
  };

  const getPriorityBadge = (priority: AppointmentPriority) => {
    const variants: Record<AppointmentPriority, any> = {
      'Critical': 'destructive',
      'High': 'default',
      'Normal': 'secondary'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const colors: Record<AppointmentStatus, string> = {
      'Scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Processed': 'bg-purple-100 text-purple-800 border-purple-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return <Badge className={colors[status]} variant="outline">{status}</Badge>;
  };



  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Appointment Management</h1>
          <p className="text-muted-foreground">View and manage patient appointments, record complaints, and order lab investigations</p>
        </div>
        <Button
          onClick={() => { setApprovalsModalOpen(true); fetchPendingApprovals(); }}
          variant="outline"
          className="relative border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
        >
          <Bell className="w-4 h-4" />
          Pending Lab Approvals
          {pendingApprovals.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingApprovals.length}
            </span>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by File ID, Patient Name, or Doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Processed">Processed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>

                </SelectContent>
              </Select>
            </div>
          </div>
          {(searchQuery || priorityFilter !== 'all' || statusFilter !== 'all') && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="w-4 h-4 mr-2" /> Clear Filters
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedAppointments.length} of {filteredAppointments.length} appointments
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appt #</TableHead>
                  <TableHead>File ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Lab Result</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {paginatedAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Calendar className="w-12 h-12 mb-2 opacity-50" />
                          <p className="font-medium">No appointments found</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAppointments.map((appointment, index) => (
                      <motion.tr
                        key={appointment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{appointment.id}</TableCell>
                        <TableCell className="font-mono text-sm">{appointment.patientId}</TableCell>
                        <TableCell className="font-medium">{appointment.patientName}</TableCell>
                        <TableCell>{appointment.department}</TableCell>
                        <TableCell>{appointment.doctorName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{appointment.date}</span>
                            <span className="text-xs text-muted-foreground">{appointment.time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.latestLabResult ? (
                            <div className="flex flex-col max-w-[150px] gap-1">
                              <span className="text-xs font-medium truncate" title={appointment.latestLabResult}>
                                {appointment.latestLabResult}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] w-fit h-4 px-1 bg-green-50 text-green-700 border-green-200">Available</Badge>
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleViewLabResult(appointment)}>
                                  View Result
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No result</span>
                          )}
                        </TableCell>
                        <TableCell>{getPriorityBadge(appointment.priority)}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {/* View Button */}
                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(appointment)} title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Vitals Button */}
                            <Button
                              size="sm" variant="outline"
                              onClick={() => handleRecordVitals(appointment)}
                              className="border-secondary text-secondary hover:bg-secondary/10"
                              title="Record Vitals"
                            >
                              <Activity className="w-4 h-4 mr-1" /> Vitals
                            </Button>

                            {/* Complaint Button - show after check-in */}
                            {(appointment.status === 'In Progress' || appointment.status === 'Processed') && (
                              <Button
                                size="sm" variant="outline"
                                onClick={() => handleOpenComplaint(appointment)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                title="Record Complaint"
                              >
                                <MessageSquare className="w-4 h-4 mr-1" /> Complaint
                              </Button>
                            )}

                            {/* Lab Investigation Button - show after vitals recorded */}
                            {(appointment.status === 'In Progress' || appointment.status === 'Processed') && (
                              <Button
                                size="sm" variant="outline"
                                onClick={() => handleOpenLabOrder(appointment)}
                                className="border-teal-300 text-teal-700 hover:bg-teal-50"
                                title="Order Lab Investigation"
                              >
                                <FlaskConical className="w-4 h-4 mr-1" /> Lab
                              </Button>
                            )}

                            {/* Check In Button - Only for Scheduled appointments */}
                            {appointment.status === 'Scheduled' && (
                              <Button
                                size="sm" variant="default"
                                onClick={() => handleCheckIn(appointment)}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Check In
                              </Button>
                            )}

                            {/* Mark as Processed Button - For In Progress appointments */}
                            {appointment.status === 'In Progress' && (
                              <Button
                                size="sm" variant="default"
                                onClick={() => handleMarkAsProcessed(appointment)}
                                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                              >
                                <BadgeCheck className="w-4 h-4 mr-1" /> Processed
                              </Button>
                            )}

                            {/* Delete Button - Only for Scheduled appointments */}
                            {appointment.status === 'Scheduled' && (
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => handleDeleteAppointment(appointment)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Delete Appointment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Complete information for this appointment</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Appointment #</p>
                  <p className="font-medium">{selectedAppointment.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</p>
                  <p className="font-medium">{selectedAppointment.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Time</p>
                  <p className="font-medium">{selectedAppointment.time}</p>
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg mb-2">Patient & Doctor</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">File ID</p>
                    <p className="font-medium font-mono">{selectedAppointment.patientId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Patient Name</p>
                    <p className="font-medium">{selectedAppointment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Doctor</p>
                    <p className="font-medium flex items-center gap-2"><Stethoscope className="w-4 h-4" />{selectedAppointment.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedAppointment.department}</p>
                  </div>
                </div>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Vitals Modal */}
      <Dialog open={vitalsModalOpen} onOpenChange={setVitalsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Record Vital Signs
            </DialogTitle>
            <DialogDescription>Record vital signs for {selectedAppointment?.patientName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
            {selectedAppointment && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Patient Name:</span>{' '}<span className="font-semibold">{selectedAppointment.patientName}</span></div>
                  <div><span className="text-muted-foreground">File Number:</span>{' '}<span className="font-mono font-semibold">{selectedAppointment.patientId}</span></div>
                  <div><span className="text-muted-foreground">Appointment ID:</span>{' '}<span className="font-semibold">{selectedAppointment.id}</span></div>
                  <div><span className="text-muted-foreground">Date/Time:</span>{' '}<span className="font-semibold">{selectedAppointment.date} {selectedAppointment.time}</span></div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C) <span className="text-destructive">*</span></Label>
                <Input id="temperature" placeholder="36.5" type="number" step="0.1" value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure <span className="text-destructive">*</span></Label>
                <Input id="bloodPressure" placeholder="120/80" value={vitals.bloodPressure} onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm) <span className="text-destructive">*</span></Label>
                <Input id="heartRate" placeholder="72" type="number" value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respiratoryRate">Respiratory Rate (/min)</Label>
                <Input id="respiratoryRate" placeholder="16" type="number" value={vitals.respiratoryRate} onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation">Oxygen Saturation (%)</Label>
                <Input id="oxygenSaturation" placeholder="98" type="number" value={vitals.oxygenSaturation} onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" placeholder="70" type="number" step="0.1" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input id="height" placeholder="170" type="number" value={vitals.height} onChange={(e) => setVitals({ ...vitals, height: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rbs">RBS (mg/dL)</Label>
                <Input id="rbs" placeholder="95" type="number" value={vitals.rbs} onChange={(e) => setVitals({ ...vitals, rbs: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>BMI (Auto-calculated)</Label>
                <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                  <span className="font-semibold text-primary">{vitals.bmi || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <textarea
                id="notes"
                placeholder="Any additional observations or remarks..."
                value={vitals.notes}
                onChange={(e) => setVitals({ ...vitals, notes: e.target.value })}
                className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setVitalsModalOpen(false); setVitals({ temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '', oxygenSaturation: '', weight: '', height: '', rbs: '', bmi: '', notes: '' }); }}>Cancel</Button>
            <Button onClick={handleSaveVitals} className="bg-primary hover:bg-primary/90">
              <CheckCircle className="w-4 h-4 mr-2" /> Save Vitals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-In Confirmation Modal */}
      <Dialog open={checkInModalOpen} onOpenChange={setCheckInModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" /> Confirm Check-In
            </DialogTitle>
            <DialogDescription>Mark this patient as checked in. Vitals recording will open automatically.</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm"><span className="text-muted-foreground">Patient:</span>{' '}<span className="font-medium">{selectedAppointment.patientName}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">File ID:</span>{' '}<span className="font-medium font-mono">{selectedAppointment.patientId}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Appointment:</span>{' '}<span className="font-medium">{selectedAppointment.date} at {selectedAppointment.time}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Doctor:</span>{' '}<span className="font-medium">{selectedAppointment.doctorName}</span></p>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-xs text-blue-900">After confirming check-in, the vitals recording modal will open automatically.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckInModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmCheckIn} className="bg-primary hover:bg-primary/90">
              <CheckCircle className="w-4 h-4 mr-2" /> Confirm Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Complaint Modal */}
      <Dialog open={complaintModalOpen} onOpenChange={setComplaintModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" /> Record Patient Complaint
            </DialogTitle>
            <DialogDescription>
              Record the patient's presenting complaint for {selectedAppointment?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="complaint">Presenting Complaint <span className="text-destructive">*</span></Label>
              <Textarea
                id="complaint"
                placeholder="Describe the patient's main complaint, symptoms, and history of present illness..."
                rows={4}
                value={complaintForm.complaint}
                onChange={(e) => setComplaintForm({ ...complaintForm, complaint: e.target.value })}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration of Complaint</Label>
                <Input
                  id="duration"
                  placeholder="e.g. 3 days, 2 weeks"
                  value={complaintForm.duration}
                  onChange={(e) => setComplaintForm({ ...complaintForm, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={complaintForm.severity} onValueChange={(v) => setComplaintForm({ ...complaintForm, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mild">Mild</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Severe">Severe</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComplaintModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveComplaint} disabled={isSavingComplaint} className="bg-blue-600 hover:bg-blue-700">
              {isSavingComplaint ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}
              Save Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Lab Investigation Modal */}
      <Dialog open={labModalOpen} onOpenChange={setLabModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-teal-600" /> Order Lab Investigation
            </DialogTitle>
            <DialogDescription>
              Order medical investigations for {selectedAppointment?.patientName}. Results will be captured in the clinical record.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Patient Info */}
            {selectedAppointment && (
              <div className="bg-teal-50 border border-teal-100 p-3 rounded-lg text-sm flex gap-6">
                <span><span className="text-muted-foreground">Patient:</span> <strong>{selectedAppointment.patientName}</strong></span>
                <span><span className="text-muted-foreground">File No:</span> <span className="font-mono">{selectedAppointment.patientId}</span></span>
                <span><span className="text-muted-foreground">Apt:</span> <strong>{selectedAppointment.id}</strong></span>
              </div>
            )}

            {/* Clinical record notice */}
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-lg flex items-start gap-2">
              <FlaskConical className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <p className="text-xs text-teal-800">
                Investigations ordered here are recorded in the patient's <strong>clinical history</strong> and sent to the laboratory for processing and result entry.
              </p>
            </div>

            {/* Dynamic Test Input - Manual Typing */}
            <div className="space-y-2">
              <Label>Type and Add Lab Test</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. FBC, MP, Urinalysis..."
                    value={newTestEntry.name}
                    onChange={(e) => {
                      setNewTestEntry({ ...newTestEntry, name: e.target.value });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLabTest();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddLabTest}
                  disabled={!newTestEntry.name}
                  className="bg-teal-600 hover:bg-teal-700 shrink-0"
                  title="Add test"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Selected Tests Table */}
            {labTests.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs h-8">Test Name</TableHead>
                      <TableHead className="text-xs h-8 w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labTests.map((test, i) => (
                      <TableRow key={i}>
                        <TableCell className="py-1.5 text-sm">{test.name}</TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLabTest(test.name)}
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setLabModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleOrderLabInvestigation}
              disabled={isOrderingLab || labTests.length === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isOrderingLab ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
              Order Investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Lab Approvals Modal */}
      <Dialog open={approvalsModalOpen} onOpenChange={setApprovalsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-amber-600" /> Pending Lab Result Approvals
            </DialogTitle>
            <DialogDescription>
              Review and approve lab results. Approving moves the patient to the doctor's processed queue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-2">
            {isLoadingApprovals ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <BadgeCheck className="w-12 h-12 opacity-20" />
                <p className="font-medium">No pending approvals</p>
                <p className="text-sm">All lab results have been approved.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((ap) => {
                  const tests = (() => { try { return JSON.parse(ap.test_list); } catch { return []; } })();
                  return (
                    <Card key={ap.invoice_id} className="border-l-4 border-l-amber-400 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="font-bold text-sm">{ap.patient_name || ap.patient_id}</p>
                            <p className="text-xs text-muted-foreground font-mono">Apt: {ap.appointment_number} • {new Date(ap.appointment_date).toLocaleDateString()}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.isArray(tests) && tests.map((t: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] bg-teal-50 text-teal-800 border-teal-200">{t.test_name || t.name || t}</Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                ✓ Results Ready
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">Invoice: {ap.invoice_id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Result Display */}
                        {(ap.result_list || ap.result_picture) ? (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 text-sm">
                            <h4 className="font-semibold text-green-800 flex items-center gap-1 mb-1">
                              <FileText className="w-3.5 h-3.5" /> Result Clinical Data:
                            </h4>
                            {ap.result_list && <p className="text-green-900 whitespace-pre-wrap mb-2">{ap.result_list}</p>}
                            {ap.result_picture && (
                              <div className="mt-2 text-center">
                                <img src={ap.result_picture} alt="Lab Result" className="max-h-48 mx-auto rounded-md shadow-sm border border-green-200" />
                              </div>
                            )}
                            <p className="text-[10px] text-green-700 mt-2">Recorded on {new Date(ap.result_date).toLocaleString()}</p>
                          </div>
                        ) : (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800 italic">
                            No result data uploaded yet. Please click "Upload Result" to add summary or images.
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => handleOpenUploadResult(ap)}
                          >
                            <Upload className="w-4 h-4 mr-1.5" />
                            {(ap.result_list || ap.result_picture) ? 'Edit Result' : 'Upload Result'}
                          </Button>
                          <Button
                            onClick={() => handleApproveLabResult(ap.appointment_number)}
                            disabled={isApproving !== null || !(ap.result_list || ap.result_picture)}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            {isApproving === 999 && ap.appointment_number === ap.appointment_number ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <BadgeCheck className="w-4 h-4 mr-1.5" /> Approve Result
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="bg-muted/30 px-6 py-4 mt-auto">
            <Button variant="outline" onClick={() => setApprovalsModalOpen(false)}>Close</Button>
            <Button variant="ghost" size="sm" onClick={fetchPendingApprovals} disabled={isLoadingApprovals}>
              {isLoadingApprovals ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Lab Result Modal */}
      <Dialog open={uploadResultModalOpen} onOpenChange={setUploadResultModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" /> Upload Lab Result
            </DialogTitle>
            <DialogDescription>
              Attach clinical summary and images for {uploadForm.patient_name}'s investigation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Result Summary / Findings</Label>
              <Textarea
                id="summary"
                placeholder="Type the lab finding summary here..."
                className="min-h-[120px]"
                value={uploadForm.summary}
                onChange={(e) => setUploadForm(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Result Image (Picture Format)</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 bg-muted/20 hover:bg-muted/30 transition-colors relative group cursor-pointer" onClick={() => document.getElementById('result-pic')?.click()}>
                {uploadForm.picture ? (
                  <div className="relative w-full text-center">
                    <img src={uploadForm.picture} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2 rounded-full h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); setUploadForm(prev => ({ ...prev, picture: '' })); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="font-medium">Click to upload or drag & drop</p>
                    <p className="text-xs">PNG, JPG or PDF (Max 2MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  id="result-pic"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadResultModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadLabResult} disabled={isUploadingResult || !uploadForm.summary.trim()} className="bg-blue-600 hover:bg-blue-700">
              {isUploadingResult ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Save Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lab Result Modal */}
      <Dialog open={labResultViewModalOpen} onOpenChange={setLabResultViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-50">
                  <FlaskConical className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Laboratory Examination Report</DialogTitle>
                  <DialogDescription>
                    Official lab results for {selectedAppointment?.patientName}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] tracking-wider font-bold">
                Authenticated
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Header Info */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Patient File</Label>
                <p className="font-mono text-sm font-semibold">{selectedAppointment?.patientId}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Appt Number</Label>
                <p className="font-mono text-sm font-semibold">{selectedAppointment?.id}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Report Date</Label>
                <p className="text-sm font-semibold">{selectedAppointment?.latestLabResultDate || 'Date Not Specified'}</p>
              </div>
              <div className="space-y-1 text-right">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Status</Label>
                <div className="flex justify-end">
                  <Badge className="bg-blue-600">Released</Badge>
                </div>
              </div>
            </div>

            {/* Test Summary / Findings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold uppercase tracking-wide">Clinical Findings & Results</h3>
              </div>

              <div className="rounded-xl border bg-card/50 shadow-sm overflow-hidden">
                {(() => {
                  try {
                    let rawData = selectedAppointment?.latestLabResult;
                    let results: any = rawData;

                    // Helper to deep parse JSON
                    const robustParse = (data: any): any => {
                      if (typeof data !== 'string') return data;
                      const trimmed = data.trim();
                      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                        try {
                          const parsed = JSON.parse(trimmed);
                          return robustParse(parsed); // Recurse for double-encoding
                        } catch (e) {
                          return data;
                        }
                      }
                      // Handle quoted strings that contain JSON
                      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                        try {
                          const unquoted = JSON.parse(trimmed);
                          return robustParse(unquoted);
                        } catch (e) { return data; }
                      }
                      return data;
                    };

                    results = robustParse(rawData);

                    if (typeof results === 'object' && results !== null && !Array.isArray(results)) {
                      return (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Test Item</th>
                              <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Result / Finding</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(results).map(([test, result], idx) => (
                              <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="p-3 font-semibold text-blue-900 bg-blue-50/30 w-1/3">{test}</td>
                                <td className="p-3 whitespace-pre-wrap">{String(result)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    }
                  } catch (e) { }

                  return (
                    <div className="p-5 leading-relaxed text-foreground/90 whitespace-pre-wrap family-serif italic border-l-4 border-l-blue-500">
                      {selectedAppointment?.latestLabResult || 'No textual findings provided by the laboratory.'}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Picture / Attachments */}
            {selectedAppointment?.latestLabResultPicture && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Scanned Result / Visual Evidence</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(() => {
                    let pictures: { name: string, url: string }[] = [];
                    try {
                      let picData = selectedAppointment?.latestLabResultPicture;

                      const robustParse = (data: any): any => {
                        if (typeof data !== 'string') return data;
                        const trimmed = data.trim();
                        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                          try {
                            const parsed = JSON.parse(trimmed);
                            return robustParse(parsed);
                          } catch (e) { return data; }
                        }
                        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                          try {
                            const unquoted = JSON.parse(trimmed);
                            return robustParse(unquoted);
                          } catch (e) { return data; }
                        }
                        return data;
                      };

                      let parsed = robustParse(picData);
                      if (typeof parsed === 'object' && parsed !== null) {
                        pictures = Object.entries(parsed).map(([name, url]) => ({ name, url: String(url) }));
                      } else if (parsed) {
                        pictures = [{ name: 'Lab Attachment', url: String(parsed) }];
                      }
                    } catch (e) {
                      pictures = [];
                    }

                    return pictures.filter(p => p.url && typeof p.url === 'string').map((pObj, idx) => {
                      const { name, url: pic } = pObj;
                      const cleanPic = pic.trim().replace(/\\/g, '');
                      const isDataUrl = cleanPic.startsWith('data:');
                      const isHttp = cleanPic.startsWith('http');
                      const finalUrl = isHttp || isDataUrl ? cleanPic : (cleanPic.startsWith('/') ? cleanPic : `/${cleanPic}`);

                      return (
                        <div key={idx} className="space-y-3 p-4 border rounded-2xl bg-muted/20">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase text-blue-700 tracking-wider">
                              {name}
                            </h4>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = finalUrl;
                                link.download = `lab-result-${selectedAppointment?.id}-${name}.jpg`;
                                link.click();
                              }}>
                              <Download className="w-3 h-3 mr-1" /> Download Attachment
                            </Button>
                          </div>

                          <div className="relative border rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
                            <img
                              src={finalUrl}
                              alt={`${name} result`}
                              className="max-w-full h-auto mx-auto block"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                if (!isDataUrl && !isHttp && finalUrl.startsWith('/')) {
                                  img.src = cleanPic;
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-0">
            <div className="flex items-center justify-between w-full">
              <p className="text-[10px] text-muted-foreground font-mono">GH-EMR LAB_SYSTEM v2.0</p>
              <Button onClick={() => setLabResultViewModalOpen(false)} className="px-8 bg-slate-900">Close Report</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
