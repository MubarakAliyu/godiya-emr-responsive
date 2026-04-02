import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, User, Briefcase, Building2, Calendar, CheckCircle, History } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  staffId: string;
  name: string;
  department: string;
  role: string;
  status: 'Present' | 'Absent' | 'Late' | 'On Leave';
  checkIn: string;
  checkOut: string;
  date: Date;
}

interface ViewAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord;
  onViewHistory: (record: AttendanceRecord) => void;
}

export function ViewAttendanceModal({ isOpen, onClose, record, onViewHistory }: ViewAttendanceModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'text-green-600 bg-green-50';
      case 'Absent':
        return 'text-red-600 bg-red-50';
      case 'Late':
        return 'text-yellow-600 bg-yellow-50';
      case 'On Leave':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl z-50 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Attendance Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View staff attendance information
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <div
                  className={`px-6 py-3 rounded-lg font-semibold text-lg ${getStatusColor(
                    record.status
                  )}`}
                >
                  {record.status}
                </div>
              </div>

              {/* Staff Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Staff ID</p>
                      <p className="font-semibold text-gray-900">{record.staffId}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-semibold text-gray-900">{record.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-semibold text-gray-900">{record.department}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-semibold text-gray-900">{record.role}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold text-gray-900">
                        {format(record.date, 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Check In</p>
                      <p className="font-semibold text-gray-900">{record.checkIn}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Clock className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Check Out</p>
                      <p className="font-semibold text-gray-900">{record.checkOut}</p>
                    </div>
                  </div>

                  {record.status === 'Present' || record.status === 'Late' ? (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Work Hours</p>
                        <p className="font-semibold text-gray-900">9h 00m</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Additional Info */}
              {record.status === 'Late' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Staff arrived late. Expected check-in time is 08:00 AM.
                  </p>
                </div>
              )}

              {record.status === 'Absent' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Note:</strong> Staff did not check in today. No leave request was
                    submitted.
                  </p>
                </div>
              )}

              {record.status === 'On Leave' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Staff is on approved leave. Expected to return on{' '}
                    {format(new Date(record.date.getTime() + 7 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onViewHistory(record)}>
                <History className="w-4 h-4 mr-2" />
                View Full History
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
