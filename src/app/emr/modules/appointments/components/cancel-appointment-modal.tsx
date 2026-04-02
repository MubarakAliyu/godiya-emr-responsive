import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { Appointment } from '@/app/emr/store/types';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export function CancelAppointmentModal({ isOpen, onClose, appointment }: CancelAppointmentModalProps) {
  const { updateAppointment } = useEMRStore();

  const handleCancel = () => {
    if (!appointment) return;

    updateAppointment(appointment.id, {
      status: 'Cancelled',
    });

    toast.success('Appointment cancelled successfully');
    onClose();
  };

  if (!isOpen || !appointment) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Cancel Appointment?</h2>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-red-700">Patient:</span>{' '}
                  <span className="font-medium text-red-900">{appointment.patientName}</span>
                </div>
                <div className="text-sm">
                  <span className="text-red-700">Appointment #:</span>{' '}
                  <span className="font-medium text-red-900">{appointment.id}</span>
                </div>
                <div className="text-sm">
                  <span className="text-red-700">Date:</span>{' '}
                  <span className="font-medium text-red-900">{appointment.date}</span>
                </div>
                <div className="text-sm">
                  <span className="text-red-700">Doctor:</span>{' '}
                  <span className="font-medium text-red-900">{appointment.doctorName}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                No, Keep It
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Yes, Cancel Appointment
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
