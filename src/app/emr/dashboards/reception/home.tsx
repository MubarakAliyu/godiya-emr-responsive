import { useState, useMemo } from 'react';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { useNavigate } from 'react-router-dom';
import { AddPatientModal } from './components/add-patient-modal';
import { CreateAppointmentModal } from './components/create-appointment-modal';
import { RecordPaymentModal } from './components/record-payment-modal';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Clock, DollarSign, Eye, FileText, Search, TrendingUp, User, UserPlus, Users } from 'lucide-react';

// KPI Card Component with Click Handler
function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className={`hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
              {trend && trendValue && (
                <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-secondary' : 'text-destructive'}`}>
                  <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${color === 'primary' ? 'bg-primary/10' :
                color === 'secondary' ? 'bg-secondary/10' :
                  color === 'destructive' ? 'bg-destructive/10' :
                    'bg-blue-100'
              }`}>
              <Icon className={`w-6 h-6 ${color === 'primary' ? 'text-primary' :
                  color === 'secondary' ? 'text-secondary' :
                    color === 'destructive' ? 'text-destructive' :
                      'text-blue-600'
                }`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ReceptionDashboardHome() {
  const navigate = useNavigate();
  const { patients, appointments, invoices } = useEMRStore();

  // Modal states
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Calculate live KPI data
  const today = new Date().toISOString().split('T')[0];
  const newRegistrationsToday = patients.filter(p => p.dateRegistered === today).length;
  const upcomingAppointmentsCount = appointments.filter(a => a.status === 'Scheduled').length;
  const totalPatientsToday = patients.filter(p =>
    new Date(p.dateRegistered).toISOString().split('T')[0] === today
  ).length;

  // Get upcoming appointments (next 4)
  const upcomingAppointments = appointments
    .filter(a => a.status === 'Scheduled')
    .sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 4);

  // Filter patients for table
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const matchesSearch = searchTerm === '' ||
        patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFileType = fileTypeFilter === 'all' || patient.fileType === fileTypeFilter;

      return matchesSearch && matchesFileType;
    });
  }, [patients, searchTerm, fileTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  // Empty state check
  const hasPatients = patients.length > 0;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Reception Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="New Registrations Today"
          value={newRegistrationsToday}
          icon={UserPlus}
          trend="up"
          trendValue={`+${newRegistrationsToday} today`}
          color="primary"
          onClick={() => setIsAddPatientOpen(true)}
        />
        <KPICard
          title="Upcoming Appointments"
          value={upcomingAppointmentsCount}
          icon={Calendar}
          trend="up"
          trendValue="This week"
          color="primary"
        />
        <KPICard
          title="Total Patients Today"
          value={totalPatientsToday}
          icon={Users}
          color="secondary"
          onClick={() => navigate('/emr/reception/patients')}
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                className="h-auto py-6 flex-col gap-3 hover:bg-primary hover:text-white transition-all group"
                variant="outline"
                onClick={() => setIsAddPatientOpen(true)}
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-white/20">
                  <UserPlus className="w-6 h-6" />
                </div>
                <span className="font-medium">Add New Patient</span>
              </Button>
              <Button
                className="h-auto py-6 flex-col gap-3 hover:bg-primary hover:text-white transition-all group"
                variant="outline"
                onClick={() => setIsCreateAppointmentOpen(true)}
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-white/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="font-medium">Create Appointment</span>
              </Button>
              <Button
                className="h-auto py-6 flex-col gap-3 hover:bg-secondary hover:text-white transition-all group"
                variant="outline"
                onClick={() => setIsRecordPaymentOpen(true)}
              >
                <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-white/20">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="font-medium">Record Payment</span>
              </Button>
              <Button
                className="h-auto py-6 flex-col gap-3 hover:bg-primary hover:text-white transition-all group"
                variant="outline"
                onClick={() => navigate('/emr/reception/patients')}
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-white/20">
                  <Users className="w-6 h-6" />
                </div>
                <span className="font-medium">View All Patients</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid Layout for Recent Patients and Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Recent Patients
                </CardTitle>
                <Badge variant="secondary">{filteredPatients.length} Total</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or file number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="File Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {hasPatients ? (
                <>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">File No</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPatients.map((patient, index) => (
                          <motion.tr
                            key={patient.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-t border-border hover:bg-muted/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-mono text-primary">{patient.id}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {patient.firstName[0]}{patient.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{patient.fullName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs">
                                {patient.fileType}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={patient.status === 'Alive' ? 'default' : 'secondary'}
                                className={patient.status === 'Alive' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                              >
                                {patient.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() => navigate(`/emr/reception/patients/${patient.id}/ipd-file`)}
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Patients Yet</h3>
                  <p className="text-muted-foreground mb-4">Get started by adding your first patient</p>
                  <Button onClick={() => setIsAddPatientOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add New Patient
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Appointments Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {appointment.patientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{appointment.patientName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{appointment.doctorName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {appointment.time}
                            </Badge>
                            <Badge
                              variant="default"
                              className={`text-xs ${appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                  appointment.status === 'Confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                    'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                }`}
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Appointments</h3>
                  <p className="text-muted-foreground text-sm mb-4">Schedule your first appointment</p>
                  <Button size="sm" onClick={() => setIsCreateAppointmentOpen(true)}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
      />
      <CreateAppointmentModal
        isOpen={isCreateAppointmentOpen}
        onClose={() => setIsCreateAppointmentOpen(false)}
      />
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
      />
    </div>
  );
}