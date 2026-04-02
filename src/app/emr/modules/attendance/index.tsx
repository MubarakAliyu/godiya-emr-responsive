import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Download, Eye, Printer, RotateCcw, Search, TrendingUp, User, UserCheck, UserX, Users, X, XCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { ViewAttendanceDetailsModal } from './components/view-attendance-details-modal';
import type { StaffAttendance } from '@/app/emr/store/types';

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
  percentage,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string | number;
  percentage?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {percentage && (
            <p className="text-sm text-muted-foreground mt-1">({percentage})</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

export function AttendancePage() {
  const { staffAttendance, staff, getTodayAttendance, addNotification } = useEMRStore();

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<StaffAttendance | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get today's attendance (live data)
  const todayAttendance = useMemo(() => getTodayAttendance(), [staffAttendance]);

  // Calculate total staff count
  const totalStaffCount = staff.filter(s => s.status === 'Active').length;

  // Create attendance records for absent staff (staff who haven't logged in today)
  const completeAttendanceList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const presentStaffIds = todayAttendance.map(a => a.staffId);
    
    // Get all active staff
    const activeStaff = staff.filter(s => s.status === 'Active');
    
    // Add absent records for staff who haven't logged in
    const absentRecords: StaffAttendance[] = activeStaff
      .filter(s => !presentStaffIds.includes(s.id))
      .map(s => ({
        id: `ABSENT-${s.id}-${today}`,
        staffId: s.id,
        staffName: s.fullName,
        department: s.department,
        role: s.role,
        date: new Date().toISOString(),
        status: 'Absent' as const,
        checkInTime: undefined,
        checkOutTime: undefined,
        sessions: [],
        totalHoursWorked: 0,
      }));

    return [...todayAttendance, ...absentRecords];
  }, [todayAttendance, staff]);

  // Apply filters
  const filteredAttendance = useMemo(() => {
    return completeAttendanceList.filter((record) => {
      const matchesSearch =
        searchTerm === '' ||
        record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [completeAttendanceList, searchTerm, statusFilter, departmentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttendance = filteredAttendance.slice(startIndex, endIndex);

  // Calculate KPIs
  const presentCount = completeAttendanceList.filter(a => a.status === 'Present').length;
  const lateCount = completeAttendanceList.filter(a => a.status === 'Late').length;
  const absentCount = completeAttendanceList.filter(a => a.status === 'Absent').length;
  const onLeaveCount = completeAttendanceList.filter(a => a.status === 'On Leave').length;
  
  const attendanceRate = totalStaffCount > 0
    ? (((presentCount + lateCount) / totalStaffCount) * 100).toFixed(1)
    : '0.0';

  const punctualityRate = (presentCount + lateCount) > 0
    ? ((presentCount / (presentCount + lateCount)) * 100).toFixed(1)
    : '0.0';

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(staff.map(s => s.department));
    return Array.from(depts).sort();
  }, [staff]);

  // Chart Data - Status Distribution (Pie Chart)
  const statusChartData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Absent', value: absentCount, color: '#ef4444' },
    { name: 'On Leave', value: onLeaveCount, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  // Department Attendance Chart (Bar Chart)
  const departmentChartData = useMemo(() => {
    const deptStats = departments.map(dept => {
      const deptRecords = completeAttendanceList.filter(a => a.department === dept);
      const deptPresent = deptRecords.filter(a => a.status === 'Present').length;
      const deptLate = deptRecords.filter(a => a.status === 'Late').length;
      const deptAbsent = deptRecords.filter(a => a.status === 'Absent').length;

      return {
        name: dept,
        Present: deptPresent,
        Late: deptLate,
        Absent: deptAbsent,
      };
    });
    return deptStats;
  }, [departments, completeAttendanceList]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setCurrentPage(1);
    toast.success('Filters reset successfully');
  };

  // View details
  const handleView = (attendance: StaffAttendance) => {
    setSelectedAttendance(attendance);
    setIsViewModalOpen(true);
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['S/N', 'Staff ID', 'Staff Name', 'Department', 'Role', 'Status', 'Check In', 'Check Out', 'Hours Worked'];
    const csvData = filteredAttendance.map((record, index) => [
      index + 1,
      record.staffId,
      record.staffName,
      record.department,
      record.role,
      record.status,
      record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm:ss') : '-',
      record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm:ss') : '-',
      record.totalHoursWorked ? `${record.totalHoursWorked.toFixed(2)}h` : '-',
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast.success('CSV Exported', {
      description: `${filteredAttendance.length} attendance records exported successfully.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Attendance Report Exported',
      message: `Attendance CSV report generated (${filteredAttendance.length} records)`,
      type: 'info',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Low',
    });
  };

  // Print report
  const handlePrintReport = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Staff Attendance Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #000; }
            .report-container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
            .header h1 { color: #1e40af; font-size: 32px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
            .summary-card { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .summary-card h3 { color: #666; font-size: 14px; margin-bottom: 10px; }
            .summary-card p { font-size: 32px; font-weight: bold; }
            .attendance-table { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 12px; }
            .attendance-table th { background: #1e40af; color: white; padding: 10px; text-align: left; }
            .attendance-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .attendance-table tr:nth-child(even) { background: #f9fafb; }
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
            .status-present { background: #d1fae5; color: #065f46; }
            .status-late { background: #fef3c7; color: #92400e; }
            .status-absent { background: #fee2e2; color: #991b1b; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>GODIYA HOSPITAL</h1>
              <p>Staff Attendance Report - ${format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
              <p>Birnin Kebbi, Kebbi State, Nigeria</p>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <h3>Total Staff</h3>
                <p>${totalStaffCount}</p>
              </div>
              <div class="summary-card">
                <h3>Present</h3>
                <p style="color: #10b981;">${presentCount + lateCount}</p>
              </div>
              <div class="summary-card">
                <h3>Absent</h3>
                <p style="color: #ef4444;">${absentCount}</p>
              </div>
              <div class="summary-card">
                <h3>Attendance Rate</h3>
                <p style="color: #1e40af;">${attendanceRate}%</p>
              </div>
            </div>

            <table class="attendance-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAttendance.map((record, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${record.staffId}</td>
                    <td><strong>${record.staffName}</strong></td>
                    <td>${record.department}</td>
                    <td>${record.role}</td>
                    <td>
                      <span class="status-badge status-${record.status.toLowerCase()}">
                        ${record.status}
                      </span>
                    </td>
                    <td>${record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm:ss') : '-'}</td>
                    <td>${record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm:ss') : '-'}</td>
                    <td>${record.totalHoursWorked ? record.totalHoursWorked.toFixed(2) + 'h' : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    if (frameDoc) {
      const doc = frameDoc.document || frameDoc;
      doc.open();
      doc.write(reportHTML);
      doc.close();

      setTimeout(() => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          }

          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);

          toast.success('Report Printing');

          addNotification({
            id: Date.now(),
            title: 'Attendance Report Printed',
            message: 'Attendance report generated and sent to printer',
            type: 'info',
            status: 'Unread',
            timestamp: new Date().toISOString(),
            priority: 'Low',
          });
        } catch (error) {
          toast.error('Print Error', {
            description: 'Unable to print report. Please try again.',
          });
        }
      }, 500);
    }
  };

  // Get status color
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

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Staff Attendance Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Live attendance tracking for {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={exportAsCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard
          icon={Users}
          label="Total Staff"
          value={totalStaffCount}
          color="bg-primary/10 text-primary"
          delay={0}
        />
        <KPICard
          icon={CheckCircle}
          label="Present"
          value={presentCount + lateCount}
          percentage={attendanceRate + '% rate'}
          color="bg-green-100 text-green-600"
          delay={0.05}
        />
        <KPICard
          icon={UserCheck}
          label="On Time"
          value={presentCount}
          percentage={punctualityRate + '% punctual'}
          color="bg-blue-100 text-blue-600"
          delay={0.1}
        />
        <KPICard
          icon={AlertCircle}
          label="Late"
          value={lateCount}
          color="bg-orange-100 text-orange-600"
          delay={0.15}
        />
        <KPICard
          icon={XCircle}
          label="Absent"
          value={absentCount}
          color="bg-red-100 text-red-600"
          delay={0.2}
        />
        <KPICard
          icon={Calendar}
          label="On Leave"
          value={onLeaveCount}
          color="bg-purple-100 text-purple-600"
          delay={0.25}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-border p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-border p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Department Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" fill="#10b981" />
              <Bar dataKey="Late" fill="#f59e0b" />
              <Bar dataKey="Absent" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search staff name, ID, or department..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Late">Late</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Filter */}
          <Select
            value={departmentFilter}
            onValueChange={(value) => {
              setDepartmentFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {currentAttendance.length} of {filteredAttendance.length} records
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </motion.div>

      {/* Attendance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">S/N</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Staff ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Staff Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Check In</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Check Out</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Hours Worked</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentAttendance.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Clock className="w-12 h-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No attendance records found for today.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentAttendance.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{record.staffId}</td>
                    <td className="px-4 py-3 text-sm font-medium">{record.staffName}</td>
                    <td className="px-4 py-3 text-sm">{record.department}</td>
                    <td className="px-4 py-3 text-sm">{record.role}</td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm:ss') : '-'}
                      {record.lateMinutes && record.lateMinutes > 0 && (
                        <span className="text-xs text-orange-600 block">
                          (+{record.lateMinutes} min late)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm:ss') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {record.totalHoursWorked ? `${record.totalHoursWorked.toFixed(2)}h` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(record)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} • {filteredAttendance.length} total records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* View Details Modal */}
      <ViewAttendanceDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        attendance={selectedAttendance}
      />
    </div>
  );
}
