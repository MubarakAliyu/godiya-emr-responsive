import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { Notification } from '@/app/emr/store/types';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';

interface ViewNotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewNotificationModal({ notification, isOpen, onClose }: ViewNotificationModalProps) {
  const { markNotificationAsRead } = useEMRStore();

  if (!isOpen || !notification) return null;

  const iconStyles: Record<Notification['type'], { Icon: any; color: string; bg: string }> = {
    info: { Icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
    success: { Icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    warning: { Icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    critical: { Icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  };

  const { Icon, color, bg } = iconStyles[notification.type];

  const handleMarkRead = () => {
    if (notification.unread) {
      markNotificationAsRead(notification.id);
      toast.success('Notification marked as read');
    }
  };

  const handleActionLink = () => {
    if (notification.actionLink) {
      toast.info(`Navigating to ${notification.actionLink}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-lg w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Notification Details</h2>
                <p className="text-sm text-muted-foreground capitalize">{notification.type}</p>
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
            {/* Title */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Title</h3>
              <p className="text-lg font-semibold">{notification.title}</p>
            </div>

            {/* Full Message */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Message</h3>
              <p className="text-sm leading-relaxed">
                {notification.message || notification.description}
              </p>
            </div>

            {/* Module Source */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Module</h3>
                <span className="inline-block px-3 py-1 rounded-md text-sm font-medium bg-muted text-foreground">
                  {notification.module}
                </span>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                {notification.unread ? (
                  <span className="inline-block px-3 py-1 rounded-md text-sm font-medium bg-orange-100 text-orange-700">
                    Unread
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-700">
                    Read
                  </span>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Timestamp</h3>
              <p className="text-sm">
                {new Date(notification.timestamp).toLocaleString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Action Link */}
            {notification.actionLink && (
              <div className="pt-4 border-t border-border">
                <Button onClick={handleActionLink} className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {notification.actionLabel || 'View Details'}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-0">
            {notification.unread && (
              <Button variant="outline" onClick={handleMarkRead} className="flex-1">
                Mark as Read
              </Button>
            )}
            <Button onClick={onClose} className={notification.unread ? 'flex-1' : 'w-full'}>
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
