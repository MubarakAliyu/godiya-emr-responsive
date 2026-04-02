import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Users, Search, Filter, Eye, Activity, Bed,
    ChevronLeft, ChevronRight, RefreshCw, Loader2,
    Calendar, Info, History, UserCheck, Clock, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';

interface IPDHistoryRecord {
    admission_id: number;
    admission_patient: string;
    patient_name: string;
    gender: string;
    dob: string;
    ward_name: string;
    ipd_number: string;
    admission_datetime: string;
    admission_discharge_date: string;
    admission_bed: number;
}

export function IPDHistoryPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [records, setRecords] = useState<IPDHistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Determine the base path for navigation based on the current URL
    const rolePath = useMemo(() => {
        if (location.pathname.includes('/dashboard')) return 'dashboard';
        if (location.pathname.includes('/reception')) return 'reception';
        if (location.pathname.includes('/doctor')) return 'doctor';
        return 'nurse';
    }, [location.pathname]);

    const ipdPath = useMemo(() => {
        if (rolePath === 'dashboard' || rolePath === 'reception') return 'inpatient';
        return 'ipd';
    }, [rolePath]);

    const fetchIPDHistory = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await fetch('/api/nurse_requests.php?type=ipd_history');
            if (!response.ok) throw new Error('Failed to fetch IPD history');
            const data = await response.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching IPD history:', error);
            toast.error('Could not load IPD history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchIPDHistory();
    }, [fetchIPDHistory]);

    const calculateAge = (dob: string) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const filteredRecords = useMemo(() => {
        return records.filter(p =>
            p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.admission_patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.ipd_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.ward_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [records, searchTerm]);

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const currentRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Loading IPD history...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/emr/${rolePath}/patients/${ipdPath}`)}
                        className="rounded-full shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <History className="w-8 h-8 text-secondary" />
                            IPD Admission History
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Records of previously admitted and discharged patients
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchIPDHistory(true)}
                    disabled={refreshing}
                    className="shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Records
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-secondary/5 border-secondary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-secondary/70">Total Discharged</p>
                                <p className="text-3xl font-bold text-secondary">{records.length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/10">
                                <UserCheck className="w-6 h-6 text-secondary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-muted-foreground/10">
                <CardHeader className="pb-3 border-b bg-muted/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg text-secondary-900">Historical Directory</CardTitle>
                            <CardDescription>Viewing {filteredRecords.length} historical admissions</CardDescription>
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
                                    <th className="px-6 py-4 text-left">Ward Hist.</th>
                                    <th className="px-6 py-4 text-left">Duration</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted">
                                {currentRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Info className="w-8 h-8 opacity-20" />
                                                <p>No historical records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentRecords.map((record, index) => (
                                        <motion.tr
                                            key={record.admission_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-muted/30 transition-colors group"
                                        >
                                            <td className="px-6 py-4 font-mono text-sm font-bold text-secondary">
                                                {record.ipd_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                                                        {record.patient_name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {record.admission_patient} • {calculateAge(record.dob)}y • {record.gender}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="w-fit bg-slate-50 text-slate-700 border-slate-200">
                                                    {record.ward_name}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(record.admission_datetime).toLocaleDateString()} - {new Date(record.admission_discharge_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.max(1, Math.ceil((new Date(record.admission_discharge_date).getTime() - new Date(record.admission_datetime).getTime()) / 86400000))} Days
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:bg-secondary hover:text-white transition-all transform active:scale-95"
                                                    onClick={() => navigate(`/emr/${rolePath}/patients/${record.admission_patient}/ipd-file`)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View File
                                                </Button>
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
        </div>
    );
}
