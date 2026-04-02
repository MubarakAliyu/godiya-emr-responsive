import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { Staff } from '@/app/emr/store/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

export function DeleteConfirmModal({ isOpen, onClose, staff }: DeleteConfirmModalProps) {
  const { deleteStaff } = useEMRStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!staff) return;
    
    setIsDeleting(true);
    
    try {
      deleteStaff(staff.id);
      toast.success(`Staff member ${staff.fullName} has been removed`);
      onClose();
    } catch (error) {
      toast.error('Failed to delete staff member');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!staff) return null;

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
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Delete Staff Member</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-muted-foreground">
                  Are you sure you want to delete <strong className="text-foreground">{staff.fullName}</strong>? 
                  This action cannot be undone and all associated data will be permanently removed.
                </p>
                
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Staff ID:</span>
                    <span className="font-medium">{staff.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{staff.department}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium">{staff.role}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Staff'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}