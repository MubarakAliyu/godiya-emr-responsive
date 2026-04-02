import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '@/app/emr/utils/auth';
import {
  ArrowLeft, User, Phone, MapPin, Calendar, Clock, Activity,
  Heart, Thermometer, Droplet, Wind, Scale, Ruler, FileText,
  Stethoscope, PlusCircle, Trash2, Save, CheckCircle, UserPlus,
  Send, AlertTriangle, History, Pill, TestTube, X, ChevronDown,
  ChevronUp, Edit, Lock, Unlock, CheckCircle2, Info, Bed
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { AdmitPatientModal } from './modals/admit-patient-modal';
import { ReferPatientModal } from './modals/refer-patient-modal';
import { SurgeryRequestModal } from './modals/surgery-request-modal';

// Interfaces
interface Vitals {
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  rbs: string;
  bmi: string;
  recordedBy?: string;
  recordedAt?: string;
}

interface ExaminationNotes {
  complaint: string;
  diagnosis: string;
  observations: string;
}

interface FollowUp {
  date: string;
  type: string;
  instructions: string;
}

interface Prescription {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface LabTest {
  id: string;
  testName: string;
  priority: string;
  notes: string;
}

interface HistoryRecord {
  date: string;
  diagnosis: string;
  prescription: string;
  doctor: string;
}

interface ConsultationAction {
  id: string;
  type: 'admitted' | 'referred' | 'surgery';
  timestamp: Date;
  details: any;
}

interface ConsultationState {
  hasUnsavedChanges: boolean;
  actions: ConsultationAction[];
  vitalsEditable: boolean;
}

// Finish Consultation Modal
function FinishConsultationModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-secondary" />
            Complete Consultation?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to complete this consultation? This will update the appointment status and can be edited later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            ✓ All consultation data will be saved<br />
            ✓ Prescription will be generated<br />
            ✓ Patient records will be updated<br />
            ✓ You can edit this consultation later if needed
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-secondary hover:bg-secondary/90">
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm & Complete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}



export function DoctorConsultationPage() {
  const navigate = useNavigate();
  // Route: /emr/doctor/patients/:patientId/consultation?appointmentId=xxx
  //    OR  /emr/doctor/consultation/:appointmentId
  const { patientId, appointmentId: apIdParam } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const appointmentIdFromQuery = searchParams.get('appointmentId');
  const appointmentId = apIdParam || appointmentIdFromQuery || '';
  const authData = getCurrentUser();
  const { patients, appointments, updateAppointment, addNotification, addActivityLog } = useEMRStore();

  // Find patient data from store
  const patient = patients.find(p => p.id === patientId);

  // State for fetched data
  const [patientData, setPatientData] = useState<any>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [clinicFindings, setClinicFindings] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);


  // State management
  const [activeTab, setActiveTab] = useState('all');



  const [examinationNotes, setExaminationNotes] = useState<ExaminationNotes>({
    complaint: '',
    diagnosis: '',
    observations: '',
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [followUp, setFollowUp] = useState<FollowUp>({
    date: '',
    type: '',
    instructions: '',
  });

  // New prescription form state
  const [newPrescription, setNewPrescription] = useState({
    drugName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });

  // New lab test form state
  const [newLabTest, setNewLabTest] = useState({
    testName: '',
    priority: 'Normal',
    notes: '',
  });

  const [consultationState, setConsultationState] = useState<ConsultationState>({
    hasUnsavedChanges: false,
    actions: [],
    vitalsEditable: false,
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tracks the DB id of the saved consultation (null = not yet saved)
  const [consultationId, setConsultationId] = useState<number | null>(null);

  // Pending refer/surgery/admission data collected from modals
  const [pendingReferral, setPendingReferral] = useState<any>(null);
  const [pendingSurgery, setPendingSurgery] = useState<any>(null);
  const [pendingAdmission, setPendingAdmission] = useState<any>(null);

  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isSurgeryModalOpen, setIsSurgeryModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!appointmentId) {
        if (patientId) {
          // Try to find latest appointment for this patient
          try {
            const apptRes = await fetch(`/api/appointments.php?appointment_fileid=${patientId}`, { credentials: 'include' });
            if (apptRes.ok) {
              const appts = await apptRes.json();
              if (Array.isArray(appts) && appts.length > 0) {
                // Sort by date/id if needed, assuming latest first from API
                const latestAppt = appts[0];
                navigate(`/emr/doctor/patients/${patientId}/consultation?appointmentId=${latestAppt.appointment_id}`, { replace: true });
                return;
              }
            }
          } catch (err) {
            console.error('Error auto-finding appointment:', err);
          }
        }
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      try {
        // 1. Fetch Appointment & Patient Data in one go from appointments.php
        const apptRes = await fetch(`/api/appointments.php?appointment_id=${appointmentId}`, {
          credentials: 'include',
        });
        if (apptRes.ok) {
          const appt = await apptRes.json();
          if (appt && !appt.error) {
            setAppointmentData({
              id: appt.appointment_id,
              appointmentNo: appt.appointment_number,
              date: appt.appointment_date,
              shift: appt.appointment_shift,
              priority: appt.appointment_priority,
              status: appt.appointment_sta,
              paymentStatus: appt.total_paid > 0 ? 'Paid' : 'Unpaid',
              doctorName: appt.appointment_doctor,
              department: appt.appointment_department,
            });

            // Set patient data from the appointment response
            setPatientData({
              fullName: appt.patient_name,
              fileNumber: appt.display_file_id,
              gender: appt.gender,
              dob: appt.dob, // Might need to be fetched separately if not in join
              phone: appt.appointment_alternate_address,
              address: '', // Might need to be fetched separately
            });

            // 2. Fetch Vitals using appointment_number
            const vitalsRes = await fetch(`/api/vitals.php?appointment_number=${appt.appointment_number}`, {
              credentials: 'include',
            });
            if (vitalsRes.ok) {
              const v = await vitalsRes.ok ? await vitalsRes.json() : null;
              if (v && !v.error) {
                setVitals({
                  temperature: String(v.vital_temperature || ''),
                  bloodPressure: String(v.vital_bloodpressure || ''),
                  heartRate: String(v.vital_heartrate || ''),
                  respiratoryRate: String(v.vital_respiratory || ''),
                  oxygenSaturation: String(v.vital_oxygen || ''),
                  weight: String(v.vital_weight || ''),
                  height: String(v.vital_height || ''),
                  rbs: String(v.vital_rbs || ''),
                  bmi: String(v.vital_bmi || ''),
                  recordedAt: v.date_time,
                });
              }
            }
          }
        }

        // 3. Fetch existing consultation
        const consultRes = await fetch(`/api/consultation.php?appointment_id=${appointmentId}`, {
          credentials: 'include',
        });
        if (consultRes.ok) {
          const json = await consultRes.json();
          if (json && !json.error) {
            setClinicFindings(json.clinicFindings);

            if (json.consultation) {
              const c = json.consultation;
              setConsultationId(c.id);
              setExaminationNotes({
                complaint: c.patient_complain || '',
                diagnosis: c.diagnosis || '',
                observations: c.observations || '',
              });
              setFollowUp({
                date: c.followup_date || '',
                type: c.followup_type || '',
                instructions: c.followup_instruction || '',
              });
              if (json.labTests?.length) {
                setLabTests(json.labTests.map((t: any, i: number) => ({
                  id: t.id || `lab-${i}`,
                  testName: String(t.testName || 'Unknown Test'),
                  priority: t.priority || 'Normal',
                  notes: t.notes || '',
                })));
              }
              if (json.prescriptions?.length) {
                setPrescriptions(json.prescriptions.map((p: any, i: number) => ({
                  id: p.row_id || `rx-${i}`,
                  drugName: String(p.drugName || ''),
                  dosage: String(p.dosage || ''),
                  frequency: String(p.frequency || ''),
                  duration: String(p.duration || ''),
                  instructions: String(p.instructions || ''),
                })));
              }

              // Load clinical requests
              if (json.referral) {
                setPendingReferral({
                  referto: json.referral.rs_referto,
                  remarks: json.referral.rs_remarks
                });
              }
              if (json.surgery) {
                setPendingSurgery({
                  name: json.surgery.sr_name,
                  remarks: json.surgery.sr_remarks
                });
              }
              if (json.admission) {
                setPendingAdmission({
                  remarks: json.admission.admit_remarks
                });
              }
            } else if (json.clinicFindings) {
              // Pre-populate complaint from nurse findings if it's a fresh consultation
              setExaminationNotes(prev => ({
                ...prev,
                complaint: json.clinicFindings.nurse_complaint || ''
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching consultation data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  // Mark unsaved whenever fields change
  useEffect(() => {
  }, [examinationNotes, prescriptions, labTests, followUp]);

  // Prescription handlers
  const addPrescription = () => {
    if (!newPrescription.drugName) {
      toast.error('Please enter drug name');
      return;
    }
    const prescription: Prescription = {
      ...newPrescription,
      id: `rx-${Date.now()}`,
    };
    setPrescriptions([...prescriptions, prescription]);
    setNewPrescription({
      drugName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
    toast.success('Drug added to prescription');
  };

  const deletePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
    toast.success('Drug removed from prescription');
  };

  // Lab test handlers
  const addLabTest = () => {
    if (!newLabTest.testName) {
      toast.error('Please enter test name');
      return;
    }
    const test: LabTest = {
      ...newLabTest,
      id: `lab-${Date.now()}`,
    };
    setLabTests([...labTests, test]);
    setNewLabTest({
      testName: '',
      priority: 'Normal',
      notes: '',
    });
    toast.success('Lab test added');
  };

  const deleteLabTest = (id: string) => {
    setLabTests(labTests.filter(t => t.id !== id));
    toast.success('Lab test removed');
  };

  // Build the payload used for both save and finish
  const buildPayload = (overrides: {
    referral?: any;
    surgery?: any;
    admission?: any;
  } = {}) => ({
    appointment_id: appointmentId,
    patient_id: patientId || '',
    doctor_id: authData?.id || '',
    patient_complain: examinationNotes.complaint,
    diagnosis: examinationNotes.diagnosis,
    observations: examinationNotes.observations,
    is_subfile: (patientId?.toLowerCase().startsWith('sf-')) ? 1 : 0,
    followup_date: followUp.date || null,
    followup_type: followUp.type,
    followup_instruction: followUp.instructions,
    labTests: labTests.map(t => t.testName),
    prescriptions: prescriptions,
    referral: overrides.referral || pendingReferral || undefined,
    surgery: overrides.surgery || pendingSurgery || undefined,
    admission: overrides.admission || pendingAdmission || undefined,
  });

  // Unified save handler
  const saveConsultation = async (
    isFinishing: boolean = false,
    overrides: {
      referral?: any;
      surgery?: any;
      admission?: any;
    } = {}
  ) => {
    setIsSaving(true);
    try {
      const payload = {
        ...buildPayload(overrides),
        finish: isFinishing,
      };

      // Always use POST, backend now handles upsert
      const res = await fetch('/api/consultation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save consultation');

      if (d.consultation_id) {
        setConsultationId(d.consultation_id);
      }

      setLastSaved(new Date());
      setConsultationState(prev => ({ ...prev, hasUnsavedChanges: false }));

      if (isFinishing) {
        toast.success('Consultation Completed', {
          description: 'Patient records updated and appointment marked as finished',
        });
        setTimeout(() => navigate('/emr/doctor/appointments'), 1200);
      } else {
        toast.success('Consultation data synced');
      }
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = () => saveConsultation(false);

  // Admit patient handler with full integration
  const handleAdmitPatient = async (data: {
    remarks: string;
  }) => {
    setPendingAdmission(data);

    // Auto-save first with direct data
    const saved = await saveConsultation(false, { admission: data });
    if (!saved) return;

    const action: ConsultationAction = {
      id: `action-${Date.now()}`,
      type: 'admitted',
      timestamp: new Date(),
      details: data,
    };

    setConsultationState(prev => ({
      ...prev,
      actions: [...prev.actions, action],
    }));

    // Add notification for nurse dashboard
    addNotification({
      id: `notif-admit-${Date.now()}`,
      type: 'info',
      category: 'clinical',
      icon: 'UserPlus',
      title: 'Patient Admission Request',
      description: `${patientData.fullName} - Admission Request`,
      message: `${data.remarks ? 'Remarks: ' + data.remarks : 'No additional remarks.'}`,
      module: 'Admissions',
      timestamp: new Date().toISOString(),
      unread: true,
      actionRequired: true,
    });

    // Add activity log
    addActivityLog({
      id: `log-admit-${Date.now()}`,
      action: `Admission request for ${patientData.fullName}`,
      module: 'Consultations',
      user: authData?.name || 'Doctor',
      timestamp: new Date().toISOString(),
      icon: 'UserPlus',
    });

    toast.success('Admission Request Submitted', {
      description: `Request sent to Nurse Dashboard for ${patientData.fullName}`,
    });
  };

  // Refer patient handler with full integration
  const handleReferPatient = async (data: {
    receivingHospital: string;
    remarks: string;
  }) => {
    const referralData = {
      referto: data.receivingHospital,
      remarks: data.remarks
    };
    setPendingReferral(referralData);

    // Auto-save first with direct data
    const saved = await saveConsultation(false, { referral: referralData });
    if (!saved) return;

    const action: ConsultationAction = {
      id: `action-${Date.now()}`,
      type: 'referred',
      timestamp: new Date(),
      details: data,
    };

    setConsultationState(prev => ({
      ...prev,
      actions: [...prev.actions, action],
    }));

    // Add notification for nurse dashboard
    addNotification({
      id: `notif-refer-${Date.now()}`,
      type: 'warning',
      category: 'clinical',
      icon: 'Send',
      title: `Referral Request`,
      description: `${patientData.fullName} → ${data.receivingHospital}`,
      message: `Remarks: ${data.remarks}`,
      module: 'Referrals',
      timestamp: new Date().toISOString(),
      unread: true,
      actionRequired: true,
    });

    // Add activity log
    addActivityLog({
      id: `log-refer-${Date.now()}`,
      action: `Referral request for ${patientData.fullName} to ${data.receivingHospital} - ${data.priority} Priority - Reason: ${data.reason}`,
      module: 'Consultations',
      user: authData?.name || 'Doctor',
      timestamp: new Date().toISOString(),
      icon: 'Send',
    });

    toast.success('Referral Request Submitted', {
      description: `Request sent to Nurse Dashboard for ${patientData.fullName} → ${data.receivingHospital}`,
    });
  };

  // Surgery request handler with full integration
  const handleSurgeryRequest = async (data: {
    surgeryType: string;
    remarks: string;
  }) => {
    const surgeryData = {
      name: data.surgeryType,
      remarks: data.remarks
    };
    setPendingSurgery(surgeryData);

    // Auto-save first with direct data
    const saved = await saveConsultation(false, { surgery: surgeryData });
    if (!saved) return;

    const action: ConsultationAction = {
      id: `action-${Date.now()}`,
      type: 'surgery',
      timestamp: new Date(),
      details: data,
    };

    setConsultationState(prev => ({
      ...prev,
      actions: [...prev.actions, action],
    }));

    // Add notification for nurse dashboard
    addNotification({
      id: `notif-surgery-${Date.now()}`,
      type: 'error',
      category: 'clinical',
      icon: 'Scissors',
      title: `Surgery Request`,
      description: `${patientData.fullName} needs ${data.surgeryType}`,
      message: `Remarks: ${data.remarks}`,
      module: 'Surgery',
      timestamp: new Date().toISOString(),
      unread: true,
      actionRequired: true,
    });

    // Add activity log
    addActivityLog({
      id: `log-surgery-${Date.now()}`,
      action: `Surgery request: ${data.surgeryType} (${data.urgencyLevel}) for ${patientData.fullName} - Duration: ${data.duration} - Staff: ${data.requiredStaff}`,
      module: 'Consultations',
      user: authData?.name || 'Doctor',
      timestamp: new Date().toISOString(),
      icon: 'AlertTriangle',
    });

    toast.success('Surgery Request Submitted', {
      description: `Request sent to Nurse Dashboard: ${data.surgeryType} (${data.urgencyLevel}) for ${patientData.fullName}`,
    });
  };

  const handleFinishConsultation = () => saveConsultation(true);

  if (isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading consultation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/emr/doctor/appointments')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Appointments
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                {appointmentData?.doctorName || authData?.name || 'Dr. Consultation'}
              </h1>
              {lastSaved && (
                <Badge variant="outline" className="text-xs">
                  <Save className="w-3 h-3 mr-1" />
                  {consultationState.hasUnsavedChanges ? 'Not saved' : 'All saved'}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{appointmentData?.department || 'Medical Department'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {appointmentData?.appointmentNo || appointmentId}
              {lastSaved && <span className="ml-3">Last saved: {lastSaved.toLocaleTimeString()}</span>}
            </p>
          </div>

          {/* Right Actions */}
          <div className="flex gap-2">
            {consultationState.hasUnsavedChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="border-primary text-primary hover:bg-primary/10 flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
            <Button
              onClick={() => setIsFinishModalOpen(true)}
              className="bg-secondary hover:bg-secondary/90 flex-1 sm:flex-none"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finish Consultation
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to full patient file in a new tab
                window.open(`/emr/doctor/patients/${patientId}`, '_blank');
              }}
              className="flex-1 sm:flex-none"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdmitModalOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Admit Patient
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReferModalOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Send className="w-4 h-4 mr-2" />
              Refer Patient
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSurgeryModalOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Request Surgery
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
          <TabsTrigger value="all">All Sections</TabsTrigger>
          <TabsTrigger value="patient">Patient Info</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="examination">Examination</TabsTrigger>
          <TabsTrigger value="prescription">Prescription</TabsTrigger>
          <TabsTrigger value="lab">Lab Tests</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
        </TabsList>

        {/* All Sections Tab */}
        <TabsContent value="all" className="space-y-6">
          {/* Patient & Appointment Information */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Patient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{patientData?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">File Number</p>
                  <p className="font-semibold">{patientData?.fileNumber || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-semibold">{patientData?.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">DOB</p>
                    <p className="font-semibold">
                      {patientData?.dob ? new Date(patientData.dob).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-semibold">{patientData?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Address
                  </p>
                  <p className="font-semibold text-sm">{patientData?.address || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Appointment No.</p>
                  <p className="font-semibold">{appointmentData.appointmentNo || appointmentData.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {new Date(appointmentData.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Shift</p>
                    <Badge variant="outline">{appointmentData.shift}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant={appointmentData.priority === 'Urgent' ? 'destructive' : 'secondary'}>
                      {appointmentData.priority}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={appointmentData.status === 'Completed' ? 'default' : 'secondary'}
                      className={appointmentData.status === 'In Progress' ? 'bg-yellow-500' : ''}
                    >
                      {appointmentData.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment</p>
                    <Badge variant={appointmentData.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                      {appointmentData.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Vital Signs
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Read-only (Nurse recorded)</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vitals?.recordedAt && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">
                    Last recorded on {new Date(vitals.recordedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {!vitals ? (
                <div className="py-8 text-center text-muted-foreground italic">
                  No vitals recorded for this appointment.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <Thermometer className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold">{vitals.temperature || '--'}</p>
                    <p className="text-xs text-muted-foreground">°C</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold">{vitals.bloodPressure || '--'}</p>
                    <p className="text-xs text-muted-foreground">mmHg</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{vitals.heartRate || '--'}</p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <Wind className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{vitals.respiratoryRate || '--'}</p>
                    <p className="text-xs text-muted-foreground">/min</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <Droplet className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{vitals.oxygenSaturation || '--'}</p>
                    <p className="text-xs text-muted-foreground">% SpO2</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <Scale className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{vitals.weight || '--'}</p>
                    <p className="text-xs text-muted-foreground">kg</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <Ruler className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{vitals.height || '--'}</p>
                    <p className="text-xs text-muted-foreground">cm</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <TestTube className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                    <p className="text-2xl font-bold">{vitals.rbs || '--'}</p>
                    <p className="text-xs text-muted-foreground">mg/dL (RBS)</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <Activity className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{vitals.bmi || '--'}</p>
                    <p className="text-xs text-muted-foreground">BMI</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinic/Nurse Findings */}
          {clinicFindings && (
            <Card className="border-secondary/20 bg-secondary/5">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2 text-secondary">
                  <Info className="w-4 h-4" />
                  Clinic/Nurse Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nurse's Complaint */}
                  <div className="space-y-2">
                    <Label className="text-secondary/70 flex items-center gap-1.5 uppercase text-[10px] font-bold tracking-wider">
                      <FileText className="w-3 h-3" />
                      Recorded Complaint (Nurse Desk)
                    </Label>
                    <div className="p-3 bg-background rounded-md border border-secondary/10 text-sm min-h-[60px]">
                      {clinicFindings.nurse_complaint || <span className="text-muted-foreground italic">No complaint recorded by nurse.</span>}
                    </div>
                  </div>

                  {/* Nurse-Prescribed Tests */}
                  <div className="space-y-2">
                    <Label className="text-secondary/70 flex items-center gap-1.5 uppercase text-[10px] font-bold tracking-wider">
                      <TestTube className="w-3 h-3" />
                      Tests Prescribed by Nurse
                    </Label>
                    <div className="p-3 bg-background rounded-md border border-secondary/10 flex flex-wrap gap-1.5 min-h-[60px]">
                      {clinicFindings.nurse_prescribed_tests && clinicFindings.nurse_prescribed_tests.length > 0 ? (
                        clinicFindings.nurse_prescribed_tests.map((test: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                            {typeof test === 'string' ? test : (test.test_name || test.name || test.item_name || 'Unknown Test')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No tests prescribed by nurse.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lab Result Summary if available */}
                {(clinicFindings.latest_lab_result || clinicFindings.latest_lab_result_picture) && (
                  <div className="pt-2 border-t border-secondary/10">
                    <Label className="text-secondary/70 flex items-center gap-1.5 uppercase text-[10px] font-bold tracking-wider mb-2">
                      <Activity className="w-3 h-3" />
                      Latest Lab Result {clinicFindings.latest_lab_result_date && `(${new Date(clinicFindings.latest_lab_result_date).toLocaleDateString()})`}
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clinicFindings.latest_lab_result && typeof clinicFindings.latest_lab_result === 'object' && (
                        <div className="bg-background p-3 rounded-md border border-secondary/10">
                          <ul className="text-sm space-y-1">
                            {Object.entries(clinicFindings.latest_lab_result).map(([name, value]: [string, any], idx) => (
                              <li key={idx} className="flex justify-between border-b border-border/50 pb-1 last:border-0 border-dashed">
                                <span className="text-muted-foreground">{name}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(() => {
                        let pictures: { name: string, url: string }[] = [];
                        try {
                          const picData = clinicFindings.latest_lab_result_picture;
                          const robustParse = (data: any): any => {
                            if (typeof data !== 'string') return data;
                            const trimmed = data.trim();
                            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                              try { return JSON.parse(trimmed); } catch (e) { return data; }
                            }
                            return data;
                          };
                          let parsed = robustParse(picData);
                          if (typeof parsed === 'object' && parsed !== null) {
                            pictures = Object.entries(parsed).map(([name, url]) => ({ name, url: String(url) }));
                          } else if (parsed) {
                            pictures = [{ name: 'Lab Result Attachment', url: String(parsed) }];
                          }
                        } catch (e) { pictures = []; }

                        return pictures.filter(p => p.url).map((pObj, idx) => {
                          const cleanPic = pObj.url.trim().replace(/\\/g, '');
                          const isDataUrl = cleanPic.startsWith('data:');
                          const isHttp = cleanPic.startsWith('http');
                          const finalUrl = isHttp || isDataUrl ? cleanPic : (cleanPic.startsWith('/') ? cleanPic : `/${cleanPic}`);

                          return (
                            <div key={idx} className="bg-background p-2 rounded-md border border-secondary/10 flex flex-col items-center justify-center gap-2">
                              <div className="w-full h-48 bg-muted rounded flex items-center justify-center overflow-hidden">
                                <img
                                  src={finalUrl}
                                  alt={pObj.name}
                                  className="max-h-full object-contain cursor-pointer transition-transform hover:scale-105"
                                  onClick={() => window.open(finalUrl, '_blank')}
                                  onError={(e: any) => {
                                    const img = e.target;
                                    if (!isDataUrl && !isHttp && finalUrl.startsWith('/')) {
                                      img.src = cleanPic;
                                    } else {
                                      img.style.display = 'none';
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between w-full px-1">
                                <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[150px]">{pObj.name}</span>
                                <a
                                  href={finalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-secondary hover:underline flex items-center gap-1 font-bold"
                                >
                                  View Full
                                </a>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Examination Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Examination Notes
                </div>
                <span className="text-xs text-muted-foreground">Auto-saves every 5s</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="complaint">Chief Complaint</Label>
                <Textarea
                  id="complaint"
                  placeholder="Enter patient's chief complaint..."
                  value={examinationNotes.complaint}
                  onChange={(e) =>
                    setExaminationNotes({ ...examinationNotes, complaint: e.target.value })
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Enter diagnosis..."
                  value={examinationNotes.diagnosis}
                  onChange={(e) =>
                    setExaminationNotes({ ...examinationNotes, diagnosis: e.target.value })
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="observations">Clinical Observations</Label>
                <Textarea
                  id="observations"
                  placeholder="Enter detailed clinical observations and examination findings..."
                  value={examinationNotes.observations}
                  onChange={(e) =>
                    setExaminationNotes({ ...examinationNotes, observations: e.target.value })
                  }
                  rows={5}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prescription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Prescriptions */}
              {prescriptions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {prescriptions.map((prescription) => (
                    <motion.div
                      key={prescription.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-muted/30 rounded-lg border border-border flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{String(prescription.drugName || '')}</p>
                        <p className="text-sm text-muted-foreground">
                          {String(prescription.dosage || '')} • {String(prescription.frequency || '')} • {String(prescription.duration || '')}
                        </p>
                        {prescription.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">{String(prescription.instructions || '')}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePrescription(prescription.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add New Prescription */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="drugName" className="text-xs">Drug Name</Label>
                  <Input
                    id="drugName"
                    placeholder="Enter medication name"
                    value={newPrescription.drugName}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, drugName: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dosage" className="text-xs">Dosage</Label>
                  <Input
                    id="dosage"
                    placeholder="e.g., 500mg"
                    value={newPrescription.dosage}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, dosage: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency" className="text-xs">Frequency</Label>
                  <Select
                    value={newPrescription.frequency}
                    onValueChange={(value) =>
                      setNewPrescription({ ...newPrescription, frequency: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration" className="text-xs">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 7 days"
                    value={newPrescription.duration}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, duration: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="instructions" className="text-xs">Instructions</Label>
                  <Input
                    id="instructions"
                    placeholder="e.g., After meals"
                    value={newPrescription.instructions}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, instructions: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={addPrescription} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Drug
              </Button>
            </CardContent>
          </Card>

          {/* Lab Test Request */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-primary" />
                Lab Test Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Lab Tests */}
              {labTests.length > 0 && (
                <div className="space-y-2 mb-4">
                  {labTests.map((test) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-muted/30 rounded-lg border border-border flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{String(test.testName || '')}</p>
                          <Badge variant={test.priority === 'Urgent' ? 'destructive' : 'secondary'}>
                            {String(test.priority || 'Normal')}
                          </Badge>
                        </div>
                        {test.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{String(test.notes || '')}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLabTest(test.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add New Lab Test */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="testName" className="text-xs">Test Name</Label>
                  <Input
                    id="testName"
                    placeholder="Enter lab test name"
                    value={newLabTest.testName}
                    onChange={(e) =>
                      setNewLabTest({ ...newLabTest, testName: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="priority" className="text-xs">Priority</Label>
                  <Select
                    value={newLabTest.priority}
                    onValueChange={(value) =>
                      setNewLabTest({ ...newLabTest, priority: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="STAT">STAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="labNotes" className="text-xs">Notes</Label>
                  <Input
                    id="labNotes"
                    placeholder="Additional notes or instructions..."
                    value={newLabTest.notes}
                    onChange={(e) =>
                      setNewLabTest({ ...newLabTest, notes: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={addLabTest} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Test
              </Button>
            </CardContent>
          </Card>

          {/* Follow-up Appointment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Follow-up Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="followupDate">Follow-up Date</Label>
                  <Input
                    id="followupDate"
                    type="date"
                    value={followUp.date}
                    onChange={(e) =>
                      setFollowUp({ ...followUp, date: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="followupType">Appointment Type</Label>
                  <Select
                    value={followUp.type}
                    onValueChange={(value) =>
                      setFollowUp({ ...followUp, type: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Check-up">Check-up</SelectItem>
                      <SelectItem value="Lab Review">Lab Review</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Specialist">Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="followupInstructions">Follow-up Instructions</Label>
                <Textarea
                  id="followupInstructions"
                  placeholder="Enter follow-up instructions for the patient..."
                  value={followUp.instructions}
                  onChange={(e) =>
                    setFollowUp({ ...followUp, instructions: e.target.value })
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Section Tabs */}
        <TabsContent value="patient">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Patient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{patientData.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">File Number</p>
                  <p className="font-semibold">{patientData.fileNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-semibold">{patientData.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">DOB</p>
                    <p className="font-semibold">
                      {new Date(patientData.dob).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-semibold">{patientData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Address
                  </p>
                  <p className="font-semibold text-sm">{patientData.address}</p>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Appointment No.</p>
                  <p className="font-semibold">{appointmentData.appointmentNo || appointmentData.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {new Date(appointmentData.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Shift</p>
                    <Badge variant="outline">{appointmentData.shift}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant={appointmentData.priority === 'Urgent' ? 'destructive' : 'secondary'}>
                      {appointmentData.priority}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={appointmentData.status === 'Completed' ? 'default' : 'secondary'}
                      className={appointmentData.status === 'In Progress' ? 'bg-yellow-500' : ''}
                    >
                      {appointmentData.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment</p>
                    <Badge variant={appointmentData.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                      {appointmentData.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Vital Signs
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Read-only (Nurse recorded)</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vitals.recordedBy && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">
                    Recorded by <span className="font-semibold">{vitals.recordedBy}</span> on{' '}
                    {new Date(vitals.recordedAt!).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <Thermometer className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{vitals.temperature}</p>
                  <p className="text-xs text-muted-foreground">°C</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{vitals.bloodPressure}</p>
                  <p className="text-xs text-muted-foreground">mmHg</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{vitals.heartRate}</p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <Wind className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{vitals.respiratoryRate}</p>
                  <p className="text-xs text-muted-foreground">/min</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <Droplet className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{vitals.oxygenSaturation}</p>
                  <p className="text-xs text-muted-foreground">%</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <Scale className="w-6 h-6 mx-auto mb-2 text-secondary" />
                  <p className="text-2xl font-bold">{vitals.weight}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <Ruler className="w-6 h-6 mx-auto mb-2 text-secondary" />
                  <p className="text-2xl font-bold">{vitals.height}</p>
                  <p className="text-xs text-muted-foreground">cm</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <TestTube className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">{vitals.rbs}</p>
                  <p className="text-xs text-muted-foreground">mg/dL</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{vitals.bmi}</p>
                  <p className="text-xs text-muted-foreground">BMI</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examination">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Examination Notes
                </div>
                <span className="text-xs text-muted-foreground">Auto-saves every 5s</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="complaint">Chief Complaint</Label>
                <Textarea
                  id="complaint"
                  placeholder="Enter patient's chief complaint..."
                  value={examinationNotes.complaint}
                  onChange={(e) =>
                    setExaminationNotes({ ...examinationNotes, complaint: e.target.value })
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Enter diagnosis..."
                  value={examinationNotes.diagnosis}
                  onChange={(e) =>
                    setExaminationNotes({ ...examinationNotes, diagnosis: e.target.value })
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="observations">Clinical Observations</Label>
                <Textarea
                  id="observations"
                  placeholder="Enter detailed clinical observations and examination findings..."
                  value={examinationNotes.observations}
                  onChange={(e) =>
                    setExaminationNotes({ ...examinationNotes, observations: e.target.value })
                  }
                  rows={5}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Prescriptions */}
              {prescriptions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {prescriptions.map((prescription) => (
                    <motion.div
                      key={prescription.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-muted/30 rounded-lg border border-border flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{String(prescription.drugName || '')}</p>
                        <p className="text-sm text-muted-foreground">
                          {String(prescription.dosage || '')} • {String(prescription.frequency || '')} • {String(prescription.duration || '')}
                        </p>
                        {prescription.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">{String(prescription.instructions || '')}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePrescription(prescription.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add New Prescription */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="drugName" className="text-xs">Drug Name</Label>
                  <Input
                    id="drugName"
                    placeholder="Enter medication name"
                    value={newPrescription.drugName}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, drugName: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dosage" className="text-xs">Dosage</Label>
                  <Input
                    id="dosage"
                    placeholder="e.g., 500mg"
                    value={newPrescription.dosage}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, dosage: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency" className="text-xs">Frequency</Label>
                  <Select
                    value={newPrescription.frequency}
                    onValueChange={(value) =>
                      setNewPrescription({ ...newPrescription, frequency: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration" className="text-xs">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 7 days"
                    value={newPrescription.duration}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, duration: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="instructions" className="text-xs">Instructions</Label>
                  <Input
                    id="instructions"
                    placeholder="e.g., After meals"
                    value={newPrescription.instructions}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, instructions: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={addPrescription} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Drug
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-primary" />
                Lab Test Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Lab Tests */}
              {labTests.length > 0 && (
                <div className="space-y-2 mb-4">
                  {labTests.map((test) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-muted/30 rounded-lg border border-border flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{String(test.testName || '')}</p>
                          <Badge variant={test.priority === 'Urgent' ? 'destructive' : 'secondary'}>
                            {String(test.priority || 'Normal')}
                          </Badge>
                        </div>
                        {test.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{String(test.notes || '')}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLabTest(test.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add New Lab Test */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="testName" className="text-xs">Test Name</Label>
                  <Input
                    id="testName"
                    placeholder="Enter lab test name"
                    value={newLabTest.testName}
                    onChange={(e) =>
                      setNewLabTest({ ...newLabTest, testName: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="priority" className="text-xs">Priority</Label>
                  <Select
                    value={newLabTest.priority}
                    onValueChange={(value) =>
                      setNewLabTest({ ...newLabTest, priority: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="STAT">STAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="labNotes" className="text-xs">Notes</Label>
                  <Input
                    id="labNotes"
                    placeholder="Additional notes or instructions..."
                    value={newLabTest.notes}
                    onChange={(e) =>
                      setNewLabTest({ ...newLabTest, notes: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={addLabTest} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Follow-up Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="followupDate">Follow-up Date</Label>
                  <Input
                    id="followupDate"
                    type="date"
                    value={followUp.date}
                    onChange={(e) =>
                      setFollowUp({ ...followUp, date: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="followupType">Appointment Type</Label>
                  <Select
                    value={followUp.type}
                    onValueChange={(value) =>
                      setFollowUp({ ...followUp, type: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Check-up">Check-up</SelectItem>
                      <SelectItem value="Lab Review">Lab Review</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Specialist">Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="followupInstructions">Follow-up Instructions</Label>
                <Textarea
                  id="followupInstructions"
                  placeholder="Enter follow-up instructions for the patient..."
                  value={followUp.instructions}
                  onChange={(e) =>
                    setFollowUp({ ...followUp, instructions: e.target.value })
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <FinishConsultationModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        onConfirm={handleFinishConsultation}
      />


      <AdmitPatientModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onConfirm={handleAdmitPatient}
        patientData={patientData}
      />

      <ReferPatientModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        onConfirm={handleReferPatient}
        patientData={patientData}
      />

      <SurgeryRequestModal
        isOpen={isSurgeryModalOpen}
        onClose={() => setIsSurgeryModalOpen(false)}
        onConfirm={handleSurgeryRequest}
        patientData={patientData}
      />
    </div>
  );
}
