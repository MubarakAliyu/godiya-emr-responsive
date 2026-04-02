import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { StaffAttendance, AttendanceStatus } from '@/app/emr/store/types';

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: StaffAttendance | null;
}

export function EditAttendanceModal({ isOpen, onClose, attendance }: EditAttendanceModalProps) {
  const { updateStaffAttendance } = useEMRStore();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    status: '' as AttendanceStatus,
    checkInTime: '',
    checkOutTime: '',
    notes: '',
  });

  const [errors, setErrors] = useState({
    checkInTime: '',
    checkOutTime: '',
  });

  useEffect(() => {
    if (attendance) {
      setFormData({
        status: attendance.status,
        checkInTime: attendance.checkInTime || '',
        checkOutTime: attendance.checkOutTime || '',
        notes: attendance.notes || '',
      });
      setErrors({ checkInTime: '', checkOutTime: '' });
    }
  }, [attendance]);

  const validateTimes = () => {
    const newErrors = { checkInTime: '', checkOutTime: '' };
    let isValid = true;

    // Time format validation (HH:MM)
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (formData.checkInTime && !timePattern.test(formData.checkInTime)) {
      newErrors.checkInTime = 'Invalid time format. Use HH:MM (e.g., 08:30)';
      isValid = false;
    }

    if (formData.checkOutTime && !timePattern.test(formData.checkOutTime)) {
      newErrors.checkOutTime = 'Invalid time format. Use HH:MM (e.g., 17:00)';
      isValid = false;
    }

    // Check if check-out is after check-in
    if (formData.checkInTime && formData.checkOutTime) {
      const checkIn = new Date(`2000-01-01T${formData.checkInTime}:00`);
      const checkOut = new Date(`2000-01-01T${formData.checkOutTime}:00`);
      
      if (checkOut <= checkIn) {
        newErrors.checkOutTime = 'Check-out time must be after check-in time';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!attendance) return;

    if (!validateTimes()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate late minutes if status is Late
      let lateMinutes = 0;
      if (formData.status === 'Late' && formData.checkInTime) {
        const standardStart = new Date(`2000-01-01T08:00:00`);
        const actualStart = new Date(`2000-01-01T${formData.checkInTime}:00`);
        lateMinutes = Math.round((actualStart.getTime() - standardStart.getTime()) / (1000 * 60));
      }

      updateStaffAttendance(attendance.id, {
        status: formData.status,
        checkInTime: formData.checkInTime || undefined,
        checkOutTime: formData.checkOutTime || undefined,
        notes: formData.notes || undefined,
        lateMinutes: formData.status === 'Late' ? lateMinutes : undefined,
      });

      toast.success('Attendance updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update attendance');
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
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold">Edit Attendance</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Update attendance record for {attendance.staffName}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Staff Info (Read-only) */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Staff ID</p>
                    <p className="font-semibold text-primary">{attendance.staffId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-semibold">{attendance.staffName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-semibold">{attendance.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {new Date(attendance.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as AttendanceStatus })}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Check In Time */}
              <div className="space-y-2">
                <Label htmlFor="checkInTime">
                  Check In Time
                  {(formData.status === 'Present' || formData.status === 'Late') && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  className={errors.checkInTime ? 'border-red-500' : ''}
                  disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
                  required={formData.status === 'Present' || formData.status === 'Late'}
                />
                {errors.checkInTime && (
                  <p className="text-sm text-red-500">{errors.checkInTime}</p>
                )}
              </div>

              {/* Check Out Time */}
              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check Out Time</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  className={errors.checkOutTime ? 'border-red-500' : ''}
                  disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
                />
                {errors.checkOutTime && (
                  <p className="text-sm text-red-500">{errors.checkOutTime}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty if staff hasn't checked out yet
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this attendance record..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Late Warning */}
              {formData.status === 'Late' && formData.checkInTime && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Late arrival time will be automatically calculated based on 8:00 AM standard start time.
                  </p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="sticky bottom-0 bg-muted/30 border-t border-border p-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}