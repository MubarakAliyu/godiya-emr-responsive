import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import type { AttendanceRecord } from '../index';

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  allRecords: AttendanceRecord[];
}

export function AttendanceHistoryModal({
  isOpen,
  onClose,
  staffId,
  staffName,
  allRecords,
}: AttendanceHistoryModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter records for this staff member
  const staffRecords = useMemo(() => {
    return allRecords
      .filter((record) => record.staffId === staffId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allRecords, staffId]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = staffRecords.length;
    const present = staffRecords.filter((r) => r.status === 'Present').length;
    const late = staffRecords.filter((r) => r.status === 'Late').length;
    const absent = staffRecords.filter((r) => r.status === 'Absent').length;
    const onLeave = staffRecords.filter((r) => r.status === 'On Leave').length;

    return {
      total,
      present,
      late,
      absent,
      onLeave,
      presentPercentage: ((present / total) * 100).toFixed(1),
      latePercentage: ((late / total) * 100).toFixed(1),
      absentPercentage: ((absent / total) * 100).toFixed(1),
      onLeavePercentage: ((onLeave / total) * 100).toFixed(1),
      attendanceRate: (((present + late) / total) * 100).toFixed(1),
    };
  }, [staffRecords]);

  // Pagination
  const totalPages = Math.ceil(staffRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = staffRecords.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Present: 'bg-green-100 text-green-700 border-green-200',
      Absent: 'bg-red-100 text-red-700 border-red-200',
      Late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'On Leave': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return variants[status] || 'bg-gray-100 text-gray-700 border-gray-200';
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-lg shadow-xl z-50 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete attendance record for {staffName}
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
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-blue-600 mb-1">Total Days</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-sm text-green-600 mb-1">Present</p>
                  <p className="text-2xl font-bold text-green-900">{stats.present}</p>
                  <p className="text-xs text-green-600 mt-1">{stats.presentPercentage}%</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <p className="text-sm text-yellow-600 mb-1">Late</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
                  <p className="text-xs text-yellow-600 mt-1">{stats.latePercentage}%</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <p className="text-sm text-red-600 mb-1">Absent</p>
                  <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
                  <p className="text-xs text-red-600 mt-1">{stats.absentPercentage}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-sm text-purple-600 mb-1">On Leave</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.onLeave}</p>
                  <p className="text-xs text-purple-600 mt-1">{stats.onLeavePercentage}%</p>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Overall Attendance Rate</p>
                    <p className="text-4xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    {parseFloat(stats.attendanceRate) >= 90 ? (
                      <TrendingUp className="w-10 h-10 text-green-600" />
                    ) : (
                      <TrendingDown className="w-10 h-10 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${stats.attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Records Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Detailed Records</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          S/N
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Day
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Check In
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Check Out
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Work Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.map((record, index) => {
                        const workHours =
                          record.checkIn !== '-' && record.checkOut !== '-'
                            ? '9h 00m'
                            : '-';
                        return (
                          <tr key={record.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 text-sm">{startIndex + index + 1}</td>
                            <td className="p-3 text-sm font-medium">
                              {format(record.date, 'MMM dd, yyyy')}
                            </td>
                            <td className="p-3 text-sm">{format(record.date, 'EEEE')}</td>
                            <td className="p-3 text-sm">
                              <Badge className={getStatusBadge(record.status)}>
                                {record.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">{record.checkIn}</td>
                            <td className="p-3 text-sm">{record.checkOut}</td>
                            <td className="p-3 text-sm">{workHours}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}–{Math.min(endIndex, staffRecords.length)} of{' '}
                    {staffRecords.length} records
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Prev
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
