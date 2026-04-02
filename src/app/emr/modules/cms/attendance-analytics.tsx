import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Clock, Download, Edit, Eye, FileText, Filter, Search, Trash2, User, UserCheck, UserMinus, UserX, Users } from 'lucide-react';
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
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { StaffAttendance, AttendanceStatus, StaffDepartment, StaffRole } from '@/app/emr/store/types';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ViewAttendanceModal } from './components/view-attendance-modal';
import { EditAttendanceModal } from './components/edit-attendance-modal';
import { DeleteAttendanceModal } from './components/delete-attendance-modal';

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
  value: number | string;
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
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{value}</p>
            {percentage && (
              <p className="text-sm text-muted-foreground">({percentage})</p>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

// Status Badge Component
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

export function StaffAttendanceAnalytics() {
  const { staff, staffAttendance, addStaffAttendance, updateStaffAttendance, deleteStaffAttendance } = useEMRStore();

  // Get today's date - must be declared first
  const today = new Date().toISOString().split('T')[0];

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<StaffAttendance | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [specificDate, setSpecificDate] = useState(today);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when date range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, specificDate]);

  // Generate mock attendance for today if none exists
  useEffect(() => {
    const todayAttendance = staffAttendance.filter(a => a.date === today);
    
    if (todayAttendance.length === 0 && staff.length > 0) {
      // Batch generate attendance for all active staff
      staff.forEach((s, index) => {
        // Check if attendance already exists for this staff today
        const existingAttendance = staffAttendance.find(
          a => a.staffId === s.id && a.date === today
        );
        
        if (!existingAttendance) {
          let status: AttendanceStatus = 'Present';
          let checkInTime = '08:00';
          let lateMinutes = 0;
          
          // Create different scenarios for demo
          if (index % 7 === 0) {
            status = 'Late';
            checkInTime = '09:15';
            lateMinutes = 75;
          } else if (index % 11 === 0) {
            status = 'On Leave';
            checkInTime = undefined;
          } else if (index % 13 === 0) {
            status = 'Absent';
            checkInTime = undefined;
          }
          
          addStaffAttendance({
            staffId: s.id,
            staffName: s.fullName,
            department: s.department,
            role: s.role,
            date: today,
            status,
            checkInTime,
            checkOutTime: status === 'Present' || status === 'Late' ? '17:00' : undefined,
            lateMinutes,
          });
        }
      });
    }
  }, [staff.length, today, staffAttendance.length]); // Add staffAttendance.length to dependencies

  // Filter attendance based on date range
  const getFilteredByDate = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'today':
        return staffAttendance.filter(a => a.date === today);
      case 'week':
        startDate.setDate(now.getDate() - 7);
        return staffAttendance.filter(a => new Date(a.date) >= startDate);
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        return staffAttendance.filter(a => new Date(a.date) >= startDate);
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        return staffAttendance.filter(a => new Date(a.date) >= startDate);
      case 'specific':
        return staffAttendance.filter(a => a.date === specificDate);
      default:
        return staffAttendance.filter(a => a.date === today);
    }
  };

  const dateFilteredAttendance = getFilteredByDate();

  // Filter today's attendance for KPIs
  const todayAttendance = staffAttendance.filter(a => a.date === today);

  // Calculate KPIs - based on date filter selection
  const displayAttendance = dateRange === 'today' ? todayAttendance : dateFilteredAttendance;
  const totalStaff = staff.length;
  const presentCount = displayAttendance.filter(a => a.status === 'Present').length;
  const absentCount = displayAttendance.filter(a => a.status === 'Absent').length;
  const lateCount = displayAttendance.filter(a => a.status === 'Late').length;
  const onLeaveCount = displayAttendance.filter(a => a.status === 'On Leave').length;

  const presentPercentage = totalStaff > 0 ? ((presentCount / totalStaff) * 100).toFixed(1) : '0';
  const absentPercentage = totalStaff > 0 ? ((absentCount / totalStaff) * 100).toFixed(1) : '0';
  const latePercentage = totalStaff > 0 ? ((lateCount / totalStaff) * 100).toFixed(1) : '0';
  const onLeavePercentage = totalStaff > 0 ? ((onLeaveCount / totalStaff) * 100).toFixed(1) : '0';

  // Prepare 7-day trend data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayAttendance = staffAttendance.filter(a => a.date === dateStr);
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Present: dayAttendance.filter(a => a.status === 'Present').length,
      Late: dayAttendance.filter(a => a.status === 'Late').length,
      Absent: dayAttendance.filter(a => a.status === 'Absent').length,
    };
  });

  // Prepare department distribution data
  const departments: StaffDepartment[] = [
    'Administration',
    'Nursing',
    'Medical',
    'Pharmacy',
    'Laboratory',
  ];

  const departmentData = departments.map(dept => ({
    name: dept,
    value: todayAttendance.filter(a => a.department === dept).length,
  })).filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  // Filter attendance for table - use dateFilteredAttendance for live updates
  const filteredAttendance = dateFilteredAttendance.filter(attendance => {
    const matchesSearch = searchTerm === '' || 
      attendance.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendance.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || attendance.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || attendance.department === departmentFilter;
    const matchesRole = roleFilter === 'all' || attendance.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);

  // Handlers
  const handleView = (attendance: StaffAttendance) => {
    setSelectedAttendance(attendance);
    setIsViewModalOpen(true);
  };

  const handleEdit = (attendance: StaffAttendance) => {
    setSelectedAttendance(attendance);
    setIsEditModalOpen(true);
  };

  const handleDelete = (attendance: StaffAttendance) => {
    setSelectedAttendance(attendance);
    setIsDeleteModalOpen(true);
  };

  const handleExportPDF = () => {
    toast.success('PDF Export feature coming soon!');
  };

  const handleExportCSV = () => {
    // Prepare CSV data
    const csvHeaders = ['Staff ID', 'Name', 'Department', 'Role', 'Status', 'Check In', 'Check Out', 'Date'];
    const csvRows = todayAttendance.map(a => [
      a.staffId,
      a.staffName,
      a.department,
      a.role,
      a.status,
      a.checkInTime || 'N/A',
      a.checkOutTime || 'N/A',
      a.date,
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${today}.csv`;
    a.click();
    
    toast.success('CSV exported successfully');
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setRoleFilter('all');
    setCurrentPage(1);
    toast.success('Filters reset');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Staff Attendance Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Real-time attendance monitoring and analytics dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="specific">Specific Date</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === 'specific' && (
            <Input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="w-[140px]"
            />
          )}
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={Users}
          label="Total Staff"
          value={totalStaff}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          icon={UserCheck}
          label="Present"
          value={presentCount}
          percentage={`${presentPercentage}%`}
          color="bg-green-100 text-green-600"
          delay={0.1}
        />
        <KPICard
          icon={UserX}
          label="Absent"
          value={absentCount}
          percentage={`${absentPercentage}%`}
          color="bg-red-100 text-red-600"
          delay={0.2}
        />
        <KPICard
          icon={Clock}
          label="Late"
          value={lateCount}
          percentage={`${latePercentage}%`}
          color="bg-yellow-100 text-yellow-600"
          delay={0.3}
        />
        <KPICard
          icon={UserMinus}
          label="On Leave"
          value={onLeaveCount}
          percentage={`${onLeavePercentage}%`}
          color="bg-purple-100 text-purple-600"
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-border shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">7-Day Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="Present" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorPresent)" 
              />
              <Area 
                type="monotone" 
                dataKey="Late" 
                stroke="#f59e0b" 
                fillOpacity={1} 
                fill="url(#colorLate)" 
              />
              <Area 
                type="monotone" 
                dataKey="Absent" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorAbsent)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Attendance Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-white rounded-xl p-6 border border-border shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No attendance data available</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Attendance Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="bg-white rounded-xl border border-border shadow-sm overflow-hidden"
      >
        {/* Table Header */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold mb-4">
            {dateRange === 'today' && 'Today\'s Attendance Records'}
            {dateRange === 'week' && 'This Week\'s Attendance Records'}
            {dateRange === 'month' && 'This Month\'s Attendance Records'}
            {dateRange === 'year' && 'This Year\'s Attendance Records'}
            {dateRange === 'specific' && `Attendance Records for ${new Date(specificDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </h3>
          
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
                <SelectItem value="Nursing">Nursing</SelectItem>
                <SelectItem value="Medical">Medical</SelectItem>
                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                <SelectItem value="Laboratory">Laboratory</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleReset}>
              <Filter className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-4 font-medium text-sm">S/N</th>
                <th className="text-left p-4 font-medium text-sm">Staff ID</th>
                <th className="text-left p-4 font-medium text-sm">Name</th>
                <th className="text-left p-4 font-medium text-sm">Department</th>
                <th className="text-left p-4 font-medium text-sm">Role</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Check In</th>
                <th className="text-left p-4 font-medium text-sm">Check Out</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAttendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No attendance records found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No attendance records yet for today'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAttendance.map((attendance, index) => (
                  <motion.tr
                    key={`${attendance.id}-${attendance.staffId}-${attendance.date}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 text-sm">{startIndex + index + 1}</td>
                    <td className="p-4 text-sm font-medium text-primary">
                      {attendance.staffId}
                    </td>
                    <td className="p-4 text-sm font-medium">{attendance.staffName}</td>
                    <td className="p-4 text-sm">{attendance.department}</td>
                    <td className="p-4 text-sm">{attendance.role}</td>
                    <td className="p-4">
                      <StatusBadge status={attendance.status} />
                    </td>
                    <td className="p-4 text-sm">
                      {attendance.checkInTime || (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {attendance.checkOutTime || (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(attendance)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(attendance)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(attendance)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredAttendance.length)} of{' '}
              {filteredAttendance.length} records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <ViewAttendanceModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAttendance(null);
        }}
        attendance={selectedAttendance}
      />
      <EditAttendanceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAttendance(null);
        }}
        attendance={selectedAttendance}
      />
      <DeleteAttendanceModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedAttendance(null);
        }}
        attendance={selectedAttendance}
      />
    </div>
  );
}