import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

interface RestoreConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestoreConfirmModal({ isOpen, onClose }: RestoreConfirmModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRestore = () => {
    if (!selectedFile) {
      toast.error('Please select a backup file');
      return;
    }

    if (confirmText !== 'RESTORE') {
      toast.error('Please type RESTORE to confirm');
      return;
    }

    setIsRestoring(true);

    // Simulate restore process
    setTimeout(() => {
      setIsRestoring(false);
      setIsComplete(true);
      toast.success('Restore completed successfully');

      // Auto-close after showing success
      setTimeout(() => {
        handleClose();
      }, 2000);
    }, 3000);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsRestoring(false);
    setIsComplete(false);
    setConfirmText('');
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
              <div className="p-2 rounded-lg bg-orange-100">
                <Upload className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Restore Backup</h2>
                <p className="text-sm text-muted-foreground">
                  {isRestoring ? 'Restoring data...' : isComplete ? 'Restore complete' : 'Restore from backup file'}
                </p>
              </div>
            </div>
            {!isRestoring && (
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
            {!isRestoring && !isComplete && (
              <div className="space-y-4">
                {/* Warning */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-1">Warning: Data will be overwritten</p>
                      <p>
                        Restoring a backup will replace all current data with the data from the backup file. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="backupFile">Select Backup File</Label>
                  <Input
                    id="backupFile"
                    type="file"
                    accept=".zip,.backup"
                    onChange={handleFileSelect}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Confirmation Input */}
                <div className="space-y-2">
                  <Label htmlFor="confirmText">Type "RESTORE" to confirm</Label>
                  <Input
                    id="confirmText"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="RESTORE"
                    className={confirmText === 'RESTORE' ? 'border-green-500' : ''}
                  />
                </div>
              </div>
            )}

            {isRestoring && (
              <div className="py-8 text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-orange-600 animate-spin" />
                <p className="text-lg font-medium mb-2">Restoring Backup...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we restore your data
                </p>
              </div>
            )}

            {isComplete && (
              <div className="py-8 text-center">
                <div className="inline-flex p-3 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-lg font-medium mb-2">Restore Complete!</p>
                <p className="text-sm text-muted-foreground">
                  Your data has been restored successfully
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isRestoring && !isComplete && (
            <div className="flex gap-3 p-6 pt-0">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleRestore} 
                className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700"
                disabled={!selectedFile || confirmText !== 'RESTORE'}
              >
                <Upload className="w-4 h-4" />
                Restore Backup
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
