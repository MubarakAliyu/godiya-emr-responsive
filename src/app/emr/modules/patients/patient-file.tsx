import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatientBasePath } from '@/app/emr/hooks/usePatientBasePath';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, User, Calendar, Phone, MapPin, Heart, Activity,
  Stethoscope, Pill, FlaskConical, DollarSign, Bed, FileText,
  ClipboardList, TrendingUp, Users, Syringe, Scissors, UserPlus,
  AlertTriangle, AlertCircle, CheckCircle, CheckCircle2, XCircle, Clock, Eye, Download,
  Edit, Trash2, Plus, X, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { format, differenceInYears } from 'date-fns';
import { toast } from 'sonner';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Appointment, Invoice, Patient, FamilySubfile } from '@/app/emr/store/types';

const formatDate = (dateString: string | undefined, formatStr: string = 'MMM dd, yyyy') => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
};
import {
  vipPatientId,
  vipPatientKPIs,
  vipVitalsData,
  vipConsultations,
  vipMedicalHistory,
  vipAdmissionsData,
  vipPrescriptionsData,
  vipNurseNotes,
  vipLabTests,
  vipFindings,
} from './vip-patient-data';

// KPI Mini Card Component
function KPIMiniCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{title}</p>
              <h3 className="text-2xl font-semibold">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// View Appointment Details Modal
