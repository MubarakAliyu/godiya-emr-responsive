import { motion, AnimatePresence } from 'motion/react';
import { X, User, Calendar, Clock, Building, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import type { StaffAttendance, AttendanceStatus } from '@/app/emr/store/types';
import { useEMRStore } from '@/app/emr/store/emr-store';

interface ViewAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: StaffAttendance | null;
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const badgeStyles: Record<AttendanceStatus, string> = {
    'Present': 'bg-green-100 text-green-700 border-green-200',
    'Absent': 'bg-red-100 text-red-700 border-red-200',
    'Late': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'On Leave': 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <Badge className={`${badgeStyles[status]} border`}>
      {status}
    </Badge>
  );
}

export function ViewAttendanceModal({ isOpen, onClose, attendance }: ViewAttendanceModalProps) {
  const { staff } = useEMRStore();

  if (!attendance) return null;

  const staffMember = staff.find(s => s.id === attendance.staffId);

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
                <h2 className="text-2xl font-bold">Attendance Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View staff attendance information
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Staff Info Card */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{attendance.staffName}</h3>
                    <p className="text-primary font-medium mt-1">{attendance.staffId}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline">{attendance.department}</Badge>
                      <Badge variant="outline">{attendance.role}</Badge>
                      <StatusBadge status={attendance.status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">
                        {new Date(attendance.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      attendance.status === 'Present' ? 'bg-green-100' :
                      attendance.status === 'Late' ? 'bg-yellow-100' :
                      attendance.status === 'On Leave' ? 'bg-purple-100' :
                      'bg-red-100'
                    }`}>
                      {attendance.status === 'Present' || attendance.status === 'Late' ? (
                        <CheckCircle className={`w-5 h-5 ${
                          attendance.status === 'Present' ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      ) : (
                        <AlertCircle className={`w-5 h-5 ${
                          attendance.status === 'On Leave' ? 'text-purple-600' : 'text-red-600'
                        }`} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-semibold">{attendance.status}</p>
                    </div>
                  </div>
                </div>

                {/* Check In */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check In Time</p>
                      <p className="font-semibold">
                        {attendance.checkInTime || 'Not checked in'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Check Out */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check Out Time</p>
                      <p className="font-semibold">
                        {attendance.checkOutTime || 'Not checked out'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Building className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-semibold">{attendance.department}</p>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-semibold">{attendance.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Late Minutes (if applicable) */}
              {attendance.lateMinutes && attendance.lateMinutes > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">Late Arrival</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Staff arrived <strong>{attendance.lateMinutes} minutes</strong> late.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes (if any) */}
              {attendance.notes && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{attendance.notes}</p>
                </div>
              )}

              {/* Staff Contact Info (if available) */}
              {staffMember && (
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Additional Staff Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{staffMember.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{staffMember.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Employment Type</p>
                      <p className="font-medium">{staffMember.employmentType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date Joined</p>
                      <p className="font-medium">
                        {new Date(staffMember.dateJoined).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-muted/30 border-t border-border p-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
