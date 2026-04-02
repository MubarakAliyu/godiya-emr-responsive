import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { Patient } from '@/app/emr/store/types';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function DeletePatientModal({ isOpen, onClose, patient }: DeletePatientModalProps) {
  const { deletePatient } = useEMRStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!patient) return;

    setIsDeleting(true);

    try {
      deletePatient(patient.id, 'Deleted from Patient Management');
      toast.success(`Patient file ${patient.fullName} has been permanently removed`);
      onClose();
    } catch (error) {
      toast.error('Failed to delete patient file');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!patient) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Delete Patient File</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-900 font-medium">Warning: This action cannot be undone!</p>
                    <p className="text-sm text-red-800 mt-1">
                      This will permanently remove the file for{' '}
                      <strong className="font-semibold">{patient.fullName}</strong> and all associated data
                      including medical records, appointments, and billing history.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">File Number:</span>
                    <span className="font-medium">{patient.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Patient Name:</span>
                    <span className="font-medium">{patient.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">File Type:</span>
                    <span className="font-medium">{patient.fileType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Patient Type:</span>
                    <span className="font-medium">{patient.patientType}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete Patient File'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}