function ViewAppointmentModal({ isOpen, onClose, appointment }: { isOpen: boolean; onClose: () => void; appointment: Appointment | null }) {
  if (!appointment) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Appointment Details</h2>
                    <p className="text-sm text-muted-foreground">ID: {appointment.id}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                    <p className="font-medium">{appointment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient ID</p>
                    <p className="font-medium">{appointment.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Appointment Type</p>
                    <Badge variant="outline">{appointment.appointmentType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge>{appointment.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Department</p>
                    <p className="font-medium">{appointment.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Doctor</p>
                    <p className="font-medium">{appointment.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="font-medium">{formatDate(appointment.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time</p>
                    <p className="font-medium">{appointment.time}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Priority</p>
                    <Badge variant={appointment.priority === 'Critical' ? 'destructive' : 'default'}>
                      {appointment.priority}
                    </Badge>
                  </div>
                  {appointment.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="font-medium">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// View Invoice Modal with PDF Download
function ViewInvoiceModal({ isOpen, onClose, invoice }: { isOpen: boolean; onClose: () => void; invoice: Invoice | null }) {
  if (!invoice) return null;

  const handleDownloadPDF = () => {
    // Create PDF content
    const pdfContent = `
GODIYA HOSPITAL
Birnin Kebbi, Kebbi State, Nigeria
-----------------------------------
OFFICIAL INVOICE

Invoice ID: ${invoice.id}
Receipt ID: ${invoice.receiptId}
Patient ID: ${invoice.patientId}
Date: ${formatDate(invoice.dateCreated, 'MMM dd, yyyy hh:mm a')}

-----------------------------------
PATIENT INFORMATION
-----------------------------------
Patient Name: ${invoice.patientName}
Patient ID: ${invoice.patientId}

-----------------------------------
INVOICE DETAILS
-----------------------------------
Invoice Type: ${invoice.invoiceType}
Amount: ₦${invoice.amount.toLocaleString()}
Payment Status: ${invoice.paymentStatus}

-----------------------------------
Thank you for choosing Godiya Hospital
For inquiries, call: 080-XXXX-XXXX
    `.trim();

    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Invoice downloaded successfully');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Invoice Details</h2>
                    <p className="text-sm text-muted-foreground">Receipt: {invoice.receiptId}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-green-900">GODIYA HOSPITAL</h3>
                    <p className="text-sm text-green-700">Birnin Kebbi, Kebbi State</p>
                  </div>
                  <div className="border-t-2 border-dashed border-green-300 my-4" />
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Invoice ID:</span>
                      <span className="font-semibold text-green-900">{invoice.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Receipt ID:</span>
                      <span className="font-semibold text-green-900">{invoice.receiptId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Date:</span>
                      <span className="font-semibold text-green-900">
                        {formatDate(invoice.dateCreated, 'MMM dd, yyyy hh:mm a')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                    <p className="font-medium">{invoice.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient ID</p>
                    <p className="font-medium">{invoice.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Invoice Type</p>
                    <Badge variant="outline">{invoice.invoiceType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                    <Badge
                      className={
                        invoice.paymentStatus === 'Paid'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : invoice.paymentStatus === 'Partial'
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                            : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200'
                      }
                    >
                      {invoice.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">₦{invoice.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleDownloadPDF} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// View Lab Test Modal
function ViewLabTestModal({ isOpen, onClose, labTest }: { isOpen: boolean; onClose: () => void; labTest: any }) {
  if (!labTest) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-orange-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FlaskConical className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Laboratory Test Details</h2>
                    <p className="text-sm text-muted-foreground">Test ID: {labTest.id}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Test Name</p>
                    <p className="text-xl font-semibold">{labTest.testName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Requested By</p>
                    <p className="font-medium">{labTest.requestedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="font-medium">{labTest.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={
                      labTest.status === 'Completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                    }>
                      {labTest.status}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Result</p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium">{labTest.result}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// View Medical Finding Modal
function ViewFindingModal({ isOpen, onClose, finding }: { isOpen: boolean; onClose: () => void; finding: any }) {
  if (!finding) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Medical Finding Details</h2>
                    <p className="text-sm text-muted-foreground">ID: {finding.id}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                    <Badge variant="outline">{finding.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="font-medium">{finding.date}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Finding</p>
                    <p className="text-lg font-semibold">{finding.finding}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Result</p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium">{finding.result}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Doctor</p>
                    <p className="font-medium">{finding.doctor}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function PatientFilePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const patientBasePath = usePatientBasePath();
  const { patients, subfiles, appointments, invoices, markPatientAsDeceased } = useEMRStore();

  // Modal states
  const [isDeceasedModalOpen, setIsDeceasedModalOpen] = useState(false);
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [deathRemarks, setDeathRemarks] = useState('');

  // View modals
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedLabTest, setSelectedLabTest] = useState<any>(null);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);

  // Normalize patientId to lowercase so URL params like SF-1 match correctly
  const normalizedPatientId = patientId?.toLowerCase();

  // Subfile logic
  const isSubfile = normalizedPatientId?.startsWith('sf-');
  const subfileId = isSubfile ? parseInt(normalizedPatientId!.replace('sf-', '')) : null;

  // Find patient or subfile — match against normalized ID and also the original (for GH-PT-xxxxx style IDs)
  const rawPatient = patients.find(
    p => p.id === patientId || p.id.toLowerCase() === normalizedPatientId
  );
  const rawSubfile = isSubfile ? subfiles.find(s => s.id === subfileId) : null;

  // Calculate age helper local to component if needed, or use store's logic
  // But store's calculateAge is not exported. I'll use differenceInYears from date-fns
  const calculateAge = (dob: string | undefined): number => {
    if (!dob) return 0;
    try {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return 0;
      return differenceInYears(new Date(), birthDate);
    } catch {
      return 0;
    }
  };

  // Normalize patient object for consistent UI
  const patient = useMemo(() => {
    if (isSubfile && rawSubfile) {
      return {
        id: `sf-${rawSubfile.id}`,
        dbId: rawSubfile.id,
        firstName: rawSubfile.firstName,
        lastName: rawSubfile.lastName,
        fullName: `${rawSubfile.firstName} ${rawSubfile.lastName}`,
        gender: rawSubfile.gender,
        dateOfBirth: rawSubfile.dateOfBirth || '',
        age: calculateAge(rawSubfile.dateOfBirth),
        phoneNumber: 'N/A', // Subfiles don't have their own phone yet
        address: 'See Parent File',
        fileType: 'Family (Member)' as any,
        patientType: 'Outpatient' as any, // Default for subfiles
        status: 'Active' as any,
        bloodGroup: rawSubfile.bloodGroup,
        allergies: rawSubfile.allergies,
        maritalStatus: rawSubfile.maritalStatus,
        isDead: rawSubfile.isDead,
        dateRegistered: rawSubfile.createdAt || new Date().toISOString(),
        // Relations
        parentFileId: rawSubfile.fileId,
        isSubfile: true,
      } as any; // Cast as any to avoid strict type mismatch with Patient interface for now
    }
    return rawPatient;
  }, [isSubfile, rawSubfile, rawPatient]);

  // Find parent patient if it's a subfile
  const parentPatient = useMemo(() => {
    if (isSubfile && patient?.parentFileId) {
      return patients.find(p => p.id === patient.parentFileId);
    }
    return null;
  }, [isSubfile, patient, patients]);

  // Get family members
  const getFamilyMembers = () => {
    if (!patient) return null;

    // If it's a subfile, return its parent and siblings
    if (isSubfile && parentPatient) {
      const siblings = subfiles.filter(s => s.fileId === parentPatient.id && s.id !== subfileId);
      return { familyFile: parentPatient, siblings };
    }

    // If this is a Family file, get all individual members
    if (patient.fileType === 'Family') {
      return subfiles.filter(s => s.fileId === patient.id);
    }

    // If this is an Individual with a parent file, get siblings and parent
    if (patient.parentFileId) {
      const familyFile = patients.find(p => p.id === patient.parentFileId);
      const siblings = subfiles.filter(s => s.fileId === patient.parentFileId && `SF-${s.id}` !== patient.id);
      return { familyFile, siblings };
    }

    return null;
  };

  const familyData = getFamilyMembers();

  if (!patient) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(patientBasePath)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Patient File Not Found</h2>
            <p className="text-muted-foreground">
              The patient file with ID {patientId} could not be found in the system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate patient KPIs
  const patientAppointments = appointments.filter(a => a.patientId === patient.id);
  const patientInvoices = invoices.filter(i => i.patientId === patient.id);
  const paidInvoices = patientInvoices.filter(i => i.paymentStatus === 'Paid');
  const totalPayments = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Mock data - will be replaced with real data from modules
  const mockPrescriptions = patient.id === 'GH-PT-00001' ? 8 : patient.id === vipPatientId ? vipPatientKPIs.prescriptions : 0;
  const mockAdmissions = patient.id === 'GH-PT-00001' ? 2 : patient.id === vipPatientId ? vipPatientKPIs.admissions : 0;
  const mockLabTestsCount = patient.id === 'GH-PT-00001' ? 12 : patient.id === vipPatientId ? vipPatientKPIs.labTestsCount : 0;
  const mockFindingsCount = patient.id === 'GH-PT-00001' ? 5 : patient.id === vipPatientId ? vipPatientKPIs.findingsCount : 0;
  const mockMedications = patient.id === 'GH-PT-00001' ? 15 : patient.id === vipPatientId ? vipPatientKPIs.medications : 0;
  const mockOperations = patient.id === 'GH-PT-00001' ? 1 : patient.id === vipPatientId ? vipPatientKPIs.operations : 0;
  const mockReferrals = patient.id === 'GH-PT-00001' ? 0 : patient.id === vipPatientId ? vipPatientKPIs.referrals : 0;
  const mockSurgeryRequests = patient.id === 'GH-PT-00001' ? 1 : patient.id === vipPatientId ? vipPatientKPIs.surgeryRequests : 0;

  // Mock data for tabs
  const mockVitalsData = patient.id === 'GH-PT-00001' ? [
    { date: '2025-01-15', temperature: 36.8, bp: '120/80', pulse: 72, weight: 68, height: 172, rbs: 95 },
    { date: '2025-01-20', temperature: 37.0, bp: '118/78', pulse: 75, weight: 68, height: 172, rbs: 92 },
    { date: '2025-01-25', temperature: 36.9, bp: '122/82', pulse: 70, weight: 67, height: 172, rbs: 98 },
    { date: '2025-01-30', temperature: 36.7, bp: '119/79', pulse: 73, weight: 67, height: 172, rbs: 94 },
  ] : patient.id === vipPatientId ? vipVitalsData : [];

  const mockConsultations = patient.id === 'GH-PT-00001' ? [
    {
      id: 1,
      date: '2025-01-30',
      doctor: 'Dr. Ibrahim Aliyu',
      department: 'General Medicine',
      diagnosis: 'Hypertension, Type 2 Diabetes',
      complaints: 'Persistent headaches, fatigue',
      observations: 'BP elevated, blood sugar within control',
    },
    {
      id: 2,
      date: '2025-01-20',
      doctor: 'Dr. Fatima Musa',
      department: 'Internal Medicine',
      diagnosis: 'Common Cold',
      complaints: 'Cough, sore throat',
      observations: 'Mild fever, no complications',
    },
  ] : patient.id === vipPatientId ? vipConsultations : [];

  const mockMedicalHistory = patient.id === 'GH-PT-00001' ? [
    { type: 'Chronic Disease', condition: 'Hypertension', diagnosedDate: '2020-05-12', status: 'Active' },
    { type: 'Chronic Disease', condition: 'Type 2 Diabetes', diagnosedDate: '2021-08-20', status: 'Active' },
    { type: 'Allergy', condition: 'Penicillin', severity: 'Severe', notes: 'Avoid all penicillin-based antibiotics' },
    { type: 'Surgery', condition: 'Appendectomy', date: '2015-03-10', hospital: 'Godiya Hospital' },
  ] : patient.id === vipPatientId ? vipMedicalHistory : [];

  const mockAdmissionsData = patient.id === 'GH-PT-00001' ? [
    {
      id: 1,
      ward: 'General Ward A',
      bed: 'A-12',
      dateAdmitted: '2024-12-15',
      dateDischarged: '2024-12-22',
      reason: 'Diabetic Ketoacidosis',
      status: 'Discharged',
    },
    {
      id: 2,
      ward: 'ICU',
      bed: 'ICU-3',
      dateAdmitted: '2023-06-10',
      dateDischarged: '2023-06-15',
      reason: 'Severe Hypertensive Crisis',
      status: 'Discharged',
    },
  ] : patient.id === vipPatientId ? vipAdmissionsData : [];

  const mockPrescriptionsData = patient.id === 'GH-PT-00001' ? [
    {
      id: 1,
      drug: 'Lisinopril 10mg',
      dosage: '1 tablet daily',
      duration: '30 days',
      doctor: 'Dr. Ibrahim Aliyu',
      date: '2025-01-30',
      status: 'Fulfilled',
    },
    {
      id: 2,
      drug: 'Metformin 500mg',
      dosage: '1 tablet twice daily',
      duration: '30 days',
      doctor: 'Dr. Ibrahim Aliyu',
      date: '2025-01-30',
      status: 'Fulfilled',
    },
    {
      id: 3,
      drug: 'Paracetamol 500mg',
      dosage: '2 tablets as needed',
      duration: '7 days',
      doctor: 'Dr. Fatima Musa',
      date: '2025-01-20',
      status: 'Fulfilled',
    },
  ] : patient.id === vipPatientId ? vipPrescriptionsData : [];

  const mockNurseNotes = patient.id === 'GH-PT-00001' ? [
    {
      id: 1,
      date: '2025-01-30 14:30',
      nurse: 'Nurse Aisha Mohammed',
      shift: 'Day Shift',
      notes: 'Patient vitals stable. Blood pressure 120/80. Medications administered as prescribed.',
      observations: 'Patient is responsive and comfortable.',
    },
    {
      id: 2,
      date: '2025-01-29 22:15',
      nurse: 'Nurse Hauwa Bello',
      shift: 'Night Shift',
      notes: 'Patient resting well. No complaints reported. IV fluids running smoothly.',
      observations: 'Stable vital signs throughout the night.',
    },
  ] : patient.id === vipPatientId ? vipNurseNotes : [];

  const mockLabTests = patient.id === 'GH-PT-00001' ? [
    {
      id: 1,
      testName: 'Fasting Blood Sugar',
      requestedBy: 'Dr. Ibrahim Aliyu',
      date: '2025-01-30',
      status: 'Completed',
      result: '95 mg/dL (Normal)',
    },
    {
      id: 2,
      testName: 'Complete Blood Count',
      requestedBy: 'Dr. Ibrahim Aliyu',
      date: '2025-01-30',
      status: 'Completed',
      result: 'All parameters within normal range',
    },
    {
      id: 3,
      testName: 'Lipid Profile',
      requestedBy: 'Dr. Ibrahim Aliyu',
      date: '2025-01-28',
      status: 'Pending',
      result: '-',
    },
  ] : patient.id === vipPatientId ? vipLabTests : [];

  const mockFindings = patient.id === 'GH-PT-00001' ? [
    {
      id: 1,
      type: 'Laboratory',
      finding: 'Fasting Blood Sugar',
      result: '95 mg/dL - Within normal range',
      date: '2025-01-30',
      doctor: 'Dr. Ibrahim Aliyu',
    },
    {
      id: 2,
      type: 'Imaging',
      finding: 'Chest X-Ray',
      result: 'No abnormalities detected',
      date: '2025-01-25',
      doctor: 'Dr. Fatima Musa',
    },
  ] : patient.id === vipPatientId ? vipFindings : [];

  const handleMarkAsDeceased = () => {
    if (!dateOfDeath || !causeOfDeath) {
      toast.error('Please fill in all required fields');
      return;
    }

    markPatientAsDeceased(patient.id, dateOfDeath, causeOfDeath, deathRemarks);
    toast.success('Patient marked as deceased');
    setIsDeceasedModalOpen(false);

    // Clear form
    setDateOfDeath('');
    setCauseOfDeath('');
    setDeathRemarks('');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button variant="ghost" onClick={() => navigate('/emr/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left Section - Patient Info */}
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20 border-4 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <h1 className="text-2xl font-semibold">{patient.fullName}</h1>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">File No: {patient.id}</p>
                      {patient.isSubfile && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                          Family Member
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {patient.gender}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {patient.age} years
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {patient.phoneNumber}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={patient.patientType === 'Inpatient' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-green-100 text-green-700 hover:bg-green-100'}>
                      {patient.patientType === 'Inpatient' ? 'IPD' : 'OPD'}
                    </Badge>
                    <Badge className={patient.fileType.includes('Family') ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1' : 'bg-slate-100 text-slate-700 hover:bg-slate-100 flex items-center gap-1'}>
                      {patient.fileType.includes('Family') ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {patient.fileType} File
                    </Badge>
                    {patient.status === 'Admitted' && (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">ICU</Badge>
                    )}
                    {patient.status === 'Discharged' && (
                      <Badge variant="secondary">Discharged</Badge>
                    )}
                    {patient.isNHIS && (
                      <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        NHIS
                      </Badge>
                    )}
                    {patient.isDead ? (
                      <Badge variant="destructive" className="bg-black text-white hover:bg-black cursor-pointer" onClick={() => toast.info('Patient is deceased')}>
                        Deceased ✗
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 cursor-pointer" onClick={() => toast.info('Patient is alive')}>
                        Alive ✓
                      </Badge>
                    )}
                    {patient.isPaid ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        File Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        File Unpaid
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Section - Parent Relation (Only for Subfiles) */}
              {patient.isSubfile && parentPatient && (
                <div
                  className="flex-1 max-w-xs p-3 rounded-lg bg-purple-50 border border-purple-100 hover:border-purple-200 transition-colors cursor-pointer group"
                  onClick={() => navigate(`${patientBasePath}/${parentPatient.id}`)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Parent Family File</p>
                    <ArrowLeft className="w-3 h-3 text-purple-400 group-hover:-translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm font-semibold text-purple-900 truncate">{parentPatient.fullName}</p>
                  <p className="text-xs text-purple-600">{parentPatient.id}</p>
                </div>
              )}

              {/* Right Section - Registration & Actions */}
              <div className="flex flex-col items-start lg:items-end gap-3">
                <div className="text-left lg:text-right text-sm">
                  <p className="text-muted-foreground">Registration Date</p>
                  <p className="font-medium">{formatDate(patient.dateRegistered)}</p>
                  <p className="font-medium">{formatDate(patient.dateRegistered, 'hh:mm a')}</p>
                </div>
                {!patient.isDead && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeceasedModalOpen(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Mark as Deceased
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Mini Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPIMiniCard
          title="Appointments"
          value={patientAppointments.length}
          icon={Calendar}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <KPIMiniCard
          title="Prescriptions"
          value={mockPrescriptions}
          icon={Pill}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <KPIMiniCard
          title="Payments"
          value={`₦${totalPayments.toLocaleString()}`}
          icon={DollarSign}
          color="text-emerald-600"
          bgColor="bg-emerald-100"
        />
        <KPIMiniCard
          title="Admissions"
          value={mockAdmissions}
          icon={Bed}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <KPIMiniCard
          title="Lab Tests"
          value={mockLabTestsCount}
          icon={FlaskConical}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* KPI Mini Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPIMiniCard
          title="Findings"
          value={mockFindingsCount}
          icon={FileText}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <KPIMiniCard
          title="Medications"
          value={mockMedications}
          icon={Syringe}
          color="text-pink-600"
          bgColor="bg-pink-100"
        />
        <KPIMiniCard
          title="Operations"
          value={mockOperations}
          icon={Scissors}
          color="text-red-600"
          bgColor="bg-red-100"
        />
        <KPIMiniCard
          title="Refer Requests"
          value={mockReferrals}
          icon={UserPlus}
          color="text-teal-600"
          bgColor="bg-teal-100"
        />
        <KPIMiniCard
          title="Surgery Requests"
          value={mockSurgeryRequests}
          icon={Activity}
          color="text-cyan-600"
          bgColor="bg-cyan-100"
        />
      </div>

      {/* Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex flex-nowrap w-full md:w-auto h-auto p-1 gap-1">
              <TabsTrigger value="overview" className="whitespace-nowrap px-4 py-2">Overview</TabsTrigger>
              <TabsTrigger value="appointments" className="whitespace-nowrap px-4 py-2">Appointments</TabsTrigger>
              <TabsTrigger value="consultations" className="whitespace-nowrap px-4 py-2">Consultations</TabsTrigger>
              <TabsTrigger value="history" className="whitespace-nowrap px-4 py-2">Medical History</TabsTrigger>
              <TabsTrigger value="admissions" className="whitespace-nowrap px-4 py-2">Admissions</TabsTrigger>
              <TabsTrigger value="vitals" className="whitespace-nowrap px-4 py-2">Vitals</TabsTrigger>
              <TabsTrigger value="prescriptions" className="whitespace-nowrap px-4 py-2">Prescriptions</TabsTrigger>
              <TabsTrigger value="invoices" className="whitespace-nowrap px-4 py-2">Invoices</TabsTrigger>
              <TabsTrigger value="nurse-notes" className="whitespace-nowrap px-4 py-2">Nurse Notes</TabsTrigger>
              <TabsTrigger value="lab-tests" className="whitespace-nowrap px-4 py-2">Lab Tests</TabsTrigger>
              <TabsTrigger value="findings" className="whitespace-nowrap px-4 py-2">Findings</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Full Name</p>
                      <p className="font-medium">{patient.fullName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium">{patient.gender}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{formatDate(patient.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Age</p>
                      <p className="font-medium">{patient.age} years</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{patient.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{patient.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium">{patient.emergencyContactName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Emergency Phone</p>
                      <p className="font-medium">{patient.emergencyContactPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Next of Kin</p>
                      <p className="font-medium">{patient.nextOfKin}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Information */}
              <Card>
                <CardHeader>
                  <CardTitle>File Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">File Type</p>
                      <p className="font-medium">{patient.fileType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Patient Type</p>
                      <p className="font-medium">{patient.patientType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{patient.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date Registered</p>
                      <p className="font-medium">{formatDate(patient.dateRegistered)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NHIS Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-600" />
                    NHIS Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.isNHIS ? (
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <CheckCircle className="w-5 h-5 text-cyan-600" />
                        <span className="font-semibold text-cyan-900">NHIS Enrolled</span>
                      </div>
                      <div>
                        <p className="text-muted-foreground">NHIS Number</p>
                        <p className="font-medium text-cyan-900">{patient.nhisNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">HMO Provider</p>
                        <p className="font-medium text-cyan-900">{patient.nhisProvider}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-900">
                          <strong>Note:</strong> This patient is eligible for NHIS benefits. Charges will be waived automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Not enrolled in NHIS</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Family File Information */}
              {familyData && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Family File Information
                    </CardTitle>
                    <CardDescription>
                      {patient.fileType === 'Family'
                        ? 'This is a family file with multiple members'
                        : 'This patient is part of a family file'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patient.fileType === 'Family' ? (
                      // Show family members for Family file type
                      <>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            Family File: {patient.fullName}
                          </p>
                          <p className="text-xs text-blue-700">
                            File ID: {patient.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-3">Family Members ({Array.isArray(familyData) ? familyData.length : 0}):</p>
                          <div className="space-y-2">
                            {Array.isArray(familyData) && familyData.map((member) => (
                              <motion.div
                                key={member.id}
                                whileHover={{ scale: 1.02, x: 4 }}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all cursor-pointer"
                                onClick={() => navigate(`${patientBasePath}/sf-${member.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 border-2 border-primary/20">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                      {member.firstName[0]}{member.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{member.firstName} {member.lastName}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{member.gender}</span>
                                      <span>•</span>
                                      <span>{calculateAge(member.dateOfBirth)} years</span>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs">
                                        {member.patientType === 'Inpatient' ? 'IPD' : 'OPD'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {member.id}
                                  </Badge>
                                  <Eye className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      // Show family file and siblings for Individual file type
                      <>
                        {familyData && typeof familyData === 'object' && 'familyFile' in familyData && familyData.familyFile && (
                          <div>
                            <p className="text-sm font-medium mb-2">Parent Family File:</p>
                            <motion.div
                              whileHover={{ scale: 1.02, x: 4 }}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-all cursor-pointer"
                              onClick={() => navigate(`${patientBasePath}/${familyData.familyFile.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-blue-900">{familyData.familyFile.fullName}</p>
                                  <p className="text-xs text-blue-700">Family File ID: {familyData.familyFile.id}</p>
                                </div>
                              </div>
                              <Eye className="w-5 h-5 text-blue-600" />
                            </motion.div>
                          </div>
                        )}
                        {familyData && typeof familyData === 'object' && 'siblings' in familyData && familyData.siblings && familyData.siblings.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-3">Other Family Members ({familyData.siblings.length}):</p>
                            <div className="space-y-2">
                              {familyData.siblings.map((member) => (
                                <motion.div
                                  key={member.id}
                                  whileHover={{ scale: 1.02, x: 4 }}
                                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all cursor-pointer"
                                  onClick={() => navigate(`${patientBasePath}/sf-${member.id}`)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                        {member.firstName[0]}{member.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{member.gender}</span>
                                        <span>•</span>
                                        <span>{calculateAge(member.dateOfBirth)} years</span>
                                        <span>•</span>
                                        <Badge variant="outline" className="text-xs">
                                          {member.patientType === 'Inpatient' ? 'IPD' : 'OPD'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {member.id}
                                    </Badge>
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Life Status */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Life Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.isDead ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="destructive"
                          className="bg-black text-white hover:bg-black text-lg px-4 py-2 cursor-pointer"
                          onClick={() => toast.info('Patient marked as deceased on ' + formatDate(patient.dateOfDeath))}
                        >
                          Deceased ✗
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {patient.dateOfDeath && (
                          <div>
                            <p className="text-muted-foreground">Date of Death</p>
                            <p className="font-medium">{formatDate(patient.dateOfDeath)}</p>
                          </div>
                        )}
                        {patient.causeOfDeath && (
                          <div>
                            <p className="text-muted-foreground">Cause of Death</p>
                            <p className="font-medium">{patient.causeOfDeath}</p>
                          </div>
                        )}
                        {patient.deathRemarks && (
                          <div className="md:col-span-3">
                            <p className="text-muted-foreground">Remarks</p>
                            <p className="font-medium">{patient.deathRemarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-600 cursor-pointer" onClick={() => toast.success('Patient is alive and active')}>
                        Alive ✓
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Payment Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Invoices</p>
                      <p className="text-2xl font-semibold">{patientInvoices.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Paid Invoices</p>
                      <p className="text-2xl font-semibold text-green-600">{paidInvoices.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Payments</p>
                      <p className="text-2xl font-semibold text-emerald-600">₦{totalPayments.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: Appointments */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointment History</CardTitle>
                <CardDescription>All appointments for this patient</CardDescription>
              </CardHeader>
              <CardContent>
                {patientAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No appointments yet</p>
                    <p className="text-sm text-muted-foreground">This patient has no appointment records.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Department</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Doctor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Priority</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientAppointments.map((appointment) => (
                          <tr key={appointment.id} className="border-b border-border last:border-0">
                            <td className="py-3 px-4 text-sm">{formatDate(appointment.date)}</td>
                            <td className="py-3 px-4 text-sm">{appointment.time}</td>
                            <td className="py-3 px-4 text-sm">{appointment.department}</td>
                            <td className="py-3 px-4 text-sm">{appointment.doctorName}</td>
                            <td className="py-3 px-4 text-sm">{appointment.appointmentType}</td>
                            <td className="py-3 px-4">
                              <Badge variant={appointment.priority === 'Critical' ? 'destructive' : 'default'}>
                                {appointment.priority}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge>{appointment.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAppointment(appointment)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Consultations */}
          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <CardTitle>Consultation History</CardTitle>
                <CardDescription>All doctor consultations for this patient</CardDescription>
              </CardHeader>
              <CardContent>
                {mockConsultations.length === 0 ? (
                  <div className="text-center py-12">
                    <Stethoscope className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No consultations yet</p>
                    <p className="text-sm text-muted-foreground">This patient has no consultation records.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockConsultations.map((consultation) => (
                      <div key={consultation.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{consultation.doctor}</p>
                            <p className="text-sm text-muted-foreground">{consultation.department}</p>
                          </div>
                          <Badge variant="outline">{consultation.date}</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Complaints:</p>
                            <p className="font-medium">{consultation.complaints}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Diagnosis:</p>
                            <p className="font-medium">{consultation.diagnosis}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Observations:</p>
                            <p className="font-medium">{consultation.observations}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Medical History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>Patient's complete medical history</CardDescription>
              </CardHeader>
              <CardContent>
                {mockMedicalHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No medical history</p>
                    <p className="text-sm text-muted-foreground">This patient has no recorded medical history.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockMedicalHistory.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">{item.type}</Badge>
                            <p className="font-semibold text-lg">{item.condition}</p>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-1">
                            {item.diagnosedDate && (
                              <p className="text-sm text-muted-foreground">
                                Diagnosed: {formatDate(item.diagnosedDate)}
                              </p>
                            )}
                            {item.date && (
                              <p className="text-sm text-muted-foreground">
                                Date: {formatDate(item.date)}
                              </p>
                            )}
                            {item.status && (
                              <Badge className={item.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-100'}>
                                {item.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.severity && (
                          <div>
                            <p className="text-sm text-muted-foreground">Severity:</p>
                            <Badge variant="destructive">{item.severity}</Badge>
                          </div>
                        )}
                        {item.notes && (
                          <div>
                            <p className="text-sm text-muted-foreground">Notes:</p>
                            <p className="text-sm font-medium">{item.notes}</p>
                          </div>
                        )}
                        {item.hospital && (
                          <div>
                            <p className="text-sm text-muted-foreground">Hospital:</p>
                            <p className="text-sm font-medium">{item.hospital}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Admissions */}
          <TabsContent value="admissions">
            <Card>
              <CardHeader>
                <CardTitle>Admission History</CardTitle>
                <CardDescription>All hospital admissions for this patient</CardDescription>
              </CardHeader>
              <CardContent>
                {mockAdmissionsData.length === 0 ? (
                  <div className="text-center py-12">
                    <Bed className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No admissions</p>
                    <p className="text-sm text-muted-foreground">This patient has no admission records.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockAdmissionsData.map((admission) => (
                      <div key={admission.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{admission.ward} - {admission.bed}</p>
                            <p className="text-sm text-muted-foreground">{admission.reason}</p>
                          </div>
                          <Badge>{admission.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Admitted:</p>
                            <p className="font-medium">{admission.dateAdmitted}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Discharged:</p>
                            <p className="font-medium">{admission.dateDischarged}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: Vitals */}
          <TabsContent value="vitals">
            <Card>
              <CardHeader>
                <CardTitle>Vital Signs History</CardTitle>
                <CardDescription>Patient's recorded vital signs over time</CardDescription>
              </CardHeader>
              <CardContent>
                {mockVitalsData.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No vitals recorded</p>
                    <p className="text-sm text-muted-foreground">This patient has no vital signs records.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Temp (°C)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">BP (mmHg)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pulse (bpm)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Weight (kg)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Height (cm)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">RBS (mg/dL)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockVitalsData.map((vital, index) => (
                            <tr key={index} className="border-b border-border last:border-0">
                              <td className="py-3 px-4 text-sm">{vital.date}</td>
                              <td className="py-3 px-4 text-sm">{vital.temperature}</td>
                              <td className="py-3 px-4 text-sm">{vital.bp}</td>
                              <td className="py-3 px-4 text-sm">{vital.pulse}</td>
                              <td className="py-3 px-4 text-sm">{vital.weight}</td>
                              <td className="py-3 px-4 text-sm">{vital.height}</td>
                              <td className="py-3 px-4 text-sm">{vital.rbs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 7: Prescriptions */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Prescription History</CardTitle>
                <CardDescription>All prescriptions for this patient</CardDescription>
              </CardHeader>
              <CardContent>
                {mockPrescriptionsData.length === 0 ? (
                  <div className="text-center py-12">
                    <Pill className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No prescriptions</p>
                    <p className="text-sm text-muted-foreground">This patient has no prescription records.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockPrescriptionsData.map((prescription) => (
                      <div key={prescription.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{prescription.drug}</p>
                            <p className="text-sm text-muted-foreground">{prescription.dosage}</p>
                          </div>
                          <Badge className={prescription.status === 'Fulfilled' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                            {prescription.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Duration:</p>
                            <p className="font-medium">{prescription.duration}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Doctor:</p>
                            <p className="font-medium">{prescription.doctor}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date:</p>
                            <p className="font-medium">{prescription.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 8: Invoices */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>All invoices for this patient</CardDescription>
              </CardHeader>
              <CardContent>
                {patientInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No invoices</p>
                    <p className="text-sm text-muted-foreground">This patient has no invoice records.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Invoice ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Receipt ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-border last:border-0">
                            <td className="py-3 px-4 text-sm font-medium">{invoice.id}</td>
                            <td className="py-3 px-4 text-sm">{invoice.receiptId}</td>
                            <td className="py-3 px-4 text-sm">{invoice.invoiceType}</td>
                            <td className="py-3 px-4 text-sm font-semibold">₦{invoice.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <Badge className={
                                invoice.paymentStatus === 'Paid'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : invoice.paymentStatus === 'Partial'
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200'
                              }>
                                {invoice.paymentStatus}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm">{formatDate(invoice.dateCreated)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedInvoice(invoice)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedInvoice(invoice)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 9: Nurse Notes */}
          <TabsContent value="nurse-notes">
            <Card>
              <CardHeader>
                <CardTitle>Nurse Notes</CardTitle>
                <CardDescription>Nursing observations and notes</CardDescription>
              </CardHeader>
              <CardContent>
                {mockNurseNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No nurse notes</p>
                    <p className="text-sm text-muted-foreground">This patient has no nursing notes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockNurseNotes.map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{note.nurse}</p>
                            <p className="text-sm text-muted-foreground">{note.shift}</p>
                          </div>
                          <Badge variant="outline">{note.date}</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Notes:</p>
                            <p className="font-medium">{note.notes}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Observations:</p>
                            <p className="font-medium">{note.observations}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 10: Lab Tests */}
          <TabsContent value="lab-tests">
            <Card>
              <CardHeader>
                <CardTitle>Laboratory Tests</CardTitle>
                <CardDescription>All lab tests for this patient</CardDescription>
              </CardHeader>
              <CardContent>
                {mockLabTests.length === 0 ? (
                  <div className="text-center py-12">
                    <FlaskConical className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No lab tests</p>
                    <p className="text-sm text-muted-foreground">This patient has no lab test records.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockLabTests.map((test) => (
                      <div key={test.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{test.testName}</p>
                            <p className="text-sm text-muted-foreground">Requested by: {test.requestedBy}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              test.status === 'Completed'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                            }>
                              {test.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLabTest(test)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Date:</p>
                            <p className="font-medium">{test.date}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Result:</p>
                            <p className="font-medium">{test.result}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 11: Findings */}
          <TabsContent value="findings">
            <Card>
              <CardHeader>
                <CardTitle>Medical Findings</CardTitle>
                <CardDescription>All medical findings for this patient</CardDescription>
              </CardHeader>
              <CardContent>
                {mockFindings.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No findings</p>
                    <p className="text-sm text-muted-foreground">This patient has no medical findings.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockFindings.map((finding) => (
                      <div key={finding.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{finding.finding}</p>
                            <p className="text-sm text-muted-foreground">By: {finding.doctor}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{finding.type}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFinding(finding)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Date:</p>
                            <p className="font-medium">{finding.date}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Result:</p>
                            <p className="font-medium">{finding.result}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Mark as Deceased Modal */}
      <Dialog open={isDeceasedModalOpen} onOpenChange={setIsDeceasedModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Mark Patient as Deceased
            </DialogTitle>
            <DialogDescription>
              This will permanently mark the patient as deceased. Please provide the required information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                Warning: This action will change the patient's life status permanently.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfDeath">Date of Death *</Label>
              <Input
                id="dateOfDeath"
                type="date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="causeOfDeath">Cause of Death *</Label>
              <Input
                id="causeOfDeath"
                placeholder="Enter cause of death"
                value={causeOfDeath}
                onChange={(e) => setCauseOfDeath(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deathRemarks">Additional Remarks (Optional)</Label>
              <Textarea
                id="deathRemarks"
                placeholder="Enter any additional remarks..."
                rows={4}
                value={deathRemarks}
                onChange={(e) => setDeathRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeceasedModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMarkAsDeceased}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Mark as Deceased
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modals */}
      <ViewAppointmentModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />
      <ViewInvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
      <ViewLabTestModal
        isOpen={!!selectedLabTest}
        onClose={() => setSelectedLabTest(null)}
        labTest={selectedLabTest}
      />
      <ViewFindingModal
        isOpen={!!selectedFinding}
        onClose={() => setSelectedFinding(null)}
        finding={selectedFinding}
      />
    </div>
  );
}
