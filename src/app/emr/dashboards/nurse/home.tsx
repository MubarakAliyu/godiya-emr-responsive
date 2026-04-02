import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, ArrowRight, Bed, Calendar, CheckCircle, CheckCircle2, Clock, Eye, FileText, Mail, MapPin, Minus, Phone, Stethoscope, Syringe, TrendingDown, TrendingUp, User, UserPlus, Users, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Separator } from '@/app/components/ui/separator';
import { Label } from '@/app/components/ui/label';

interface KPICardProps {
  title: string;
  value: number;
  icon: any;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  tooltip?: string;
}

function KPICard({ title, value, icon: Icon, color = 'primary', trend, trendValue, tooltip }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate number transition
  useEffect(() => {
    let startValue = 0;
    const duration = 1000; // 1 second
    const increment = value / (duration / 16); // 60fps

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(startValue));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4" style={{ borderLeftColor: color === 'primary' ? '#1e40af' : '#059669' }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-bold text-foreground">{displayValue}</h3>
                      {trend && trendValue && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()} mb-1`}>
                          {getTrendIcon()}
                          <span>{trendValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: color === 'primary' ? '#1e40af15' : '#05966915' }}>
                    <Icon className="w-6 h-6" style={{ color: color === 'primary' ? '#1e40af' : '#059669' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

interface RequestCardProps {
  title: string;
  count: number;
  icon: any;
  onClick: () => void;
  highlight?: boolean;
}

function RequestCard({ title, count, icon: Icon, onClick, highlight }: RequestCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${highlight && count > 0 ? 'border-orange-500 border-2 bg-orange-50/50' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${highlight && count > 0 ? 'bg-orange-500/10' : 'bg-primary/10'}`}>
                <Icon className={`w-6 h-6 ${highlight && count > 0 ? 'text-orange-600' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className={`text-2xl font-bold ${highlight && count > 0 ? 'text-orange-600' : 'text-foreground'}`}>
                    {count}
                  </h3>
                  {count > 0 && (
                    <Badge variant={highlight ? "destructive" : "secondary"}>
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Type definitions for requests
interface AdmissionRequest {
  id: number;
  fileId: string;
  patient: string;
  age: number;
  gender: string;
  phone: string;
  reason: string;
  diagnosis: string;
  priority: 'High' | 'Normal' | 'Critical';
  time: string;
  date: string;
  doctor: string;
  department: string;
  wardType: string;
  notes: string;
}

interface ReferralRequest {
  id: number;
  fileId: string;
  patient: string;
  age: number;
  gender: string;
  phone: string;
  referFrom: string;
  referTo: string;
  department: string;
  specialist: string;
  reason: string;
  diagnosis: string;
  priority: 'High' | 'Normal' | 'Critical';
  time: string;
  date: string;
  doctor: string;
  notes: string;
}

interface SurgeryRequest {
  id: number;
  fileId: string;
  patient: string;
  age: number;
  gender: string;
  phone: string;
  surgeryType: string;
  department: string;
  surgeon: string;
  anesthetist: string;
  priority: 'High' | 'Normal' | 'Critical';
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  diagnosis: string;
  preOpInstructions: string;
  time: string;
  date: string;
  doctor: string;
  notes: string;
}

export function NurseDashboardHome() {
  const { appointments, patients } = useEMRStore();
  const navigate = useNavigate();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // Modal states
  const [selectedAdmissionRequest, setSelectedAdmissionRequest] = useState<AdmissionRequest | null>(null);
  const [selectedReferralRequest, setSelectedReferralRequest] = useState<ReferralRequest | null>(null);
  const [selectedSurgeryRequest, setSelectedSurgeryRequest] = useState<SurgeryRequest | null>(null);

  const [admissionRequests, setAdmissionRequests] = useState<any[]>([]);
  const [referralRequests, setReferralRequests] = useState<any[]>([]);
  const [surgeryRequests, setSurgeryRequests] = useState<any[]>([]);
  const [liveIpdCount, setLiveIpdCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch Admissions
      const admRes = await fetch('/api/nurse_requests.php?type=admission&status=pending');
      const admData = await admRes.json();
      setAdmissionRequests(admData.map((item: any) => ({
        id: item.admit_id,
        fileId: item.patient_unique_id,
        patient: item.patient_name,
        age: calculateAge(item.dob),
        gender: item.gender,
        phone: item.phone_number,
        reason: item.admit_remarks,
        diagnosis: item.consultation_diagnosis || 'Pending',
        priority: 'Normal',
        time: item.admit_datetime.split(' ')[1],
        date: item.admit_datetime.split(' ')[0],
        doctor: item.doctor_name || 'Dr. Assigned',
        department: 'General',
        wardType: 'Pending Assignment',
        notes: item.consultation_observations || ''
      })));

      // Fetch Referrals
      const refRes = await fetch('/api/nurse_requests.php?type=referral&status=pending');
      const refData = await refRes.json();
      setReferralRequests(refData.map((item: any) => ({
        id: item.rs_id,
        fileId: item.patient_unique_id,
        patient: item.patient_name,
        age: calculateAge(item.dob),
        gender: item.gender,
        phone: item.phone_number,
        referFrom: 'Clinic',
        referTo: item.rs_referto,
        department: 'External',
        specialist: 'Pending',
        reason: item.rs_remarks,
        diagnosis: item.consultation_diagnosis || 'Pending',
        priority: 'Normal',
        time: item.rs_datetime.split(' ')[1],
        date: item.rs_datetime.split(' ')[0],
        doctor: 'Referring Doctor',
        notes: item.consultation_observations || ''
      })));

      // Fetch Surgeries
      const surgRes = await fetch('/api/nurse_requests.php?type=surgery&status=pending');
      const surgData = await surgRes.json();
      setSurgeryRequests(surgData.map((item: any) => ({
        id: item.sr_id,
        fileId: item.patient_unique_id,
        patient: item.patient_name,
        age: calculateAge(item.dob),
        gender: item.gender,
        phone: item.phone_number,
        surgeryType: item.sr_name,
        department: 'Surgical Dept',
        surgeon: 'TBD',
        anesthetist: 'TBD',
        priority: 'Normal',
        scheduledDate: 'TBD',
        scheduledTime: 'TBD',
        duration: 'TBD',
        diagnosis: item.consultation_diagnosis || 'Pending',
        preOpInstructions: '',
        time: item.sr_datetime.split(' ')[1],
        date: item.sr_datetime.split(' ')[0],
        doctor: 'Surgeon',
        notes: item.rs_remarks || ''
      })));

      // Fetch Live IPD Count
      const ipdRes = await fetch('/api/nurse_requests.php?type=ipd_patients', { credentials: 'include' });
      const ipdData = await ipdRes.json();
      if (Array.isArray(ipdData)) {
        setLiveIpdCount(ipdData.length);
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
  }, []);

  // Calculate KPIs from real data — only count paid appointments (nurse portal only sees paid)
  const pendingAppointments = appointments.filter(a => a.isPaid && a.status === 'Scheduled').length;
  const confirmedAppointments = appointments.filter(a => a.isPaid && a.status === 'In Progress').length;
  const completedAppointments = appointments.filter(a => a.isPaid && a.status === 'Completed').length;
  const ipdPatients = liveIpdCount; // From tbl_bed_admission where approved

  // Mock request data (in real app, these would come from store)

  const admissionRequestsCount = admissionRequests.length;
  const referRequestsCount = referralRequests.length;
  const surgeryRequestsCount = surgeryRequests.length;

  const totalRequests = admissionRequestsCount + referRequestsCount + surgeryRequestsCount;

  // Toast notifications for new requests
  useEffect(() => {
    if (totalRequests > lastNotificationCount && lastNotificationCount > 0) {
      toast.info('New Request Received', {
        description: 'You have new pending requests that require attention.',
      });
    }
    setLastNotificationCount(totalRequests);
  }, [totalRequests]);

  // Handle actions
  const handleAdmitPatient = (request: AdmissionRequest) => {
    toast.success('Patient Admitted', {
      description: `${request.patient} has been successfully admitted to ${request.wardType}`,
    });
    setSelectedAdmissionRequest(null);
  };

  const handleApproveReferral = (request: ReferralRequest) => {
    toast.success('Referral Approved', {
      description: `${request.patient} has been referred to ${request.department}`,
    });
    setSelectedReferralRequest(null);
  };

  const handleApproveSurgery = (request: SurgeryRequest) => {
    toast.success('Surgery Scheduled', {
      description: `${request.surgeryType} for ${request.patient} scheduled for ${request.scheduledDate}`,
    });
    setSelectedSurgeryRequest(null);
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Nurse Dashboard</h1>
        <p className="text-muted-foreground">Monitor vitals, admissions, and patient care activities</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Pending Appointments"
          value={pendingAppointments}
          icon={Clock}
          color="primary"
          trend="up"
          trendValue="+3"
          tooltip="Total appointments scheduled and waiting"
        />
        <KPICard
          title="Confirmed Appointments"
          value={confirmedAppointments}
          icon={Calendar}
          color="secondary"
          trend="neutral"
          trendValue="0"
          tooltip="Appointments currently in progress"
        />
        <KPICard
          title="Completed Appointments"
          value={completedAppointments}
          icon={CheckCircle2}
          color="secondary"
          trend="up"
          trendValue="+12"
          tooltip="Appointments completed today"
        />
        <KPICard
          title="Total IPD Patients"
          value={ipdPatients}
          icon={Users}
          color="primary"
          trend="down"
          trendValue="-2"
          tooltip="Currently admitted inpatients"
        />
      </div>

      {/* Requests Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Requests Summary</h2>
          {totalRequests > 0 && (
            <Badge variant="destructive" className="text-sm">
              {totalRequests} Pending
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RequestCard
            title="Admission Requests"
            count={admissionRequestsCount}
            icon={Bed}
            onClick={() => navigate('/emr/nurse/admissions')}
            highlight={true}
          />
          <RequestCard
            title="Refer Requests"
            count={referRequestsCount}
            icon={UserPlus}
            onClick={() => navigate('/emr/nurse/referrals')}
            highlight={true}
          />
          <RequestCard
            title="Surgery Requests"
            count={surgeryRequestsCount}
            icon={Syringe}
            onClick={() => navigate('/emr/nurse/surgeries')}
            highlight={true}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admission Requests Detail */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Bed className="w-5 h-5 text-primary" />
                Recent Admission Requests
              </CardTitle>
              <Badge variant="secondary">{admissionRequestsCount} Pending</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {admissionRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold text-foreground">{request.patient}</p>
                          <Badge variant={request.priority === 'High' ? 'destructive' : 'outline'} className="text-xs">
                            {request.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          File: {request.fileId} • {request.doctor} • {request.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('View button clicked for admission:', request);
                            setSelectedAdmissionRequest(request);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdmitPatient(request);
                          }}
                        >
                          Admit
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/emr/nurse/admissions')}>
                View All Admission Requests
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="p-4 rounded-lg border hover:bg-primary/5 hover:border-primary transition-all group"
                  onClick={() => navigate('/emr/nurse/appointments')}
                >
                  <Activity className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-center">View Appointments</p>
                </button>
                <button
                  className="p-4 rounded-lg border hover:bg-primary/5 hover:border-primary transition-all group"
                  onClick={() => navigate('/emr/nurse/patients')}
                >
                  <Users className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-center">Patient Management</p>
                </button>
                <button
                  className="p-4 rounded-lg border hover:bg-primary/5 hover:border-primary transition-all group"
                  onClick={() => toast.info('Admit Patient feature coming soon...')}
                >
                  <Bed className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-center">Admit Patient</p>
                </button>
                <button
                  className="p-4 rounded-lg border hover:bg-primary/5 hover:border-primary transition-all group"
                  onClick={() => toast.info('Surgery Request feature coming soon...')}
                >
                  <Syringe className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-center">Surgery Request</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Alert Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            {totalRequests > 0 && (
              <Card className="border-orange-500/50 bg-orange-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900">Pending Requests</p>
                      <p className="text-sm text-orange-700 mt-1">
                        You have {totalRequests} pending request{totalRequests > 1 ? 's' : ''} that require immediate attention.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Additional Request Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Requests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-secondary" />
                Recent Referral Requests
              </CardTitle>
              <Badge variant="secondary">{referRequestsCount} Pending</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referralRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-foreground">{request.patient}</p>
                        <Badge variant={request.priority === 'High' ? 'destructive' : 'outline'} className="text-xs">
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.referFrom} → {request.referTo} • {request.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('View button clicked for referral:', request);
                          setSelectedReferralRequest(request);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-secondary hover:bg-secondary/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveReferral(request);
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Surgery Requests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Syringe className="w-5 h-5 text-primary" />
                Recent Surgery Requests
              </CardTitle>
              <Badge variant="secondary">{surgeryRequestsCount} Pending</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {surgeryRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-foreground">{request.patient}</p>
                        <Badge variant={request.priority === 'High' ? 'destructive' : 'outline'} className="text-xs">
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.surgeryType}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.surgeon} • {request.scheduledDate} at {request.scheduledTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('View button clicked for surgery:', request);
                          setSelectedSurgeryRequest(request);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveSurgery(request);
                        }}
                      >
                        Schedule
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Admission Request Modal */}
      <Dialog
        open={selectedAdmissionRequest !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedAdmissionRequest(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bed className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Admission Request Details</DialogTitle>
                <DialogDescription>
                  Review patient information and admission request
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAdmissionRequest && (
            <div className="space-y-6 py-4">
              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <p className="font-semibold">{selectedAdmissionRequest.patient}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">File Number</Label>
                    <p className="font-mono font-semibold">{selectedAdmissionRequest.fileId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Age / Gender</Label>
                    <p className="font-semibold">{selectedAdmissionRequest.age} years • {selectedAdmissionRequest.gender}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{selectedAdmissionRequest.phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Admission Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Admission Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Request Date & Time</Label>
                      <p className="font-semibold">{selectedAdmissionRequest.date} at {selectedAdmissionRequest.time}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <div className="mt-1">
                        <Badge variant={selectedAdmissionRequest.priority === 'High' ? 'destructive' : 'outline'}>
                          {selectedAdmissionRequest.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Requesting Doctor</Label>
                      <p className="font-semibold">{selectedAdmissionRequest.doctor}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Department</Label>
                      <p className="font-semibold">{selectedAdmissionRequest.department}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Reason for Admission</Label>
                    <p className="font-semibold mt-1">{selectedAdmissionRequest.reason}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Diagnosis</Label>
                    <p className="font-semibold mt-1">{selectedAdmissionRequest.diagnosis}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Proposed Ward / Bed</Label>
                    <p className="font-semibold mt-1">{selectedAdmissionRequest.wardType}</p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-xs text-blue-900 font-semibold">Clinical Notes</Label>
                    <p className="text-sm text-blue-900 mt-2">{selectedAdmissionRequest.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAdmissionRequest(null)}>
              Close
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => selectedAdmissionRequest && handleAdmitPatient(selectedAdmissionRequest)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Admit Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral Request Modal */}
      <Dialog
        open={selectedReferralRequest !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedReferralRequest(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <UserPlus className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Referral Request Details</DialogTitle>
                <DialogDescription>
                  Review patient referral information
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedReferralRequest && (
            <div className="space-y-6 py-4">
              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-secondary" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <p className="font-semibold">{selectedReferralRequest.patient}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">File Number</Label>
                    <p className="font-mono font-semibold">{selectedReferralRequest.fileId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Age / Gender</Label>
                    <p className="font-semibold">{selectedReferralRequest.age} years • {selectedReferralRequest.gender}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{selectedReferralRequest.phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Referral Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  Referral Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Refer From</Label>
                      <p className="font-semibold">{selectedReferralRequest.referFrom}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Refer To</Label>
                      <p className="font-semibold text-secondary">{selectedReferralRequest.referTo}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Specialist</Label>
                      <p className="font-semibold">{selectedReferralRequest.specialist}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <div className="mt-1">
                        <Badge variant={selectedReferralRequest.priority === 'High' ? 'destructive' : 'outline'}>
                          {selectedReferralRequest.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Referring Doctor</Label>
                      <p className="font-semibold">{selectedReferralRequest.doctor}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Request Date & Time</Label>
                      <p className="font-semibold">{selectedReferralRequest.date} at {selectedReferralRequest.time}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Reason for Referral</Label>
                    <p className="font-semibold mt-1">{selectedReferralRequest.reason}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Clinical Diagnosis</Label>
                    <p className="font-semibold mt-1">{selectedReferralRequest.diagnosis}</p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Label className="text-xs text-green-900 font-semibold">Clinical Notes</Label>
                    <p className="text-sm text-green-900 mt-2">{selectedReferralRequest.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReferralRequest(null)}>
              Close
            </Button>
            <Button
              className="bg-secondary hover:bg-secondary/90"
              onClick={() => selectedReferralRequest && handleApproveReferral(selectedReferralRequest)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Surgery Request Modal */}
      <Dialog
        open={selectedSurgeryRequest !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedSurgeryRequest(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Syringe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Surgery Request Details</DialogTitle>
                <DialogDescription>
                  Review surgical procedure information
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedSurgeryRequest && (
            <div className="space-y-6 py-4">
              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <p className="font-semibold">{selectedSurgeryRequest.patient}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">File Number</Label>
                    <p className="font-mono font-semibold">{selectedSurgeryRequest.fileId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Age / Gender</Label>
                    <p className="font-semibold">{selectedSurgeryRequest.age} years • {selectedSurgeryRequest.gender}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{selectedSurgeryRequest.phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Surgery Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Surgery Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Surgery Type</Label>
                      <p className="font-semibold">{selectedSurgeryRequest.surgeryType}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Department</Label>
                      <p className="font-semibold">{selectedSurgeryRequest.department}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Surgeon</Label>
                      <p className="font-semibold">{selectedSurgeryRequest.surgeon}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Anesthetist</Label>
                      <p className="font-semibold">{selectedSurgeryRequest.anesthetist}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Scheduled Date</Label>
                      <p className="font-semibold">{selectedSurgeryRequest.scheduledDate}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Scheduled Time</Label>
                      <p className="font-semibold">{selectedSurgeryRequest.scheduledTime}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Duration</Label>
                      <p className="font-semibold">{selectedSurgeryRequest.duration}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <div className="mt-1">
                        <Badge variant={selectedSurgeryRequest.priority === 'High' ? 'destructive' : 'outline'}>
                          {selectedSurgeryRequest.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Diagnosis</Label>
                    <p className="font-semibold mt-1">{selectedSurgeryRequest.diagnosis}</p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <Label className="text-xs text-purple-900 font-semibold">Pre-Operative Instructions</Label>
                    <p className="text-sm text-purple-900 mt-2">{selectedSurgeryRequest.preOpInstructions}</p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-xs text-blue-900 font-semibold">Additional Notes</Label>
                    <p className="text-sm text-blue-900 mt-2">{selectedSurgeryRequest.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSurgeryRequest(null)}>
              Close
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => selectedSurgeryRequest && handleApproveSurgery(selectedSurgeryRequest)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm Surgery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}