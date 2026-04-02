import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { useEMRStore } from '@/app/emr/store/emr-store';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

export function DeletePatientModal({ isOpen, onClose, patient }: DeletePatientModalProps) {
  const { deletePatient } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      deletePatient(patient.id, deleteReason);

      toast.success('Patient record deleted successfully');
      setDeleteReason('');
      onClose();
    } catch (error) {
      toast.error('Failed to delete patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            style={{ height: '100vh', width: '100vw' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-2xl z-50"
          >
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Delete Patient</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> You are about to delete the patient record for:
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-yellow-900">{patient?.fullName}</p>
                    <p className="text-sm text-yellow-800">File No: {patient?.id}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deleteReason">Reason for Deletion *</Label>
                  <Input
                    id="deleteReason"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Enter reason for deleting this patient record"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be logged in the audit trail
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800">
                    <strong>Important:</strong> Deleting this patient will also remove:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-red-700 ml-4 list-disc">
                    <li>All appointments</li>
                    <li>Medical records and history</li>
                    <li>Billing and payment records</li>
                    <li>Lab results and prescriptions</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Patient
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}