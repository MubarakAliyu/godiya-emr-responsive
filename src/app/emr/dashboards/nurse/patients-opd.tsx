import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, Eye, Filter, Calendar,
  MapPin, Phone, User, ArrowLeft, ClipboardList,
  Stethoscope, Pill, FlaskConical, AlertCircle,
  Clock, CheckCircle2, FileText, Briefcase, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from '../../../components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OPDPatient {
  patient_id: string;
  patient_name: string;
  gender: string;
  dob: string;
  is_subfile: number;
  parent_file_number: string | null;
  visit_count: number;
}

interface AppointmentHistory {
  appointment_id: number;
  appointment_number: string;
  appointment_date: string;
  doctor_name: string;
  appointment_sta: string;
  consultation_id?: number;
}

interface AppointmentSummary {
  consultation: {
    diagnosis: string;
    observations: string;
    patient_complain: string;
    followup_date: string | null;
    followup_instruction: string | null;
  };
  prescriptions: any[];
  labTests: any[];
  referral: any | null;
  surgery: any | null;
  admission: any | null;
}

export function NurseOPDPatients() {
  const [patients, setPatients] = useState<OPDPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [selectedPatient, setSelectedPatient] = useState<OPDPatient | null>(null);
  const [visitHistory, setVisitHistory] = useState<AppointmentHistory[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentHistory | null>(null);
  const [summary, setSummary] = useState<AppointmentSummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/nurse_requests.php?type=opd_patients');
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch OPD patients:', err);
      toast.error('Connection Error', { description: 'Could not load OPD patient list' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleViewHistory = async (patient: OPDPatient) => {
    setSelectedPatient(patient);
    setIsHistoryOpen(true);
    try {
      const res = await fetch(`/api/appointments.php?appointment_fileid=${patient.patient_id}&status=finished`);
      const data = await res.json();
      setVisitHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch visit history:', err);
    }
  };

  const handleViewSummary = async (appt: AppointmentHistory) => {
    setSelectedAppointment(appt);
    setIsSummaryOpen(true);
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/consultation.php?appointment_id=${appt.appointment_id}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch appointment summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-primary" />
            OPD Patient List
          </h1>
          <p className="text-muted-foreground mt-1">
            Patients with finished consultations and clinical history
          </p>
        </div>
        <Button onClick={fetchPatients} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or file number..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">File ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Patient Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Visit Count</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Details</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-4 py-6">
                        <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No OPD patients found with finished appointments.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.patient_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-primary uppercase">
                          {patient.patient_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{patient.patient_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date().getFullYear() - new Date(patient.dob).getFullYear(), '0')} yrs • {patient.gender}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-bold">
                          {patient.visit_count} {patient.visit_count === 1 ? 'Visit' : 'Visits'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {patient.is_subfile ? (
                          <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit">
                            <Users className="w-3 h-3" />
                            Parent: {patient.parent_file_number}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Main File</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleViewHistory(patient)}
                        >
                          <Eye className="w-4 h-4" />
                          View History
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Visit History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Visit History: {selectedPatient?.patient_name}
            </DialogTitle>
            <DialogDescription>
              All completed appointments and clinical summaries
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {visitHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No finished appointments found.
              </div>
            ) : (
              visitHistory.map((appt) => (
                <div
                  key={appt.appointment_id}
                  className="p-4 border rounded-xl hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => handleViewSummary(appt)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{appt.appointment_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appt.appointment_date), 'PPP')} • Dr. {appt.doctor_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px]">
                      Finished
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Summary Modal */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-secondary" />
              Clinical Summary: {selectedAppointment?.appointment_number}
            </DialogTitle>
            <DialogDescription>
              Detailed findings, prescriptions, and results for this visit
            </DialogDescription>
          </DialogHeader>

          {loadingSummary ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading summary...</p>
            </div>
          ) : summary ? (
            <div className="space-y-6 mt-4">
              {/* Main Consultation Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      Chief Complaint
                    </h4>
                    <p className="mt-1 text-sm bg-muted/30 p-3 rounded-lg border">
                      {summary.consultation.patient_complain || 'No record'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-500" />
                      Diagnosis
                    </h4>
                    <p className="mt-1 text-sm font-semibold bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      {summary.consultation.diagnosis || 'No diagnosis recorded'}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-500" />
                    Clinical Observations
                  </h4>
                  <p className="mt-1 text-sm bg-muted/30 p-3 rounded-lg border whitespace-pre-wrap">
                    {summary.consultation.observations || 'No observations recorded'}
                  </p>
                </div>
              </div>

              {/* Prescriptions */}
              <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-green-600" />
                  Prescriptions
                </h4>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-3 py-2">Drug</th>
                        <th className="text-left px-3 py-2">Dosage</th>
                        <th className="text-left px-3 py-2">Freq</th>
                        <th className="text-center px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {summary.prescriptions.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-muted-foreground italic">No medication prescribed</td></tr>
                      ) : (
                        summary.prescriptions.map((rx, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-medium">{rx.drugName}</td>
                            <td className="px-3 py-2">{rx.dosage}</td>
                            <td className="px-3 py-2">{rx.frequency}</td>
                            <td className="px-3 py-2 text-center">
                              <Badge variant="outline" className={rx.is_paid ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}>
                                {rx.is_paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lab Tests */}
              <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-amber-600" />
                  Laboratory Requests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.labTests.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No lab tests requested</p>
                  ) : (
                    summary.labTests.map((t, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1.5 flex items-center gap-2">
                        <CheckCircle2 className={`w-3 h-3 ${t.sta === 'completed' ? 'text-green-600' : 'text-orange-500'}`} />
                        {t.testName}
                        <span className="text-[10px] opacity-70">({t.sta})</span>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Other Requests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border rounded-xl bg-blue-50/30">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Referral</p>
                  {summary.referral ? (
                    <div className="text-xs">
                      <p className="font-bold text-blue-700">TO: {summary.referral.rs_referto}</p>
                      <p className="mt-1 opacity-70">{summary.referral.rs_remarks}</p>
                    </div>
                  ) : <p className="text-xs text-muted-foreground italic">None</p>}
                </div>
                <div className="p-3 border rounded-xl bg-purple-50/30">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Surgery</p>
                  {summary.surgery ? (
                    <div className="text-xs">
                      <p className="font-bold text-purple-700">{summary.surgery.sr_name}</p>
                      <p className="mt-1 opacity-70">{summary.surgery.sr_remarks}</p>
                    </div>
                  ) : <p className="text-xs text-muted-foreground italic">None</p>}
                </div>
                <div className="p-3 border rounded-xl bg-amber-50/30">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Admission</p>
                  {summary.admission ? (
                    <div className="text-xs">
                      <p className="font-bold text-amber-700">Recommended</p>
                      <p className="mt-1 opacity-70">{summary.admission.admit_remarks}</p>
                    </div>
                  ) : <p className="text-xs text-muted-foreground italic">None</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              Failed to load clinical summary.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSummaryOpen(false)}>Close Summary</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
