import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Users, Search, Filter, Eye, Activity, Bed,
    ChevronLeft, ChevronRight, RefreshCw, Loader2,
    Calendar, Info, Edit, Trash2, Skull, BedDouble, ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { getCurrentUser } from '@/app/emr/utils/auth';
import { differenceInYears } from 'date-fns';

// Import modals for administrative actions
import { EditPatientModal } from '../../modules/patients/components/edit-patient-modal';
import { DeceasedModal } from '../../modules/patients/components/deceased-modal';
import { DeletePatientModal } from '../../modules/patients/components/delete-patient-modal';

interface IPDPatient {
    admission_id: number;
    admission_patient: string; // patient_unique_id
    patient_name: string;
    gender: string;
    dob: string;
    ward_name: string;
    ipd_number: string;
    admission_datetime: string;
    admission_bed: number;
    file_type?: string;
    is_subfile: number;
}

export function UnifiedIPDPatients() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const isAdminOrReception = currentUser?.role === 'Super Administrator' || currentUser?.role === 'Receptionist';

    const [patients, setPatients] = useState<IPDPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Administrative Modal States
    const [selectedPatientForAction, setSelectedPatientForAction] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeceasedModalOpen, setIsDeceasedModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const fetchIPDPatients = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await fetch('/api/nurse_requests.php?type=ipd_patients');
            if (!response.ok) throw new Error('Failed to fetch IPD patients');
            const data = await response.json();
            setPatients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching IPD patients:', error);
            toast.error('Could not load IPD patient list');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchIPDPatients();
    }, []);

    const calculateAge = (dob: string) => {
        if (!dob) return 'N/A';
        return differenceInYears(new Date(), new Date(dob));
    };

    const filteredPatients = useMemo(() => {
        return patients.filter(p =>
            p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.admission_patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.ipd_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.ward_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    const currentPatients = filteredPatients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleOpenFile = (patientCode: string) => {
        // All roles navigate to the clinical IPD file view (NursePatientFilePage)
        // which has all medical tabs (Vitals, Notes, Drug Chart, Lab Tests, etc.)
        const role = currentUser?.role;
        if (role === 'Doctor') {
            navigate(`/emr/doctor/patients/${patientCode}/ipd-file`);
        } else if (role === 'Nurse') {
            navigate(`/emr/nurse/patients/${patientCode}/ipd-file`);
        } else if (role === 'Super Administrator' || role === 'Super Admin') {
            navigate(`/emr/dashboard/patients/${patientCode}/ipd-file`);
        } else {
            // Receptionist — use the ipd-file route which maps to NursePatientFilePage
            navigate(`/emr/reception/patients/${patientCode}/ipd-file`);
        }
    };

    const handleOpenFullFile = (patientCode: string) => {
        const role = currentUser?.role;
        const basePath = (role === 'Super Administrator' || role === 'Super Admin') ? '/emr/dashboard' : (role === 'Doctor' ? '/emr/doctor' : (role === 'Nurse' ? '/emr/nurse' : '/emr/reception'));
        navigate(`${basePath}/patients/${patientCode}/full-file`);
    };

    // Admin Action Handlers
    const handleEdit = (p: IPDPatient) => {
        setSelectedPatientForAction({ id: p.admission_patient, fullName: p.patient_name, gender: p.gender, dateOfBirth: p.dob });
        setIsEditModalOpen(true);
    };

    const handleMarkDeceased = (p: IPDPatient) => {
        setSelectedPatientForAction({ id: p.admission_patient, fullName: p.patient_name });
        setIsDeceasedModalOpen(true);
    };

    const handleDelete = (p: IPDPatient) => {
        setSelectedPatientForAction({ id: p.admission_patient, fullName: p.patient_name });
        setIsDeleteModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Loading admitted patients...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Bed className="w-8 h-8 text-primary" />
                        IPD Patient Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time list of patients currently occupying beds
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchIPDPatients(true)}
                    disabled={refreshing}
                    className="shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh List
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary/70">Currently Admitted</p>
                                <p className="text-3xl font-bold text-primary">{patients.length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <BedDouble className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-muted-foreground/10">
                <CardHeader className="pb-3 border-b bg-muted/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">In-Patient Directory</CardTitle>
                            <CardDescription>Filtering {filteredPatients.length} admitted patients</CardDescription>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by IPD No, Name, or File ID..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <th className="px-6 py-4 text-left">IPD Number</th>
                                    <th className="px-6 py-4 text-left">Patient Details</th>
                                    <th className="px-6 py-4 text-left">Ward & Bed</th>
                                    <th className="px-6 py-4 text-left">Admission Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted">
                                {currentPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Info className="w-8 h-8 opacity-20" />
                                                <p>No active admissions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentPatients.map((patient, index) => (
                                        <motion.tr
                                            key={patient.admission_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-muted/30 transition-colors group"
                                        >
                                            <td className="px-6 py-4 font-mono text-sm font-bold text-primary">
                                                {patient.ipd_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {patient.patient_name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {patient.admission_patient} • {calculateAge(patient.dob)}y • {patient.gender}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700 border-blue-200">
                                                        {patient.ward_name}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground mt-1">Bed #{patient.admission_bed}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="w-4 h-4 opacity-70" />
                                                    {new Date(patient.admission_datetime).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="hover:bg-blue-600 hover:text-white transition-all transform active:scale-95"
                                                        onClick={() => handleOpenFile(patient.admission_patient)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        File
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95"
                                                        onClick={() => handleOpenFullFile(patient.admission_patient)}
                                                        disabled={patient.file_type === 'Family' && Number(patient.is_subfile) === 0}
                                                    >
                                                        <ClipboardList className="w-4 h-4 mr-2" />
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
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
                            <p className="text-sm text-muted-foreground font-medium">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Administrative Modals */}
            {isAdminOrReception && selectedPatientForAction && (
                <>
                    <EditPatientModal
                        isOpen={isEditModalOpen}
                        onClose={() => { setIsEditModalOpen(false); setSelectedPatientForAction(null); fetchIPDPatients(true); }}
                        patient={selectedPatientForAction}
                    />
                    <DeceasedModal
                        isOpen={isDeceasedModalOpen}
                        onClose={() => { setIsDeceasedModalOpen(false); setSelectedPatientForAction(null); fetchIPDPatients(true); }}
                        patient={selectedPatientForAction}
                    />
                    <DeletePatientModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => { setIsDeleteModalOpen(false); setSelectedPatientForAction(null); fetchIPDPatients(true); }}
                        patient={selectedPatientForAction}
                    />
                </>
            )}
        </div>
    );
}
