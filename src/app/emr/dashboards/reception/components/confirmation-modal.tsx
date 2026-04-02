import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'destructive',
  isLoading = false,
}: ConfirmationModalProps) {
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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold">{title}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-muted-foreground">{message}</p>
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirmVariant}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : confirmText}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}