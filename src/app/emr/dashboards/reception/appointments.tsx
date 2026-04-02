import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Calendar, CalendarCheck, CheckCircle, ChevronLeft, ChevronRight, Clock, DollarSign, Download, Edit, Eye, FileText, Filter, Plus, Printer, RotateCcw, Search, Trash2, X, XCircle } from 'lucide-react';
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
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { Appointment } from '@/app/emr/store/types';
import { CreateAppointmentModal } from '@/app/emr/modules/appointments/components/create-appointment-modal';
import { ViewAppointmentModal } from '@/app/emr/modules/appointments/components/view-appointment-modal';
import { EditAppointmentModal } from '@/app/emr/modules/appointments/components/edit-appointment-modal';
import { CancelAppointmentModal } from '@/app/emr/modules/appointments/components/cancel-appointment-modal';
import { printPOSSlip } from '@/app/emr/utils/pos-print';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

export function ReceptionAppointmentsPage() {
  const { appointments, patients, invoices, settings, deleteAppointment } = useEMRStore();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        searchTerm === '' ||
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

      // For payment filter, we'll check the isPaid property
      const matchesPayment = paymentFilter === 'all' ||
        (paymentFilter === 'paid' && appointment.isPaid) ||
        (paymentFilter === 'unpaid' && !appointment.isPaid);

      const today = new Date().toISOString().split('T')[0];
      const matchesDate = appointment.date >= today;

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [appointments, searchTerm, statusFilter, paymentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Calculate KPIs
  const totalAppointments = appointments.length;
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === today).length;
  const completedAppointments = appointments.filter((a) => a.status === 'Completed').length;
  const pendingAppointments = appointments.filter((a) => a.status === 'Scheduled').length;

  const paidAppointments = appointments.filter((a) => a.isPaid).length;
  const unpaidAppointments = appointments.filter((a) => !a.isPaid).length;

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setPaymentFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    toast.success('Filters reset successfully');
  };

  // Filter to today's appointments
  const filterToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSearchTerm('');
    setPaymentFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    // This would need a date filter in a real implementation
    toast.success('Showing today\'s appointments');
  };

  // Export to CSV
  const exportToCSV = () => {
    toast.success('Appointments exported to CSV');
  };

  // Action handlers
  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };



  const handleDelete = (appointment: Appointment) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY delete the appointment for ${appointment.patientName}? This cannot be undone.`)) {
      deleteAppointment(appointment.id);
      toast.success('Appointment deleted permanently');
    }
  };

  const handlePrint = (appointment: Appointment) => {
    const consultationFee = appointment.totalFee || 0;
    const isPaid = appointment.isPaid;
    const totalPaid = appointment.totalPaid || (isPaid ? consultationFee : 0);
    const balance = consultationFee - totalPaid;
    const currency = settings.general?.currencySymbol || '₦';
    const invoiceNo = `INV-${appointment.id.split('-').pop()}-${Math.floor(1000 + Math.random() * 9000)}`;

    printPOSSlip(settings, {
      title: 'Appointment Invoice',
      isPaid,
      sections: [
        {
          title: 'Appointment Details',
          items: [
            { label: 'Invoice No', value: invoiceNo },
            { label: 'Appt. No', value: appointment.id },
            { label: 'File Number', value: appointment.patientId },
            { label: 'Patient', value: appointment.patientName },
            { label: 'Department', value: appointment.department },
            { label: 'Doctor', value: appointment.doctorName },
            { label: 'Date', value: appointment.date },
            { label: 'Shift/Time', value: appointment.time },
          ],
        },
        {
          title: 'Payment Details',
          items: [
            { label: 'Payment Status', value: isPaid ? '✓ PAID' : '✗ NOT PAID' },
            { label: 'Service', value: 'Consultation Fee' },
            { label: 'Amount Due', value: `${currency}${consultationFee.toLocaleString()}` },
            { label: 'Amount Paid', value: `${currency}${totalPaid.toLocaleString()}` },
            { label: 'Balance', value: `${currency}${balance.toLocaleString()}` },
          ],
        }
      ],
      footer: isPaid
        ? 'Payment confirmed. Please proceed to the vital signs station. Thank you!'
        : 'Please proceed to the cashier to complete payment before seeing the doctor.',
    });
    toast.success(isPaid ? 'Printing invoice...' : 'Printing unpaid invoice...');
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      Scheduled: { className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
      'In Progress': { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      Completed: { className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
      Cancelled: { className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    };

    return <Badge {...(variants[status] || variants.Scheduled)}>{status}</Badge>;
  };

  // Priority badge helper
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      Normal: { className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      High: { className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
      Critical: { className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    };

    return <Badge {...(variants[priority] || variants.Normal)}>{priority}</Badge>;
  };

  // Payment status badge
  const getPaymentBadge = (isPaid: boolean) => {
    return (
      <Badge className={isPaid ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200'}>
        {isPaid ? 'Paid' : 'Unpaid'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Appointment Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage patient appointments and scheduling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={filterToday}>
            <CalendarCheck className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Appointment
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard
          icon={Calendar}
          label="Total Appointments"
          value={totalAppointments}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          icon={CalendarCheck}
          label="Today's Appointments"
          value={todayAppointments}
          color="bg-cyan-100 text-cyan-600"
          delay={0.05}
        />
        <KPICard
          icon={CheckCircle}
          label="Completed"
          value={completedAppointments}
          color="bg-purple-100 text-purple-600"
          delay={0.1}
        />
        <KPICard
          icon={Clock}
          label="Pending"
          value={pendingAppointments}
          color="bg-yellow-100 text-yellow-600"
          delay={0.15}
        />

        <KPICard
          icon={DollarSign}
          label="Paid"
          value={paidAppointments}
          color="bg-green-100 text-green-600"
          delay={0.25}
        />
        <KPICard
          icon={AlertCircle}
          label="Unpaid"
          value={unpaidAppointments}
          color="bg-gray-100 text-gray-600"
          delay={0.3}
        />
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-xl p-4 border border-border space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by File No, Doctor, Patient Name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>

                <SelectItem value="In Progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </motion.div>

      {/* Appointments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">S/N</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Appt #</th>
                <th className="px-4 py-3 text-left text-sm font-medium">File No</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Doctor</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Shift</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Fee</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Payment</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Calendar className="w-12 h-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No appointments found</p>
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Appointment
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentAppointments.map((appointment, index) => (
                  <motion.tr
                    key={appointment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {appointment.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {appointment.patientId}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{appointment.patientName}</td>
                    <td className="px-4 py-3 text-sm">{appointment.department}</td>
                    <td className="px-4 py-3 text-sm">{appointment.doctorName}</td>
                    <td className="px-4 py-3 text-sm">{appointment.time}</td>
                    <td className="px-4 py-3 text-sm">{appointment.date}</td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-700">
                      ₦{(appointment.totalFee || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{getPriorityBadge(appointment.priority)}</td>
                    <td className="px-4 py-3">{getStatusBadge(appointment.status)}</td>
                    <td className="px-4 py-3">{getPaymentBadge(appointment.isPaid)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(appointment)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {appointment.status !== 'Cancelled' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 disabled:text-gray-400"
                            onClick={() => handleDelete(appointment)}
                            disabled={appointment.isPaid}
                            title={appointment.isPaid ? "Paid appointments cannot be deleted" : "Delete"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          title="Print Invoice"
                          onClick={() => handlePrint(appointment)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredAppointments.length)} of{' '}
              {filteredAppointments.length} appointments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <ViewAppointmentModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />


    </div>
  );
}
