import { AnimatePresence, motion } from 'motion/react';
import { X, User, Stethoscope, Calendar, Clock, AlertCircle, FileText, Edit2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import type { Appointment } from '@/app/emr/store/types';
import { toast } from 'sonner';
import { useEMRStore } from '@/app/emr/store/emr-store';

interface ViewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export function ViewAppointmentModal({ isOpen, onClose, appointment }: ViewAppointmentModalProps) {
  const { patients } = useEMRStore();

  if (!isOpen || !appointment) return null;

  const patient = patients.find((p) => p.id === appointment.patientId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      Scheduled: { className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
      'In Progress': { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      Completed: { className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
      Cancelled: { className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    };

    return <Badge {...(variants[status] || variants.Scheduled)}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      Normal: { className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      High: { className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
      Critical: { className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    };

    return <Badge {...(variants[priority] || variants.Normal)}>{priority}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const isPaid = status === 'Completed';
    return (
      <Badge className={isPaid ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200'}>
        {isPaid ? 'Paid' : 'Unpaid'}
      </Badge>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold">Appointment Details</h2>
                <p className="text-sm text-muted-foreground mt-1">{appointment.id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Patient Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-700">Name</p>
                    <p className="font-medium text-blue-900">{appointment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">File No</p>
                    <p className="font-medium text-blue-900">{appointment.patientId}</p>
                  </div>
                  {patient && (
                    <>
                      <div>
                        <p className="text-blue-700">Phone</p>
                        <p className="font-medium text-blue-900">{patient.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Age</p>
                        <p className="font-medium text-blue-900">{patient.age} years</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Doctor Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-purple-700">Department</p>
                    <p className="font-medium text-purple-900">{appointment.department}</p>
                  </div>
                  <div>
                    <p className="text-purple-700">Assigned Doctor</p>
                    <p className="font-medium text-purple-900">{appointment.doctorName}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Appointment Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-700">Date</p>
                    <p className="font-medium text-gray-900">{appointment.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-700">Shift</p>
                    <p className="font-medium text-gray-900">{appointment.time}</p>
                  </div>
                  <div>
                    <p className="text-gray-700">Type</p>
                    <p className="font-medium text-gray-900">{appointment.appointmentType}</p>
                  </div>
                  <div>
                    <p className="text-gray-700">Priority</p>
                    <div className="mt-1">{getPriorityBadge(appointment.priority)}</div>
                  </div>
                  <div>
                    <p className="text-gray-700">Status</p>
                    <div className="mt-1">{getStatusBadge(appointment.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-700">Payment Status</p>
                    <div className="mt-1">{getPaymentBadge(appointment.status)}</div>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-700 text-sm">Notes</p>
                    <p className="font-medium text-gray-900 text-sm mt-1">{appointment.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
