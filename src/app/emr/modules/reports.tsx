import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, BarChart3, Bed, Calendar, ChevronLeft, ChevronRight, DollarSign, Download, Eye, FileText, Filter, LineChart, Printer, RefreshCw, Search, TrendingUp, User, Users, X } from 'lucide-react';
import {
  LineChart as RechartsLine,
  BarChart as RechartsBar,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { useEMRStore } from '../store/emr-store';
import { toast } from 'sonner';

export function ReportsPage() {
  const {
    patients,
    appointments,
    staff,
    bedCategories,
    departments,
    billingRecords,
    staffAttendance,
    activities,
  } = useEMRStore();

  // Filter & Pagination State
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [activeTab, setActiveTab] = useState('financial');
  const [tabSearchQuery, setTabSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Report Data State
  const [reportStats, setReportStats] = useState<any>(null);
  const [billingData, setBillingData] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [flowData, setFlowData] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [modalType, setModalType] = useState<'financial' | 'patient' | 'appointment' | 'staff'>('financial');

  const fetchReports = async () => {
    try {
      setIsLoading(true);

      // Fetch stats
      const statsRes = await fetch('/api/admin_reports.php?type=overview');
      const stats = await statsRes.json();
      setReportStats(stats);

      // Fetch financial data (includes records and trend)
      const finRes = await fetch(`/api/admin_reports.php?type=financial&from=${dateRange.start}&to=${dateRange.end}`);
      const fin = await finRes.json();
      setBillingData(fin.records || []);
      setRevenueTrend(fin.revenueTrend || []);

      // Fetch department performance
      const deptRes = await fetch(`/api/admin_reports.php?type=department-performance&from=${dateRange.start}&to=${dateRange.end}`);
      const dept = await deptRes.json();
      setDeptData(dept);

      // Fetch patient flow
      const flowRes = await fetch('/api/admin_reports.php?type=patient-flow');
      const flow = await flowRes.json();
      setFlowData(flow);

      // Fetch audit logs — pass date range if set, always include credentials
      const auditParams = new URLSearchParams({ type: 'audit-logs', limit: '500' });
      if (dateRange.start) auditParams.set('from', dateRange.start);
      if (dateRange.end) auditParams.set('to', dateRange.end);
      const auditRes = await fetch(`/api/admin_reports.php?${auditParams.toString()}`, { credentials: 'include' });
      const audit = await auditRes.json();
      if (Array.isArray(audit)) {
        setAuditData(audit);
      } else {
        console.warn('Audit logs API error:', audit);
      }

    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  // Generate better mock data for charts (Keeping as fallback)
  const mockChartData = useMemo(() => {
    return {
      revenueTrend: revenueTrend.length > 0 ? revenueTrend : [],
      departmentPerf: deptData.length > 0 ? deptData : [],
      patientFlow: flowData.length > 0 ? flowData : [],
      attendance: [], // Add attendance API later if needed
    };
  }, [revenueTrend, deptData, flowData]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (reportStats) {
      return {
        totalPatients: reportStats.totalPatients,
        totalRevenue: reportStats.totalRevenue,
        appointmentsToday: reportStats.appointmentsToday,
        activeStaffToday: reportStats.activeStaffToday,
        bedOccupancy: reportStats.bedOccupancy,
      };
    }

    // Fallback to store if API fails or hasn't loaded
    const totalPatients = patients?.length || 0;
    const totalRevenue = billingRecords?.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0) || 0;
    const today = new Date().toISOString().split('T')[0];
    const appointmentsToday = appointments?.filter(apt => apt.date === today).length || 0;
    const activeStaffToday = staff?.filter(s => s.status === 'Active').length || 0;

    return {
      totalPatients,
      totalRevenue,
      appointmentsToday,
      activeStaffToday,
      bedOccupancy: '0.0',
    };
  }, [reportStats, patients, appointments, staff, billingRecords]);

  // Filter Logic with search (Updated to use fetched billingData)
  const filteredBillingRecords = useMemo(() => {
    let records = billingData.length > 0 ? billingData : (billingRecords || []);

    return records.filter((bill) => {
      const matchesDept = departmentFilter === 'all' || bill.department === departmentFilter;
      const matchesPayment = paymentFilter === 'all' || bill.paymentStatus === paymentFilter;
      const matchesSearch = tabSearchQuery === '' ||
        bill.patientName.toLowerCase().includes(tabSearchQuery.toLowerCase()) ||
        bill.invoiceNumber.toLowerCase().includes(tabSearchQuery.toLowerCase());
      return matchesDept && matchesPayment && matchesSearch;
    });
  }, [billingData, billingRecords, departmentFilter, paymentFilter, tabSearchQuery]);

  const filteredPatients = useMemo(() => {
    let pats = patients || [];

    return pats.filter((patient) => {
      const matchesDept = departmentFilter === 'all';
      const matchesSearch = tabSearchQuery === '' ||
        patient.fullName.toLowerCase().includes(tabSearchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(tabSearchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [patients, departmentFilter, tabSearchQuery]);

  const filteredAppointments = useMemo(() => {
    let apts = appointments || [];

    return apts.filter((apt) => {
      const matchesDept = departmentFilter === 'all' || apt.department === departmentFilter;
      const matchesSearch = tabSearchQuery === '' ||
        apt.patientName?.toLowerCase().includes(tabSearchQuery.toLowerCase()) ||
        apt.id.toLowerCase().includes(tabSearchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [appointments, departmentFilter, tabSearchQuery]);

  const filteredStaff = useMemo(() => {
    let staffList = staff || [];

    return staffList.filter((s) => {
      const matchesDept = departmentFilter === 'all' || s.department === departmentFilter;
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      const matchesSearch = tabSearchQuery === '' ||
        s.fullName.toLowerCase().includes(tabSearchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(tabSearchQuery.toLowerCase());
      return matchesDept && matchesRole && matchesSearch;
    });
  }, [staff, departmentFilter, roleFilter, tabSearchQuery]);

  // Handlers
  const handleExportCSV = (tabName: string) => {
    let csvContent = '';
    let fileName = '';

    switch (tabName) {
      case 'financial':
        csvContent = [
          ['S/N', 'Invoice ID', 'Patient', 'Department', 'Date', 'Amount', 'Status'].join(','),
          ...filteredBillingRecords.map((bill, idx) => [
            idx + 1,
            bill.invoiceNumber,
            bill.patientName,
            bill.department,
            new Date(bill.billingDate).toLocaleDateString(),
            bill.totalAmount,
            bill.paymentStatus,
          ].join(',')),
        ].join('\n');
        fileName = 'financial-report';
        break;
      case 'patient':
        csvContent = [
          ['File No', 'Name', 'File Type', 'Gender', 'Status', 'Last Visit'].join(','),
          ...filteredPatients.map((p) => [
            p.id,
            p.fullName,
            p.fileType,
            p.gender,
            p.status,
            new Date(p.dateCreated).toLocaleDateString(),
          ].join(',')),
        ].join('\n');
        fileName = 'patient-report';
        break;
      case 'appointment':
        csvContent = [
          ['Appt ID', 'File ID', 'Doctor', 'Department', 'Date', 'Priority', 'Status'].join(','),
          ...filteredAppointments.map((apt) => [
            apt.id,
            apt.patientId,
            apt.doctorName,
            apt.department,
            apt.appointmentDate,
            apt.priority,
            apt.status,
          ].join(',')),
        ].join('\n');
        fileName = 'appointment-report';
        break;
      case 'staff':
        csvContent = [
          ['Staff ID', 'Name', 'Role', 'Department', 'Status'].join(','),
          ...filteredStaff.map((s) => [
            s.id,
            s.fullName,
            s.role,
            s.department,
            s.employmentStatus,
          ].join(',')),
        ].join('\n');
        fileName = 'staff-report';
        break;
      case 'bed':
        csvContent = [
          ['Bed Category', 'Total Beds', 'Occupied', 'Available', 'Revenue'].join(','),
          ...(bedCategories || []).map((bed) => [
            bed.categoryName,
            bed.totalBeds,
            bed.occupiedBeds,
            bed.availableBeds,
            bed.occupiedBeds * bed.pricePerDay,
          ].join(',')),
        ].join('\n');
        fileName = 'bed-report';
        break;
      case 'audit':
        csvContent = [
          ['S/N', 'User', 'Role', 'Action', 'Module', 'Timestamp'].join(','),
          ...(activities || []).map((act, idx) => [
            idx + 1,
            act.userName,
            act.userRole,
            act.action,
            act.module,
            new Date(act.timestamp).toLocaleString(),
          ].join(',')),
        ].join('\n');
        fileName = 'audit-log';
        break;
      default:
        return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const handlePrintReport = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setDepartmentFilter('all');
    setRoleFilter('all');
    setPaymentFilter('all');
    setTabSearchQuery('');
    setCurrentPage(1);
    toast.success('Filters reset');
  };

  const handleViewRecord = (record: any, type: 'financial' | 'patient' | 'appointment' | 'staff') => {
    setSelectedRecord(record);
    setModalType(type);
    setViewModalOpen(true);
  };

  // Pagination
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Reports Center</h1>
          <p className="text-muted-foreground mt-1">
            System-Wide Analytics & Audit Reporting
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleExportCSV(activeTab)} variant="secondary">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          <Button onClick={handlePrintReport} variant="outline">
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Patients"
          value={kpis.totalPatients}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          title="Total Revenue"
          value={`₦${kpis.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-100 text-green-600"
          delay={0.1}
          isNumeric={false}
        />
        <KPICard
          title="Appointments Today"
          value={kpis.appointmentsToday}
          icon={Calendar}
          color="bg-indigo-100 text-indigo-600"
          delay={0.2}
        />
        <KPICard
          title="Active Staff Today"
          value={kpis.activeStaffToday}
          icon={Activity}
          color="bg-orange-100 text-orange-600"
          delay={0.3}
        />
        <KPICard
          title="Bed Occupancy"
          value={`${kpis.bedOccupancy}%`}
          icon={Bed}
          color="bg-purple-100 text-purple-600"
          delay={0.4}
          isNumeric={false}
        />
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-lg shadow-sm border border-border p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase">Start Date</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase">End Date</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase">Department</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase">Payment Status</Label>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={resetFilters} className="w-full h-9">
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Analytics Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Revenue Trend Chart */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground text-base">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-1">Monthly revenue performance</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={chartType === 'line' ? 'default' : 'outline'}
                onClick={() => setChartType('line')}
              >
                <LineChart className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant={chartType === 'bar' ? 'default' : 'outline'}
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            {chartType === 'line' ? (
              <RechartsLine data={mockChartData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={(value) => `₦${(value / 1000)}K`}
                />
                <Tooltip
                  formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ fill: '#1e40af', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLine>
            ) : (
              <RechartsBar data={mockChartData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={(value) => `₦${(value / 1000)}K`}
                />
                <Tooltip
                  formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="revenue" fill="#1e40af" radius={[8, 8, 0, 0]} />
              </RechartsBar>
            )}
          </ResponsiveContainer>
        </div>

        {/* Department Performance */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-foreground text-base">Department Performance</h3>
            <p className="text-xs text-muted-foreground mt-1">Revenue by department</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={mockChartData.departmentPerf}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {mockChartData.departmentPerf.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Flow */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-foreground text-base">Patient Flow (OPD vs IPD)</h3>
            <p className="text-xs text-muted-foreground mt-1">Monthly patient distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockChartData.patientFlow}>
              <defs>
                <linearGradient id="colorOpd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e40af" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorIpd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                fontSize={11}
                tickMargin={8}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="opd"
                stroke="#1e40af"
                fillOpacity={1}
                fill="url(#colorOpd)"
                name="OPD Patients"
              />
              <Area
                type="monotone"
                dataKey="ipd"
                stroke="#059669"
                fillOpacity={1}
                fill="url(#colorIpd)"
                name="IPD Patients"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Staff Attendance */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-foreground text-base">Staff Attendance Summary</h3>
            <p className="text-xs text-muted-foreground mt-1">Weekly attendance breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RechartsBar data={mockChartData.attendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={11}
                tickMargin={8}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} name="Present" />
              <Bar dataKey="late" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Late" />
              <Bar dataKey="absent" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} name="Absent" />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Report Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
      >
        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          setTabSearchQuery('');
          setCurrentPage(1);
        }} className="w-full">
          <div className="border-b border-border bg-muted/30 px-6">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="financial" className="data-[state=active]:bg-background">Financial</TabsTrigger>
              <TabsTrigger value="patient" className="data-[state=active]:bg-background">Patient</TabsTrigger>
              <TabsTrigger value="appointment" className="data-[state=active]:bg-background">Appointment</TabsTrigger>
              <TabsTrigger value="staff" className="data-[state=active]:bg-background">Staff</TabsTrigger>
              <TabsTrigger value="bed" className="data-[state=active]:bg-background">Bed & Admission</TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-background">Audit Logs</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Tab Filter Bar */}
            <div className="mb-6 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab} records...`}
                  value={tabSearchQuery}
                  onChange={(e) => {
                    setTabSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(activeTab)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Financial Report Tab */}
            <TabsContent value="financial" className="mt-0">
              <FinancialReportTable
                records={getPaginatedData(filteredBillingRecords)}
                onView={(record) => handleViewRecord(record, 'financial')}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages(filteredBillingRecords)}
                onPageChange={setCurrentPage}
                totalItems={filteredBillingRecords.length}
              />
            </TabsContent>

            {/* Patient Report Tab */}
            <TabsContent value="patient" className="mt-0">
              <PatientReportTable
                patients={getPaginatedData(filteredPatients)}
                onView={(record) => handleViewRecord(record, 'patient')}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages(filteredPatients)}
                onPageChange={setCurrentPage}
                totalItems={filteredPatients.length}
              />
            </TabsContent>

            {/* Appointment Report Tab */}
            <TabsContent value="appointment" className="mt-0">
              <AppointmentReportTable
                appointments={getPaginatedData(filteredAppointments)}
                onView={(record) => handleViewRecord(record, 'appointment')}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages(filteredAppointments)}
                onPageChange={setCurrentPage}
                totalItems={filteredAppointments.length}
              />
            </TabsContent>

            {/* Staff Report Tab */}
            <TabsContent value="staff" className="mt-0">
              <StaffReportTable
                staff={getPaginatedData(filteredStaff)}
                onView={(record) => handleViewRecord(record, 'staff')}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages(filteredStaff)}
                onPageChange={setCurrentPage}
                totalItems={filteredStaff.length}
              />
            </TabsContent>

            {/* Bed Report Tab */}
            <TabsContent value="bed" className="mt-0">
              <BedReportTable bedCategories={bedCategories || []} />
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit" className="mt-0">
              <AuditLogTable activities={getPaginatedData(auditData.length > 0 ? auditData : (activities || []))} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages(auditData.length > 0 ? auditData : (activities || []))}
                onPageChange={setCurrentPage}
                totalItems={(auditData.length > 0 ? auditData : (activities || [])).length}
              />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>

      {/* View Record Modal */}
      <ViewRecordModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        record={selectedRecord}
        type={modalType}
      />
    </div >
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  color,
  delay,
  isNumeric = true,
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  delay: number;
  isNumeric?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-semibold text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange, totalItems }: any) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Financial Report Table
function FinancialReportTable({ records, onView }: { records: any[]; onView: (record: any) => void }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-border">
        <FileText className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-base font-medium text-foreground">No Financial Records Found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                S/N
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Invoice ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Patient
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {records.map((record, idx) => (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3.5 text-sm text-foreground">{idx + 1}</td>
                <td className="px-4 py-3.5 text-sm font-medium text-primary">{record.invoiceNumber}</td>
                <td className="px-4 py-3.5 text-sm text-foreground">{record.patientName}</td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">{record.department}</td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  {new Date(record.billingDate).toLocaleDateString('en-GB')}
                </td>
                <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                  ₦{record.totalAmount.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <Badge
                    variant="secondary"
                    className={
                      record.paymentStatus === 'Paid'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : record.paymentStatus === 'Unpaid'
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                    }
                  >
                    {record.paymentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <Button size="sm" variant="ghost" onClick={() => onView(record)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Patient Report Table
function PatientReportTable({ patients, onView }: { patients: any[]; onView: (record: any) => void }) {
  if (patients.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-border">
        <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-base font-medium text-foreground">No Patient Records Found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                File No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                File Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Gender
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Last Visit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {patients.map((patient, idx) => (
              <motion.tr
                key={patient.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3.5 text-sm font-medium text-primary">{patient.id}</td>
                <td className="px-4 py-3.5 text-sm text-foreground font-medium">{patient.fullName}</td>
                <td className="px-4 py-3.5 text-sm">
                  <Badge
                    variant="secondary"
                    className={
                      patient.fileType === 'Individual'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                    }
                  >
                    {patient.fileType}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">{patient.gender}</td>
                <td className="px-4 py-3.5 text-sm">
                  <Badge
                    variant="secondary"
                    className={
                      patient.status === 'Active'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                    }
                  >
                    {patient.status}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  {new Date(patient.dateCreated).toLocaleDateString('en-GB')}
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <Button size="sm" variant="ghost" onClick={() => onView(patient)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Appointment Report Table
function AppointmentReportTable({ appointments, onView }: { appointments: any[]; onView: (record: any) => void }) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-border">
        <Calendar className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-base font-medium text-foreground">No Appointment Records Found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Appt ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                File ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {appointments.map((apt, idx) => (
              <motion.tr
                key={apt.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3.5 text-sm font-medium text-primary">{apt.id}</td>
                <td className="px-4 py-3.5 text-sm text-foreground">{apt.patientId}</td>
                <td className="px-4 py-3.5 text-sm text-foreground">{apt.doctorName}</td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">{apt.department}</td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  {new Date(apt.appointmentDate).toLocaleDateString('en-GB')}
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <Badge
                    variant="secondary"
                    className={
                      apt.priority === 'Emergency'
                        ? 'bg-red-100 text-red-700 hover:bg-red-100'
                        : apt.priority === 'Urgent'
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                    }
                  >
                    {apt.priority}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <Badge
                    variant="secondary"
                    className={
                      apt.status === 'Completed'
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                        : apt.status === 'Scheduled'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                    }
                  >
                    {apt.status}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <Button size="sm" variant="ghost" onClick={() => onView(apt)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Staff Report Table
function StaffReportTable({ staff, onView }: { staff: any[]; onView: (record: any) => void }) {
  if (staff.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-border">
        <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-base font-medium text-foreground">No Staff Records Found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Staff ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {staff.map((s, idx) => (
              <motion.tr
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3.5 text-sm font-medium text-primary">{s.id}</td>
                <td className="px-4 py-3.5 text-sm text-foreground font-medium">{s.fullName}</td>
                <td className="px-4 py-3.5 text-sm text-foreground">{s.role}</td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">{s.department}</td>
                <td className="px-4 py-3.5 text-sm">
                  <Badge
                    variant="secondary"
                    className={
                      s.employmentStatus === 'Active'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                    }
                  >
                    {s.employmentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <Button size="sm" variant="ghost" onClick={() => onView(s)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Bed Report Table
function BedReportTable({ bedCategories }: { bedCategories: any[] }) {
  if (bedCategories.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-border">
        <Bed className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-base font-medium text-foreground">No Bed Records Found</p>
        <p className="text-sm text-muted-foreground mt-1">No bed categories have been created yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Bed Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Beds
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Occupied
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Available
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Daily Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {bedCategories.map((bed, idx) => (
              <motion.tr
                key={bed.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{bed.categoryName}</td>
                <td className="px-4 py-3.5 text-sm text-foreground font-semibold">{bed.totalBeds}</td>
                <td className="px-4 py-3.5 text-sm">
                  <span className="text-red-600 font-semibold">{bed.occupiedBeds}</span>
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <span className="text-green-600 font-semibold">{bed.availableBeds}</span>
                </td>
                <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                  ₦{(bed.occupiedBeds * bed.pricePerDay).toLocaleString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Audit Log Table
function AuditLogTable({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-border">
        <Activity className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-base font-medium text-foreground">No Audit Logs Found</p>
        <p className="text-sm text-muted-foreground mt-1">System activities will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                S/N
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Module
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {activities.map((act, idx) => (
              <motion.tr
                key={act.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3.5 text-sm text-foreground">{idx + 1}</td>
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{act.userName}</td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">{act.userRole}</td>
                <td className="px-4 py-3.5 text-sm">
                  <Badge
                    variant="secondary"
                    className={
                      act.action.includes('Created') || act.action.includes('Added')
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : act.action.includes('Updated') || act.action.includes('Edited')
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                          : act.action.includes('Deleted')
                            ? 'bg-red-100 text-red-700 hover:bg-red-100'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                    }
                  >
                    {act.action}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">{act.module}</td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  {new Date(act.timestamp).toLocaleString('en-GB')}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// View Record Modal
function ViewRecordModal({ open, onClose, record, type }: any) {
  if (!record) return null;

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                {type === 'financial' && 'Financial Record Details'}
                {type === 'patient' && 'Patient Record Details'}
                {type === 'appointment' && 'Appointment Details'}
                {type === 'staff' && 'Staff Details'}
              </DialogTitle>
              <DialogDescription>
                Detailed information about this record
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {type === 'financial' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Invoice Number</p>
                    <p className="text-sm font-semibold text-primary">{record.invoiceNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Patient Name</p>
                    <p className="text-sm font-medium">{record.patientName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Department</p>
                    <p className="text-sm">{record.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Billing Date</p>
                    <p className="text-sm">{new Date(record.billingDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Total Amount</p>
                    <p className="text-lg font-bold text-green-600">₦{record.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Payment Status</p>
                    <Badge
                      className={
                        record.paymentStatus === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : record.paymentStatus === 'Unpaid'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-orange-100 text-orange-700'
                      }
                    >
                      {record.paymentStatus}
                    </Badge>
                  </div>
                </div>
              )}

              {type === 'patient' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">File Number</p>
                    <p className="text-sm font-semibold text-primary">{record.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Full Name</p>
                    <p className="text-sm font-medium">{record.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">File Type</p>
                    <Badge className={record.fileType === 'Individual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                      {record.fileType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Gender</p>
                    <p className="text-sm">{record.gender}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Status</p>
                    <Badge className={record.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {record.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Date Created</p>
                    <p className="text-sm">{new Date(record.dateCreated).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              )}

              {type === 'appointment' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Appointment ID</p>
                    <p className="text-sm font-semibold text-primary">{record.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Patient ID</p>
                    <p className="text-sm">{record.patientId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Doctor Name</p>
                    <p className="text-sm font-medium">{record.doctorName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Department</p>
                    <p className="text-sm">{record.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Appointment Date</p>
                    <p className="text-sm">{new Date(record.appointmentDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Priority</p>
                    <Badge
                      className={
                        record.priority === 'Emergency'
                          ? 'bg-red-100 text-red-700'
                          : record.priority === 'Urgent'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                      }
                    >
                      {record.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Status</p>
                    <Badge
                      className={
                        record.status === 'Completed'
                          ? 'bg-purple-100 text-purple-700'
                          : record.status === 'Scheduled'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                </div>
              )}

              {type === 'staff' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Staff ID</p>
                    <p className="text-sm font-semibold text-primary">{record.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Full Name</p>
                    <p className="text-sm font-medium">{record.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Role</p>
                    <p className="text-sm">{record.role}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Department</p>
                    <p className="text-sm">{record.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Status</p>
                    <Badge className={record.employmentStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {record.employmentStatus}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
