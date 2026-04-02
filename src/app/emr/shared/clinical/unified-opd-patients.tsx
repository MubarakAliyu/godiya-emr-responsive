import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Eye, Filter, Calendar,
    Stethoscope, Pill, FlaskConical, AlertCircle,
    Clock, CheckCircle2, RefreshCw, Loader2,
    Trash2, Edit, Skull, ClipboardList, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from '@/app/components/ui/dialog';
import { format, differenceInYears } from 'date-fns';
import { toast } from 'sonner';
import { getCurrentUser } from '@/app/emr/utils/auth';

// Admin Modals
import { EditPatientModal } from '../../modules/patients/components/edit-patient-modal';
import { DeceasedModal } from '../../modules/patients/components/deceased-modal';
import { DeletePatientModal } from '../../modules/patients/components/delete-patient-modal';

interface OPDPatient {
    patient_id: string;
    patient_name: string;
    gender: string;
    dob: string;
    is_subfile: number;
    parent_file_number: string | null;
    visit_count: number;
    file_type?: string;
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

export function UnifiedOPDPatients() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const isAdminOrReception = currentUser?.role === 'Super Administrator' || currentUser?.role === 'Receptionist';


    const [patients, setPatients] = useState<OPDPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // History and Summary States
    const [selectedPatient, setSelectedPatient] = useState<OPDPatient | null>(null);
    const [visitHistory, setVisitHistory] = useState<AppointmentHistory[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentHistory | null>(null);
    const [summary, setSummary] = useState<AppointmentSummary | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Admin Action States
    const [selectedPatientForAction, setSelectedPatientForAction] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeceasedModalOpen, setIsDeceasedModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const fetchPatients = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const res = await fetch('/api/nurse_requests.php?type=opd_patients');
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch OPD patients:', err);
            toast.error('Could not load OPD patient list');
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

    const handleOpenFile = (patientCode: string) => {
        const role = currentUser?.role;
        if (role === 'Doctor') navigate(`/emr/doctor/patients/${patientCode}/ipd-file`);
        else if (role === 'Nurse') navigate(`/emr/nurse/patients/${patientCode}/ipd-file`);
        else if (role === 'Super Administrator' || role === 'Super Admin') navigate(`/emr/dashboard/patients/${patientCode}/ipd-file`);
        else navigate(`/emr/reception/patients/${patientCode}/ipd-file`);
    };

    const handleOpenFullFile = (patientCode: string) => {
        const role = currentUser?.role;
        const basePath = (role === 'Super Administrator' || role === 'Super Admin') ? '/emr/dashboard' : (role === 'Doctor' ? '/emr/doctor' : (role === 'Nurse' ? '/emr/nurse' : '/emr/reception'));
        navigate(`${basePath}/patients/${patientCode}/full-file`);
    };

    // Admin Handlers
    const handleEdit = (p: OPDPatient) => {
        setSelectedPatientForAction({ id: p.patient_id, fullName: p.patient_name, gender: p.gender, dateOfBirth: p.dob });
        setIsEditModalOpen(true);
    };

    const handleMarkDeceased = (p: OPDPatient) => {
        setSelectedPatientForAction({ id: p.patient_id, fullName: p.patient_name });
        setIsDeceasedModalOpen(true);
    };

    const handleDelete = (p: OPDPatient) => {
        setSelectedPatientForAction({ id: p.patient_id, fullName: p.patient_name });
        setIsDeleteModalOpen(true);
    };

    const filteredPatients = patients.filter(p =>
        p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Loading outpatient directory...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Stethoscope className="w-8 h-8 text-primary" />
                        OPD Patient Directory
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        History of completed consultations and out-patient records
                    </p>
                </div>
                <Button onClick={() => fetchPatients(true)} variant="outline" className="gap-2 shadow-sm">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            <Card className="shadow-sm border-muted-foreground/10">
                <CardContent className="p-4 bg-muted/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or file number..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                                    <th className="text-left px-6 py-4">File ID</th>
                                    <th className="text-left px-6 py-4">Patient Name</th>
                                    <th className="text-left px-6 py-4">Visit Count</th>
                                    <th className="text-left px-6 py-4">Details</th>
                                    <th className="text-right px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted">
                                {filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                            No OPD records found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <tr key={patient.patient_id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-bold text-primary">
                                                    {patient.patient_id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold group-hover:text-primary transition-colors">{patient.patient_name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {differenceInYears(new Date(), new Date(patient.dob))}y • {patient.gender}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="font-bold bg-muted text-muted-foreground border-muted-foreground/10">
                                                    {patient.visit_count} {patient.visit_count === 1 ? 'Visit' : 'Visits'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {patient.is_subfile ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full w-fit border border-purple-100">
                                                        <Users className="w-3 h-3" />
                                                        Parent: {patient.parent_file_number}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-muted-foreground/10">Main File</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-2 hover:bg-primary hover:text-white transition-all transform active:scale-95"
                                                        onClick={() => handleViewHistory(patient)}
                                                    >
                                                        <History className="w-4 h-4" />
                                                        History
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-2 hover:bg-blue-600 hover:text-white transition-all transform active:scale-95"
                                                        onClick={() => handleOpenFile(patient.patient_id)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        File
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-2 hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95"
                                                        onClick={() => handleOpenFullFile(patient.patient_id)}
                                                        disabled={patient.file_type === 'Family' && Number(patient.is_subfile) === 0}
                                                    >
                                                        <ClipboardList className="w-4 h-4" />
                                                        Full File
                                                    </Button>

                                                    {isAdminOrReception && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-600"
                                                                onClick={() => handleEdit(patient)}
                                                                title="Edit Patient"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-orange-600"
                                                                onClick={() => handleMarkDeceased(patient)}
                                                                title="Mark Deceased"
                                                            >
                                                                <Skull className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600"
                                                                onClick={() => handleDelete(patient)}
                                                                title="Delete Patient"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
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
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-none shadow-2xl p-0">
                    <div className="bg-primary/5 p-6 border-b">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <ClipboardList className="w-6 h-6 text-primary" />
                                </div>
                                Visit History: {selectedPatient?.patient_name}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                All completed appointments and clinical summaries
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-4">
                        {visitHistory.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
                                <Clock className="w-12 h-12 mx-auto opacity-20 mb-4" />
                                <p className="font-medium">No finished appointments found.</p>
                            </div>
                        ) : (
                            visitHistory.map((appt) => (
                                <motion.div
                                    key={appt.appointment_id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="p-5 bg-white border rounded-2xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                                    onClick={() => handleViewSummary(appt)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                            <Calendar className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{appt.appointment_number}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(appt.appointment_date), 'PPP')} • <span className="text-foreground/80 font-medium">Dr. {appt.doctor_name}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] font-bold px-3 py-1">
                                            Finished
                                        </Badge>
                                        <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                    <div className="p-4 bg-muted/30 border-t flex justify-end px-6">
                        <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>Close History</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Appointment Summary Modal */}
            <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0">
                    <div className="bg-secondary/5 p-6 border-b">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 bg-secondary/10 rounded-lg">
                                    <ClipboardList className="w-6 h-6 text-secondary" />
                                </div>
                                Clinical Summary: {selectedAppointment?.appointment_number}
                            </DialogTitle>
                            <DialogDescription>
                                Detailed findings, prescriptions, and results for this visit
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8">
                        {loadingSummary ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <RefreshCw className="w-10 h-10 animate-spin text-muted-foreground opacity-50" />
                                <p className="text-sm text-muted-foreground font-medium">Fetching consultation details...</p>
                            </div>
                        ) : summary ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                                Chief Complaint
                                            </h4>
                                            <div className="text-sm bg-muted/40 p-4 rounded-xl border border-muted-foreground/10 text-foreground/80 leading-relaxed">
                                                {summary.consultation.patient_complain || 'No record'}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                                                <Stethoscope className="w-4 h-4 text-primary" />
                                                Final Diagnosis
                                            </h4>
                                            <div className="text-sm font-bold bg-primary/5 p-4 rounded-xl border border-primary/20 text-primary uppercase">
                                                {summary.consultation.diagnosis || 'No diagnosis recorded'}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                                            <Eye className="w-4 h-4 text-purple-500" />
                                            Clinical Observations
                                        </h4>
                                        <div className="text-sm bg-muted/40 p-4 rounded-xl border border-muted-foreground/10 min-h-[160px] whitespace-pre-wrap leading-relaxed text-foreground/80">
                                            {summary.consultation.observations || 'No observations recorded'}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Pill className="w-4 h-4 text-green-600" />
                                        Prescribed Medication
                                    </h4>
                                    <div className="border rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted text-muted-foreground">
                                                <tr>
                                                    <th className="text-left px-5 py-3 font-semibold">Drug Name</th>
                                                    <th className="text-left px-5 py-3 font-semibold">Dosage</th>
                                                    <th className="text-left px-5 py-3 font-semibold">Frequency</th>
                                                    <th className="text-center px-5 py-3 font-semibold">Payment Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-muted bg-white">
                                                {summary.prescriptions.length === 0 ? (
                                                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground italic">No medication prescribed for this visit.</td></tr>
                                                ) : (
                                                    summary.prescriptions.map((rx, idx) => (
                                                        <tr key={idx} className="hover:bg-muted/30">
                                                            <td className="px-5 py-4 font-bold text-foreground">{rx.drugName}</td>
                                                            <td className="px-5 py-4 text-muted-foreground font-medium">{rx.dosage}</td>
                                                            <td className="px-5 py-4 text-muted-foreground font-medium">{rx.frequency}</td>
                                                            <td className="px-5 py-4 text-center">
                                                                <Badge variant="outline" className={rx.is_paid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
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

                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FlaskConical className="w-4 h-4 text-blue-600" />
                                        Laboratory Requests
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {summary.labTests.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic bg-muted/30 w-full p-4 rounded-xl text-center border">No laboratory tests requested.</p>
                                        ) : (
                                            summary.labTests.map((t, idx) => (
                                                <Badge key={idx} variant="secondary" className="px-4 py-2 bg-white border border-muted-foreground/10 text-foreground/80 flex items-center gap-3 rounded-xl shadow-sm">
                                                    <CheckCircle2 className={`w-4 h-4 ${t.sta === 'completed' ? 'text-green-600' : 'text-orange-500'}`} />
                                                    <span className="font-semibold">{t.testName}</span>
                                                    <span className="text-[10px] opacity-60 uppercase font-black px-1.5 py-0.5 bg-muted rounded">{t.sta}</span>
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-5 border rounded-2xl bg-blue-50/20 border-blue-100 shadow-sm">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Referral</p>
                                        {summary.referral ? (
                                            <div className="text-sm">
                                                <p className="font-black text-blue-900 mb-2">TO: {summary.referral.rs_referto}</p>
                                                <p className="opacity-70 text-xs italic leading-relaxed">"{summary.referral.rs_remarks}"</p>
                                            </div>
                                        ) : <p className="text-xs text-muted-foreground font-medium italic">No referral needed.</p>}
                                    </div>
                                    <div className="p-5 border rounded-2xl bg-purple-50/20 border-purple-100 shadow-sm">
                                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3">Surgery</p>
                                        {summary.surgery ? (
                                            <div className="text-sm">
                                                <p className="font-black text-purple-900 mb-2">{summary.surgery.sr_name}</p>
                                                <p className="opacity-70 text-xs italic leading-relaxed">"{summary.surgery.sr_remarks}"</p>
                                            </div>
                                        ) : <p className="text-xs text-muted-foreground font-medium italic">No surgical intervention.</p>}
                                    </div>
                                    <div className="p-5 border rounded-2xl bg-orange-50/20 border-orange-100 shadow-sm">
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">Admission</p>
                                        {summary.admission ? (
                                            <div className="text-sm">
                                                <Badge className="bg-orange-600 mb-2">RECOMMENDED</Badge>
                                                <p className="opacity-70 text-xs italic leading-relaxed">"{summary.admission.admit_remarks}"</p>
                                            </div>
                                        ) : <p className="text-xs text-muted-foreground font-medium italic">General follow-up only.</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
                                <AlertCircle className="w-12 h-12 mx-auto opacity-20 mb-4" />
                                <p className="font-medium">Failed to load clinical summary.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-muted/30 border-t flex justify-between px-8">
                        <Button variant="ghost" onClick={() => setIsSummaryOpen(false)}>Back to History</Button>
                        <Button variant="outline" className="bg-white" onClick={() => setIsSummaryOpen(false)}>Close Summary</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Administrative Modals */}
            {isAdminOrReception && selectedPatientForAction && (
                <>
                    <EditPatientModal
                        isOpen={isEditModalOpen}
                        onClose={() => { setIsEditModalOpen(false); setSelectedPatientForAction(null); fetchPatients(true); }}
                        patient={selectedPatientForAction}
                    />
                    <DeceasedModal
                        isOpen={isDeceasedModalOpen}
                        onClose={() => { setIsDeceasedModalOpen(false); setSelectedPatientForAction(null); fetchPatients(true); }}
                        patient={selectedPatientForAction}
                    />
                    <DeletePatientModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => { setIsDeleteModalOpen(false); setSelectedPatientForAction(null); fetchPatients(true); }}
                        patient={selectedPatientForAction}
                    />
                </>
            )}
        </div>
    );
}

function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] w-full bg-border ${className}`} />;
}
