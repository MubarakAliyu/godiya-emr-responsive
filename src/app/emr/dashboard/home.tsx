import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  Calendar,
  DollarSign,
  FlaskConical,
  UserCog,
  Activity,
  TrendingUp,
  Search,
  Folder,
  MoreVertical,
  Edit,
  Trash2,
  Skull
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
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
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { format } from 'date-fns';
import { Patient } from '@/app/emr/store/types';
import { EditPatientModal } from '@/app/emr/modules/patients/components/edit-patient-modal';
import { DeceasedModal } from '@/app/emr/modules/patients/components/deceased-modal';
import { DeletePatientModal } from '@/app/emr/modules/patients/components/delete-patient-modal';

// Helper function to safely format dates
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'N/A';
  }
};

// Helper function to get category from patientType
const getCategory = (patientType: string): string => {
  if (patientType === 'Inpatient') return 'IPD';
  if (patientType === 'Outpatient') return 'OPD';
  return patientType;
};

// Helper function to get department from appointment data
const getDepartment = (patient: Patient, appointments: any[]): string => {
  const patientAppointment = appointments.find(a => a.patientId === patient.id);
  return patientAppointment?.department || 'General';
};

export function DashboardHome() {
  const navigate = useNavigate();
  const { patients, appointments, invoices, staff } = useEMRStore();

  // Live IPD count from tbl_bed_admission (approved & not discharged)
  const [ipdCount, setIpdCount] = useState(0);
  useEffect(() => {
    fetch('/api/nurse_requests.php?type=ipd_patients', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setIpdCount(data.length); })
      .catch(() => { });
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deceasedModalOpen, setDeceasedModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Calculate KPIs
  const totalFiles = patients.length;
  const ipdPatients = ipdCount; // Live count from tbl_bed_admission where approved
  const opdPatients = patients.filter(p => p.patientType === 'Outpatient').length;

  const today = new Date().toISOString().split('T')[0];
  const appointmentsToday = appointments.filter(a => a.date === today).length;

  // Revenue calculations
  const pharmacyRevenue = invoices
    .filter(i => i.invoiceType === 'Pharmacy' && i.paymentStatus === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const laboratoryRevenue = invoices
    .filter(i => i.invoiceType === 'Laboratory' && i.paymentStatus === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const consultationRevenue = invoices
    .filter(i => i.invoiceType === 'Consultation' && i.paymentStatus === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const admissionRevenue = invoices
    .filter(i => i.invoiceType === 'Admission' && i.paymentStatus === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);

  // Staff calculations from live data
  const doctorCount = staff.filter(s => s.role === 'Doctor').length;
  const nurseCount = staff.filter(s => s.role === 'Nurse').length;
  const labTechCount = staff.filter(s => s.role === 'Lab Technician').length;
  const adminCount = staff.filter(s => ['Receptionist', 'Accountant', 'Admin Officer', 'HR Manager', 'IT Support'].includes(s.role)).length;

  const totalIncome = pharmacyRevenue + laboratoryRevenue + consultationRevenue + admissionRevenue;
  const totalExpenses = 0; // Set to 0 as there is no expenses API yet
  const netProfit = totalIncome - totalExpenses;

  // Revenue data for chart
  const revenueData = [
    { name: 'Pharmacy', revenue: pharmacyRevenue },
    { name: 'Laboratory', revenue: laboratoryRevenue },
    { name: 'Consultation', revenue: consultationRevenue },
    { name: 'Admission', revenue: admissionRevenue },
  ];

  // Patient distribution data for pie chart
  const patientDistData = [
    { name: 'IPD', value: ipdPatients, color: '#1e40af' },
    { name: 'OPD', value: opdPatients, color: '#059669' },
  ];

  // Staff data from store
  const staffSummaryData = [
    { icon: Activity, title: 'Doctors', count: doctorCount, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: Users, title: 'Nurses', count: nurseCount, color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: FlaskConical, title: 'Lab Technicians', count: labTechCount, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { icon: UserCog, title: 'Admin Staff', count: adminCount, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ];

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    const patientCategory = getCategory(patient.patientType);
    const matchesCategory = categoryFilter === 'all' || patientCategory === categoryFilter;
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  // Handle action menu clicks
  const handleEditClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditModalOpen(true);
  };

  const handleDeceasedClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeceasedModalOpen(true);
  };

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Live hospital operations summary — Godiya Hospital</p>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Total Files</p>
                  <h3 className="text-3xl font-bold mb-2">{totalFiles}</h3>
                  <p className="text-xs text-muted-foreground">Every patient must have a file before treatment.</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">IPD Patients</p>
                  <h3 className="text-3xl font-bold">{ipdPatients}</h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">OPD Patients</p>
                  <h3 className="text-3xl font-bold">{opdPatients}</h3>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Appointments Today</p>
                  <h3 className="text-3xl font-bold">{appointmentsToday}</h3>
                </div>
                <div className="p-3 rounded-xl bg-orange-100">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Pharmacy Revenue</p>
                  <h3 className="text-3xl font-bold">₦{pharmacyRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Laboratory Revenue</p>
                  <h3 className="text-3xl font-bold">₦{laboratoryRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-xl bg-cyan-100">
                  <FlaskConical className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-sm text-muted-foreground">Income breakdown by department</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Patient Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">IPD vs OPD breakdown</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={patientDistData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {patientDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Total Income</p>
                <h3 className="text-2xl font-bold text-green-900">₦{totalIncome.toLocaleString()}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 mb-1">Total Expenses</p>
                <h3 className="text-2xl font-bold text-orange-900">₦{totalExpenses.toLocaleString()}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600 rotate-180" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Net Profit</p>
                <h3 className="text-2xl font-bold text-blue-900">₦{netProfit.toLocaleString()}</h3>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Overview</CardTitle>
          <p className="text-sm text-muted-foreground">Hospital staff summary</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {staffSummaryData.map((staff, index) => {
              const Icon = staff.icon;
              return (
                <motion.div
                  key={staff.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className={`p-3 rounded-lg ${staff.bgColor}`}>
                    <Icon className={`w-6 h-6 ${staff.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{staff.count}</p>
                    <p className="text-sm text-muted-foreground">{staff.title}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Patient Files */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Patient Files</CardTitle>
          <p className="text-sm text-muted-foreground">Latest patient records and file status</p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or file number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="IPD">IPD</SelectItem>
                <SelectItem value="OPD">OPD</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Admitted">Admitted</SelectItem>
                <SelectItem value="Discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold">File No</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Patient Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Date Opened</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No patient files found
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((patient, index) => {
                    const category = getCategory(patient.patientType);
                    const department = getDepartment(patient, appointments);

                    return (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium">{patient.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{patient.fullName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={category === 'IPD' ? 'default' : 'secondary'}
                            className={category === 'IPD' ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : 'bg-green-100 text-green-700 hover:bg-green-100'}
                          >
                            {category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{department}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              patient.status === 'Active'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : patient.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                  : patient.status === 'Admitted'
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                            }
                          >
                            {patient.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{formatDate(patient.dateRegistered)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/emr/dashboard/patients/${patient.id}/ipd-file`)}
                              className="gap-2 hover:bg-blue-50"
                            >
                              <Folder className="w-4 h-4" />
                              View File
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(patient)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {!patient.isPaid && (
                                  <DropdownMenuItem onClick={() => handleDeleteClick(patient)} className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete File
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredPatients.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPatients.length)} of {filteredPatients.length} files
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals - Using the same exact components from the Patients module */}
      <EditPatientModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />

      <DeceasedModal
        isOpen={deceasedModalOpen}
        onClose={() => {
          setDeceasedModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />

      <DeletePatientModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
    </div>
  );
}
