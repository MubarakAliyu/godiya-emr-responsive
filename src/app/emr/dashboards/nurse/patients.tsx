import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useEMRStore } from '../../store/emr-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Activity, Bed, ChevronLeft, ChevronRight, ClipboardList, Eye, Filter, FolderOpen, Search, Skull, Stethoscope, User, UserX, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AppointmentStatus, Patient } from '../../store/types';
import { FamilySubfilesModal } from '../../modules/patients/components/family-subfiles-modal';

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Card className="hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
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

export function NursePatients() {
  const navigate = useNavigate();
  const { patients } = useEMRStore();

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Family modal states
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [selectedFamilyFile, setSelectedFamilyFile] = useState<Patient | null>(null);

  // KPI states
  const [liveIpdCount, setLiveIpdCount] = useState(0);

  // Calculate live KPI data
  const totalPatients = patients.length;
  const opdCount = patients.filter((p: Patient) => p.patientType === 'Outpatient').length;
  const deceasedCount = patients.filter((p: Patient) => p.isDead).length;

  // Fetch live IPD count
  useEffect(() => {
    const fetchIpdCount = async () => {
      try {
        const res = await fetch('/api/nurse_requests.php?type=ipd_patients');
        if (res.ok) {
          const data = await res.json();
          setLiveIpdCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (e) { console.error('Error fetching live IPD count:', e); }
    };
    fetchIpdCount();
  }, []);

  // Filter patients for table
  const filteredPatients = useMemo(() => {
    return patients.filter((patient: Patient) => {
      const matchesSearch = searchTerm === '' ||
        patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFileType = fileTypeFilter === 'all' || patient.fileType === fileTypeFilter;
      const matchesDepartment = departmentFilter === 'all' || patient.patientType === departmentFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'Alive' && !patient.isDead) ||
        (statusFilter === 'Deceased' && patient.isDead);

      return matchesSearch && matchesFileType && matchesDepartment && matchesStatus;
    });
  }, [patients, searchTerm, fileTypeFilter, departmentFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleViewFile = (patient: Patient) => {
    if (patient.fileType === 'Family') {
      setSelectedFamilyFile(patient);
      setIsFamilyModalOpen(true);
    } else {
      navigate(`/emr/nurse/patients/${patient.id}/ipd-file`);
    }
  };

  // Empty state
  const hasPatients = patients.length > 0;
  const hasFilteredResults = filteredPatients.length > 0;

  return (
    <>
      <div className="p-6 md:p-8 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Patient Management
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all hospital patients (IPD, OPD, ER, ICU, COPD)
            </p>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Patients"
            value={totalPatients}
            icon={Users}
            color="primary"
          />
          <KPICard
            title="IPD Patients"
            value={liveIpdCount}
            icon={Bed}
            color="secondary"
          />
          <KPICard
            title="OPD Patients"
            value={opdCount}
            icon={Stethoscope}
            color="blue"
          />
          <KPICard
            title="Deceased"
            value={deceasedCount}
            icon={Skull}
            color="destructive"
          />
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, file number, or phone..."
              className="pl-9"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
            />
          </div>
          <Select value={fileTypeFilter} onValueChange={(value: string) => { setFileTypeFilter(value); handleFilterChange(); }}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="File Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All File Types</SelectItem>
              <SelectItem value="Individual">Individual</SelectItem>
              <SelectItem value="Family">Family</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={(value: string) => { setDepartmentFilter(value); handleFilterChange(); }}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Inpatient">IPD</SelectItem>
              <SelectItem value="Outpatient">OPD</SelectItem>
              <SelectItem value="ER">ER</SelectItem>
              <SelectItem value="ICU">ICU</SelectItem>
              <SelectItem value="COPD">COPD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value: string) => { setStatusFilter(value); handleFilterChange(); }}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Alive">Alive</SelectItem>
              <SelectItem value="Deceased">Deceased</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Patients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-0">
              {!hasPatients ? (
                <div className="text-center py-12 px-4">
                  <UserX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    No Patients Registered
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    There are currently no patients registered in the system.
                  </p>
                </div>
              ) : !hasFilteredResults ? (
                <div className="text-center py-12 px-4">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    No Results Found
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    No patients match your search criteria. Try adjusting your filters or search term.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFileTypeFilter('all');
                      setDepartmentFilter('all');
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">File No</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Patient Name</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">File Type</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Department</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Status</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Date Registered</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {currentPatients.map((patient: Patient) => (
                          <tr key={patient.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm font-medium text-primary">
                                {patient.id}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{patient.fullName}</span>
                                <span className="text-xs text-muted-foreground">{patient.gender} • {patient.age} years</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={patient.fileType === 'Individual' ? 'default' : 'secondary'}>
                                {patient.fileType}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground">{patient.patientType}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={patient.isDead ? 'destructive' : 'default'}>
                                {patient.isDead ? 'Deceased' : 'Alive'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground">{patient.dateRegistered}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleViewFile(patient)}
                              >
                                <Eye className="w-4 h-4" />
                                View File
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <FamilySubfilesModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        familyFile={selectedFamilyFile}
      />
    </>
  );
}
