import { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Download, Upload, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import { BackupConfirmModal } from '../components/backup-confirm-modal';
import { RestoreConfirmModal } from '../components/restore-confirm-modal';

export function BackupRestore() {
  const [autoBackupFrequency, setAutoBackupFrequency] = useState('daily');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const backupHistory = [
    {
      id: '1',
      name: 'godiya-hospital-backup-2025-02-04.zip',
      date: '2025-02-04',
      time: '14:30',
      size: '45.2 MB',
      status: 'success',
    },
    {
      id: '2',
      name: 'godiya-hospital-backup-2025-02-03.zip',
      date: '2025-02-03',
      time: '14:30',
      size: '44.8 MB',
      status: 'success',
    },
    {
      id: '3',
      name: 'godiya-hospital-backup-2025-02-02.zip',
      date: '2025-02-02',
      time: '14:30',
      size: '44.5 MB',
      status: 'success',
    },
  ];

  const handleBackupNow = () => {
    setIsBackupModalOpen(true);
  };

  const handleRestoreBackup = () => {
    setIsRestoreModalOpen(true);
  };

  const handleScheduleAutoBackup = () => {
    toast.success(`Auto backup scheduled: ${autoBackupFrequency}`);
  };

  const handleDownloadBackup = (backupName: string) => {
    toast.success(`Downloading ${backupName}...`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Backup Actions */}
      <div className="space-y-4">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Backup & Restore</h3>
          <p className="text-sm text-muted-foreground">
            Create backups and restore system data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backup Now Card */}
          <div className="p-6 rounded-lg border border-border bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold">Create Backup</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Create a complete backup of all hospital data including patients, finances, and settings.
            </p>
            <Button onClick={handleBackupNow} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Backup Now
            </Button>
          </div>

          {/* Restore Card */}
          <div className="p-6 rounded-lg border border-border bg-gradient-to-br from-orange-50 to-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Upload className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="font-semibold">Restore Backup</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Restore system data from a previous backup file. This will overwrite current data.
            </p>
            <Button 
              onClick={handleRestoreBackup} 
              variant="outline" 
              className="w-full gap-2"
            >
              <Upload className="w-4 h-4" />
              Restore Backup
            </Button>
          </div>
        </div>
      </div>

      {/* Auto Backup Schedule */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Automatic Backup Schedule</h3>
          <p className="text-sm text-muted-foreground">
            Configure automatic backup frequency
          </p>
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="autoBackupFrequency">Backup Frequency</Label>
            <Select 
              value={autoBackupFrequency} 
              onValueChange={setAutoBackupFrequency}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Daily (Recommended)</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleScheduleAutoBackup} className="gap-2">
            <Clock className="w-4 h-4" />
            Schedule
          </Button>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Auto Backup Active</p>
              <p className="text-sm mt-1">
                Automatic backups are scheduled {autoBackupFrequency}. Next backup: Today at 14:30
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Backup History</h3>
          <p className="text-sm text-muted-foreground">
            Recent backup files
          </p>
        </div>

        <div className="space-y-3">
          {backupHistory.map((backup, index) => (
            <motion.div
              key={backup.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              className="p-4 rounded-lg border border-border bg-white hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{backup.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {new Date(backup.date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })} at {backup.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {backup.size}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadBackup(backup.name)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Warning Notice */}
      <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Important Notice</p>
            <p className="text-sm mt-1">
              Always download and store backups in a secure location. Restoring a backup will overwrite all current data.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BackupConfirmModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
      <RestoreConfirmModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
      />
    </motion.div>
  );
}
