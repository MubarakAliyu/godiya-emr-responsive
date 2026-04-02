import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { Notification } from '@/app/emr/store/types';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';

interface DeleteNotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteNotificationModal({ notification, isOpen, onClose }: DeleteNotificationModalProps) {
  const { deleteNotification } = useEMRStore();

  if (!isOpen || !notification) return null;

  const handleDelete = () => {
    deleteNotification(notification.id);
    toast.success('Notification deleted successfully');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Delete Notification</h2>
                <p className="text-sm text-muted-foreground">Confirm deletion</p>
              </div>
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
            {/* Warning */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">This action cannot be undone</p>
                  <p>This notification will be permanently removed from the system.</p>
                </div>
              </div>
            </div>

            {/* Notification Preview */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Notification to be deleted:</p>
              <p className="text-sm font-semibold">{notification.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-0">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete Notification
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
