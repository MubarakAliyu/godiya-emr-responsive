import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Bed, Building, Calendar, DollarSign, Edit, Eye, FlaskConical, Folder, FolderOpen, MoreVertical, Pill, Search, Trash2, TrendingUp, User, UserCog, UserX, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useEMRStore } from '../store/emr-store';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EditPatientModal } from './components/edit-patient-modal';
import { DeleteFileModal, RecordAsDeadModal, ViewSubfilesModal } from '../components/patient-action-modals';
import type { Patient } from '../store/types';
import { toast } from 'sonner';

// Animated Counter Component
function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1 });
    const unsubscribe = rounded.on('change', (latest) => setDisplayValue(latest));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  return <>{displayValue.toLocaleString()}</>;
}

// KPI Card Component (Simplified - No Trend)
function KPICard({ title, value, subtitle, icon: Icon, color, bgColor, onClick, isAnimated = false }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <h3 className="text-3xl font-semibold mb-1">
                {isAnimated ? <AnimatedCounter value={typeof value === 'number' ? value : 0} /> : value}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${bgColor}`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardHomeV2() {
  const { patients, appointments, invoices, deletePatient, markPatientAsDeceased } = useEMRStore();
  const navigate = useNavigate();

  // Live IPD count from tbl_bed_admission
  const [ipdCount, setIpdCount] = useState(0);
  useEffect(() => {
    fetch('/api/nurse_requests.php?type=ipd_patients', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setIpdCount(data.length); })
      .catch(() => { });
  }, []);

  // Filters for recent files table
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isEditFileOpen, setIsEditFileOpen] = useState(false);
  const [isDeleteFileOpen, setIsDeleteFileOpen] = useState(false);
  const [isRecordDeadOpen, setIsRecordDeadOpen] = useState(false);
  const [isViewSubfilesOpen, setIsViewSubfilesOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Get subfiles for family files
  const getSubfiles = (parentId: string) => {
    return patients.filter(p => p.parentFileId === parentId);
  };

  // Handle delete patient
  const handleDeletePatient = (reason: string) => {
    if (selectedPatient) {
      deletePatient(selectedPatient.id, reason);
      toast.success(`Patient file ${selectedPatient.fullName} deleted successfully`);
    }
  };

  // Handle record as deceased
  const handleRecordAsDeceased = (dateOfDeath: string, causeOfDeath: string, remarks: string) => {
    if (selectedPatient) {
      markPatientAsDeceased(selectedPatient.id, dateOfDeath, causeOfDeath, remarks);
      toast.success(`Patient ${selectedPatient.fullName} marked as deceased`);
    }
  };

  // Calculate KPIs
  const totalFiles = patients.length; // All patient files
  const inpatients = ipdCount; // From tbl_bed_admission where approved
  const outpatients = patients.filter(p => p.patientType === 'Outpatient').length;

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today).length;

  // Revenue calculations
  const paidInvoices = invoices.filter(i => i.paymentStatus === 'Paid');
  const pharmacyRevenue = paidInvoices
    .filter(i => i.invoiceType === 'Pharmacy')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const labRevenue = paidInvoices
    .filter(i => i.invoiceType === 'Laboratory')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const consultationRevenue = paidInvoices
    .filter(i => i.invoiceType === 'Consultation')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const admissionRevenue = paidInvoices
    .filter(i => i.invoiceType === 'Admission')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Fetch staff for counts
  const { staff } = useEMRStore();
  const doctorCount = staff.filter(s => s.role === 'Doctor').length;
  const nurseCount = staff.filter(s => s.role === 'Nurse').length;
  const labTechCount = staff.filter(s => s.role === 'Lab Technician').length;
  const adminCount = staff.filter(s => ['Receptionist', 'Accountant', 'Admin Officer', 'HR Manager', 'IT Support'].includes(s.role)).length;

  // Financial Summary
  const totalIncome = pharmacyRevenue + labRevenue + consultationRevenue + admissionRevenue;
  const totalExpenses = 0; // Set to 0 as there is no expenses API yet
  const netProfit = totalIncome - totalExpenses;

  // Revenue Chart Data
  const revenueData = [
    { name: 'Pharmacy', amount: pharmacyRevenue },
    { name: 'Laboratory', amount: labRevenue },
    { name: 'Consultation', amount: consultationRevenue },
    { name: 'Admission', amount: admissionRevenue },
  ];

  // Patient Distribution Pie Chart
  const patientDistribution = [
    { name: 'IPD', value: inpatients, color: '#1e40af' },
    { name: 'OPD', value: outpatients, color: '#059669' },
  ];

  // Filter patients for Recent Files table
  let filteredPatients = patients.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ||
      (categoryFilter === 'IPD' && p.patientType === 'Inpatient') ||
      (categoryFilter === 'OPD' && p.patientType === 'Outpatient');
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'Active': { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      'Admitted': { variant: 'default', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      'Discharged': { variant: 'secondary' },
      'Pending Payment': { variant: 'destructive', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
    };
    return variants[status] || { variant: 'default' };
  };

  const getCategoryBadge = (patientType: string) => {
    return patientType === 'Inpatient'
      ? { variant: 'default', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' }
      : { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100' };
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-semibold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Live hospital operations summary — Godiya Hospital</p>
      </motion.div>

      {/* KPI Cards - 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Files"
          value={totalFiles}
          subtitle="Every patient must have a file before treatment."
          icon={Folder}
          color="text-blue-600"
          bgColor="bg-blue-100"
          isAnimated={true}
        />
        <KPICard
          title="IPD Patients"
          value={inpatients}
          icon={Bed}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
          isAnimated={true}
        />
        <KPICard
          title="OPD Patients"
          value={outpatients}
          icon={Users}
          color="text-green-600"
          bgColor="bg-green-100"
          isAnimated={true}
        />
        <KPICard
          title="Appointments Today"
          value={todayAppointments}
          icon={Calendar}
          color="text-purple-600"
          bgColor="bg-purple-100"
          isAnimated={true}
        />
        <KPICard
          title="Pharmacy Revenue"
          value={`₦${pharmacyRevenue.toLocaleString()}`}
          icon={Pill}
          color="text-emerald-600"
          bgColor="bg-emerald-100"
        />
        <KPICard
          title="Laboratory Revenue"
          value={`₦${labRevenue.toLocaleString()}`}
          icon={FlaskConical}
          color="text-cyan-600"
          bgColor="bg-cyan-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview - Spans 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Income breakdown by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    formatter={(value: any) => `₦${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#059669" radius={[8, 8, 0, 0]} name="Revenue (₦)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Distribution - 1 column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Patient Distribution</CardTitle>
              <CardDescription>IPD vs OPD breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={patientDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {patientDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Financial Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                  <h3 className="text-2xl font-semibold text-green-600">₦{totalIncome.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                  <h3 className="text-2xl font-semibold text-red-600">₦{totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-xl bg-red-100">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                  <h3 className="text-2xl font-semibold text-blue-600">₦{netProfit.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Staff Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Staff Overview</CardTitle>
            <CardDescription>Hospital staff summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <UserCog className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold"><AnimatedCounter value={doctorCount} /></p>
                <p className="text-sm text-muted-foreground">Doctors</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold"><AnimatedCounter value={nurseCount} /></p>
                <p className="text-sm text-muted-foreground">Nurses</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <FlaskConical className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold"><AnimatedCounter value={labTechCount} /></p>
                <p className="text-sm text-muted-foreground">Lab Technicians</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <Building className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold"><AnimatedCounter value={adminCount} /></p>
                <p className="text-sm text-muted-foreground">Admin Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Patient Files Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Patient Files</CardTitle>
            <CardDescription>Latest patient records and file status</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or file number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="IPD">IPD</SelectItem>
                  <SelectItem value="OPD">OPD</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Admitted">Admitted</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                  <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">File No</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Patient Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date Opened</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((patient) => (
                    <motion.tr
                      key={patient.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      className="border-b border-border last:border-0 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium">{patient.id}</td>
                      <td className="py-3 px-4 text-sm">{patient.fullName}</td>
                      <td className="py-3 px-4">
                        <Badge {...getCategoryBadge(patient.patientType)}>
                          {patient.patientType === 'Inpatient' ? 'IPD' : 'OPD'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {patient.patientType === 'Inpatient' ? 'Inpatient Dept.' : 'Outpatient Dept.'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge {...getStatusBadge(patient.status)}>{patient.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(patient.dateRegistered), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/emr/dashboard/patients/${patient.id}/ipd-file`)}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            View File
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setIsEditFileOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!patient.isPaid && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setIsDeleteFileOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete File
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} files
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      size="sm"
                      variant={currentPage === page ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <EditPatientModal
        isOpen={isEditFileOpen}
        onClose={() => setIsEditFileOpen(false)}
        patient={selectedPatient}
      />
      <DeleteFileModal
        isOpen={isDeleteFileOpen}
        onClose={() => setIsDeleteFileOpen(false)}
        patient={selectedPatient}
        onDelete={handleDeletePatient}
      />
      <RecordAsDeadModal
        isOpen={isRecordDeadOpen}
        onClose={() => setIsRecordDeadOpen(false)}
        patient={selectedPatient}
        onRecordAsDeceased={handleRecordAsDeceased}
      />
      <ViewSubfilesModal
        isOpen={isViewSubfilesOpen}
        onClose={() => setIsViewSubfilesOpen(false)}
        familyFile={selectedPatient}
        subfiles={selectedPatient ? getSubfiles(selectedPatient.id) : []}
        onViewFile={(fileNo) => navigate(`/emr/dashboard/patients/${fileNo}`)}
      />
    </div>
  );
}