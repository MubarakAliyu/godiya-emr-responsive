import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { StaffAttendance } from '@/app/emr/store/types';

interface DeleteAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: StaffAttendance | null;
}

export function DeleteAttendanceModal({ isOpen, onClose, attendance }: DeleteAttendanceModalProps) {
  const { deleteStaffAttendance } = useEMRStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!attendance) return;

    setIsLoading(true);

    try {
      deleteStaffAttendance(attendance.id);
      toast.success('Attendance record deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete attendance record');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!attendance) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md"
          >
            {/* Header */}
            <div className="bg-red-50 border-b border-red-200 p-6 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-900">Confirm Deletion</h2>
                  <p className="text-sm text-red-700 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete the attendance record for:
              </p>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Staff ID:</span>
                  <span className="font-semibold text-primary">{attendance.staffId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold">{attendance.staffName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-semibold">
                    {new Date(attendance.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold">{attendance.status}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">Warning!</p>
                  <p className="mt-1">
                    This will permanently remove this attendance record from the system. 
                    This action cannot be reversed.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-muted/30 border-t border-border p-6 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isLoading ? 'Deleting...' : 'Delete Record'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}