import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users, Search, Filter, Eye, Activity, Bed,
  ChevronLeft, ChevronRight, RefreshCw, Loader2,
  Calendar, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';

interface IPDPatient {
  admission_id: number;
  admission_patient: string;
  patient_name: string;
  gender: string;
  dob: string;
  ward_name: string;
  ipd_number: string;
  admission_datetime: string;
  admission_bed: number;
}

export function NurseIPDPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<IPDPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
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
            Admitted Patients (IPD)
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary/70">Total Admitted</p>
                <p className="text-3xl font-bold text-primary">{patients.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
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
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary hover:text-white transition-all transform active:scale-95"
                          onClick={() => navigate(`/emr/nurse/patients/${patient.admission_patient}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Open File
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
