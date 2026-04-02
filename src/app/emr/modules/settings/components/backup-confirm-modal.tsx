import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Database, Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

interface BackupConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupConfirmModal({ isOpen, onClose }: BackupConfirmModalProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleBackup = () => {
    setIsBackingUp(true);

    // Simulate backup process
    setTimeout(() => {
      setIsBackingUp(false);
      setIsComplete(true);
      toast.success('Backup completed successfully');

      // Auto-close after showing success
      setTimeout(() => {
        handleClose();
      }, 2000);
    }, 3000);
  };

  const handleClose = () => {
    setIsBackingUp(false);
    setIsComplete(false);
    onClose();
  };

  if (!isOpen) return null;

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
              <div className="p-2 rounded-lg bg-blue-100">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create Backup</h2>
                <p className="text-sm text-muted-foreground">
                  {isBackingUp ? 'Backing up data...' : isComplete ? 'Backup complete' : 'Confirm backup creation'}
                </p>
              </div>
            </div>
            {!isBackingUp && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {!isBackingUp && !isComplete && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  A complete backup will be created including:
                </p>
                <ul className="space-y-2">
                  {[
                    'All patient records and files',
                    'Financial transactions and invoices',
                    'Laboratory and pharmacy data',
                    'Staff and department information',
                    'System settings and configurations',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    The backup file will be downloaded to your device. Please store it in a secure location.
                  </p>
                </div>
              </div>
            )}

            {isBackingUp && (
              <div className="py-8 text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                <p className="text-lg font-medium mb-2">Creating Backup...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we backup your data
                </p>
              </div>
            )}

            {isComplete && (
              <div className="py-8 text-center">
                <div className="inline-flex p-3 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-lg font-medium mb-2">Backup Complete!</p>
                <p className="text-sm text-muted-foreground">
                  Your backup has been created successfully
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isBackingUp && !isComplete && (
            <div className="flex gap-3 p-6 pt-0">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleBackup} className="flex-1 gap-2">
                <Download className="w-4 h-4" />
                Create Backup
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
