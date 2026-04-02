import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, Bell, Calendar, CalendarCheck, CheckCircle, CheckCircle2, Clock, FileText, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { toast } from 'sonner';
import { getCurrentUser } from '@/app/emr/utils/auth';

// Appointment Interface
interface Appointment {
  id: string;
  appointmentNo: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  appointmentDate: string;
  appointmentTime: string;
  type: 'OPD' | 'Follow-up' | 'Emergency' | 'Consultation';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  complaints: string;
  notes?: string;
}

// Enhanced KPI Card with click, tooltip, and animations
function KPICard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  tooltip,
  onClick,
  delay = 0
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  bgColor: string;
  tooltip: string;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -4 }}
          >
            <Card
              className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
              onClick={onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <motion.h3
                      className="text-3xl font-bold text-foreground"
                      key={value}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {value}
                    </motion.h3>
                  </div>
                  <div className={`p-3 rounded-xl ${bgColor}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center py-12"
    >
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
        <CalendarCheck className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">No Appointments Today</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        You have a clear schedule today. Enjoy your day or check upcoming appointments.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Activity className="w-4 h-4" />
        <span>System ready for new appointments</span>
      </div>
    </motion.div>
  );
}

export function DoctorDashboardHome() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Live state for appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/appointments.php?doctor=${currentUser.id}&status=processed&is_paid=1`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.map((apt: any) => ({
          id: apt.appointment_id,
          appointmentNo: apt.appointment_number,
          patientId: apt.appointment_fileid,
          patientName: apt.patient_name,
          age: apt.age || 0,
          gender: apt.gender,
          phone: apt.phone_number || '',
          appointmentDate: apt.appointment_date,
          appointmentTime: apt.appointment_shift || 'N/A',
          type: apt.appointment_priority === 'Emergency' ? 'Emergency' : 'OPD',
          status: apt.appointment_sta,
          complaints: apt.appointment_messege || '',
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Could not load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser?.id]);

  // Calculate live KPIs from appointments
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => apt.appointmentDate.startsWith(today));

    return {
      todaysAppointments: todayAppointments.length,
      confirmed: todayAppointments.filter(apt => apt.status === 'Scheduled').length,
      completed: todayAppointments.filter(apt => apt.status === 'Completed').length,
      inProgress: todayAppointments.filter(apt => apt.status === 'In Progress').length,
    };
  }, [appointments]);

  // Get today's appointments for display
  const todayAppointmentsList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointmentDate.startsWith(today));
  }, [appointments]);

  // Handle live updates
  useEffect(() => {
    const handleAppointmentUpdate = (event: CustomEvent) => {
      const { type, appointment } = event.detail;
      if (type === 'started' || type === 'completed') {
        fetchDashboardData();
        toast.info(type === 'started' ? 'Consultation Started' : 'Consultation Completed', {
          description: `Consultation with ${appointment.patientName} ${type === 'started' ? 'is now in progress' : 'has been completed'}`,
          icon: type === 'started' ? <Bell className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />,
        });
      }
    };

    window.addEventListener('appointmentUpdate' as any, handleAppointmentUpdate);
    return () => window.removeEventListener('appointmentUpdate' as any, handleAppointmentUpdate);
  }, []);

  // Navigation handlers with filters
  const handleNavigateToAppointments = (filter?: string) => {
    if (filter) {
      // Navigate with state to pre-filter the appointments page
      navigate('/emr/doctor/appointments', { state: { filter } });
    } else {
      navigate('/emr/doctor/appointments');
    }

    // Show info toast
    const filterText = filter === 'scheduled' ? 'Confirmed' :
      filter === 'completed' ? 'Completed' :
        filter === 'in-progress' ? 'In-Progress' : 'All';
    toast.info('Navigating to Appointments', {
      description: `Viewing ${filterText} appointments`,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Manage appointments, consultations, and patient care</p>
      </div>

      {/* KPI Cards - Live State with Clickable Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Today's Appointments"
          value={kpis.todaysAppointments}
          icon={Calendar}
          color="text-blue-600"
          bgColor="bg-blue-100"
          tooltip="Click to view all today's appointments"
          onClick={() => handleNavigateToAppointments()}
          delay={0.1}
        />
        <KPICard
          title="Confirmed Appointments"
          value={kpis.confirmed}
          icon={CalendarCheck}
          color="text-orange-600"
          bgColor="bg-orange-100"
          tooltip="Click to view confirmed/scheduled appointments"
          onClick={() => handleNavigateToAppointments('scheduled')}
          delay={0.2}
        />
        <KPICard
          title="Completed Appointments"
          value={kpis.completed}
          icon={CheckCircle2}
          color="text-green-600"
          bgColor="bg-green-100"
          tooltip="Click to view completed appointments"
          onClick={() => handleNavigateToAppointments('completed')}
          delay={0.3}
        />
        <KPICard
          title="In-Progress Appointments"
          value={kpis.inProgress}
          icon={Clock}
          color="text-purple-600"
          bgColor="bg-purple-100"
          tooltip="Click to view ongoing consultations"
          onClick={() => handleNavigateToAppointments('in-progress')}
          delay={0.4}
        />
      </div>

      {/* Today's Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Appointments
              {todayAppointmentsList.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {todayAppointmentsList.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointmentsList.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {todayAppointmentsList.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/emr/doctor/appointments')}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${appointment.status === 'Completed' ? 'bg-green-100' :
                        appointment.status === 'In Progress' ? 'bg-blue-100' :
                          appointment.status === 'Scheduled' ? 'bg-orange-100' :
                            'bg-gray-100'
                        }`}>
                        {appointment.status === 'Completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : appointment.status === 'In Progress' ? (
                          <Clock className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Users className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.type} • {appointment.patientId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="font-medium text-foreground">{appointment.appointmentTime}</p>
                        <p className="text-xs text-muted-foreground">{appointment.age}y, {appointment.gender}</p>
                      </div>
                      <Badge
                        variant={
                          appointment.status === 'Completed' ? 'default' :
                            appointment.status === 'In Progress' ? 'secondary' :
                              'outline'
                        }
                        className={
                          appointment.status === 'Completed' ? 'bg-secondary' :
                            appointment.status === 'In Progress' ? 'bg-blue-500/10 text-blue-700' :
                              ''
                        }
                      >
                        {appointment.status === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {appointment.status === 'In Progress' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {appointment.status === 'Scheduled' && <Clock className="w-3 h-3 mr-1" />}
                        {appointment.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Summary */}
      {todayAppointmentsList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-foreground">{kpis.todaysAppointments}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Today</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50">
                  <p className="text-2xl font-bold text-orange-600">{kpis.confirmed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Confirmed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">{kpis.inProgress}</p>
                  <p className="text-xs text-muted-foreground mt-1">In Progress</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{kpis.completed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
