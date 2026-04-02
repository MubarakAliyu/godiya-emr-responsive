import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import type { Staff } from '@/app/emr/store/types';

interface ReactivateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  staff: Staff | null;
}

export function ReactivateStaffModal({ isOpen, onClose, onConfirm, staff }: ReactivateStaffModalProps) {
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Reactivate Staff?</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-green-900">
                      Reactivating this staff member will:
                    </p>
                    <ul className="text-sm text-green-900 list-disc list-inside space-y-1 ml-2">
                      <li>Change staff status to <strong>Active</strong></li>
                      <li>Restore system access and duties</li>
                      <li>Show in active staff listings</li>
                      <li>Resume normal operations</li>
                    </ul>
                    <p className="text-sm text-green-900 font-medium mt-2">
                      All historical records will remain intact.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Staff Name:</p>
                      <p className="font-medium">{staff.fullName}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Staff ID:</p>
                      <p className="font-medium">{staff.id}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Department:</p>
                      <p className="font-medium">{staff.department}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Role:</p>
                      <Badge variant="outline">{staff.role}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reactivate
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
