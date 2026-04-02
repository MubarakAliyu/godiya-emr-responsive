import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Calendar, UserCheck, LogIn, LogOut, Timer, Info, TrendingUp, XCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import type { StaffAttendance } from '@/app/emr/store/types';
import { format, formatDistance } from 'date-fns';

interface ViewAttendanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: StaffAttendance | null;
}

export function ViewAttendanceDetailsModal({ isOpen, onClose, attendance }: ViewAttendanceDetailsModalProps) {
  if (!isOpen || !attendance) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'Late':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
      case 'Absent':
        return 'bg-red-100 text-red-700 hover:bg-red-100';
      case 'On Leave':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  // Calculate session statistics
  const totalSessions = attendance.sessions?.length || 0;
  const completedSessions = attendance.sessions?.filter(s => s.logoutTime).length || 0;
  const activeSessions = totalSessions - completedSessions;

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{attendance.staffName}</h2>
                  <p className="text-sm text-muted-foreground">Attendance Details for {format(new Date(attendance.date), 'EEEE, MMMM dd, yyyy')}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-2 ${
                attendance.status === 'Present' || attendance.status === 'Late'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-6 h-6 ${
                      attendance.status === 'Present' || attendance.status === 'Late'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`font-semibold ${
                        attendance.status === 'Present' || attendance.status === 'Late'
                          ? 'text-green-900'
                          : 'text-red-900'
                      }`}>
                        {attendance.status === 'Absent' ? 'Staff Absent Today' : 'Attendance Recorded'}
                      </p>
                      <p className={`text-sm ${
                        attendance.status === 'Present' || attendance.status === 'Late'
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}>
                        {attendance.status === 'Absent'
                          ? 'No login recorded for this staff member today'
                          : `${totalSessions} login session(s) recorded`}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(attendance.status)}>
                    {attendance.status}
                  </Badge>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Staff Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Staff ID</p>
                    <p className="text-lg font-semibold text-primary">{attendance.staffId}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Department</p>
                    <p className="text-lg font-semibold">{attendance.department}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Role</p>
                    <p className="text-lg font-semibold">{attendance.role}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="text-lg font-semibold">{format(new Date(attendance.date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>

              {attendance.status !== 'Absent' && (
                <>
                  <Separator />

                  {/* Summary Statistics */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Summary Statistics</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <LogIn className="w-4 h-4 text-blue-600" />
                          <p className="text-sm text-blue-700 font-medium">First Login</p>
                        </div>
                        <p className="text-xl font-bold text-blue-900">
                          {attendance.checkInTime ? format(new Date(attendance.checkInTime), 'HH:mm:ss') : '-'}
                        </p>
                        {attendance.lateMinutes && attendance.lateMinutes > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            {attendance.lateMinutes} min late
                          </p>
                        )}
                      </div>
                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <LogOut className="w-4 h-4 text-purple-600" />
                          <p className="text-sm text-purple-700 font-medium">Last Logout</p>
                        </div>
                        <p className="text-xl font-bold text-purple-900">
                          {attendance.checkOutTime ? format(new Date(attendance.checkOutTime), 'HH:mm:ss') : 'Active'}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="w-4 h-4 text-green-600" />
                          <p className="text-sm text-green-700 font-medium">Total Hours</p>
                        </div>
                        <p className="text-xl font-bold text-green-900">
                          {attendance.totalHoursWorked ? `${attendance.totalHoursWorked.toFixed(2)}h` : '0.00h'}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <p className="text-sm text-orange-700 font-medium">Sessions</p>
                        </div>
                        <p className="text-xl font-bold text-orange-900">{totalSessions}</p>
                        <p className="text-xs text-orange-600 mt-1">
                          {completedSessions} completed, {activeSessions} active
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Login/Logout Sessions */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Login/Logout Sessions</h3>
                    </div>

                    {attendance.sessions && attendance.sessions.length > 0 ? (
                      <div className="space-y-3">
                        {attendance.sessions.map((session, index) => {
                          const loginTime = new Date(session.loginTime);
                          const logoutTime = session.logoutTime ? new Date(session.logoutTime) : null;
                          const isActive = !session.logoutTime;

                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-4 rounded-lg border-2 ${
                                isActive
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                  {/* Session Number */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    isActive
                                      ? 'bg-blue-200 text-blue-700'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {index + 1}
                                  </div>

                                  {/* Login Time */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <LogIn className="w-4 h-4 text-green-600" />
                                      <span className="text-sm font-medium text-green-700">Login</span>
                                    </div>
                                    <p className="text-base font-semibold">{format(loginTime, 'HH:mm:ss')}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistance(loginTime, new Date(), { addSuffix: true })}
                                    </p>
                                  </div>

                                  {/* Logout Time */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <LogOut className="w-4 h-4 text-red-600" />
                                      <span className="text-sm font-medium text-red-700">Logout</span>
                                    </div>
                                    {logoutTime ? (
                                      <>
                                        <p className="text-base font-semibold">{format(logoutTime, 'HH:mm:ss')}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatDistance(logoutTime, new Date(), { addSuffix: true })}
                                        </p>
                                      </>
                                    ) : (
                                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                        Currently Active
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Duration */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Timer className="w-4 h-4 text-purple-600" />
                                      <span className="text-sm font-medium text-purple-700">Duration</span>
                                    </div>
                                    {session.duration ? (
                                      <>
                                        <p className="text-base font-semibold">
                                          {(session.duration / 60).toFixed(2)}h
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          ({session.duration} minutes)
                                        </p>
                                      </>
                                    ) : (
                                      <p className="text-sm text-blue-600 font-medium">Ongoing...</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-muted/50 rounded-lg">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No sessions recorded</p>
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  {attendance.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Notes</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {attendance.notes}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Absent Information */}
              {attendance.status === 'Absent' && (
                <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-center">
                  <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-red-900 mb-2">No Attendance Recorded</h3>
                  <p className="text-red-700">
                    {attendance.staffName} has not logged into the system today.
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Staff will be marked as present once they log into their dashboard.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
              <Button onClick={onClose}>Close</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}