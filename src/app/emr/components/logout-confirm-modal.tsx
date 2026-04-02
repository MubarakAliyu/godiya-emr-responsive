import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            style={{ height: '100vh', width: '100vw' }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4">
                <div className="bg-destructive/10 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
                  <p className="text-muted-foreground text-sm">
                    Are you sure you want to log out of Godiya EMR?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1"
                >
                  Log out
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}