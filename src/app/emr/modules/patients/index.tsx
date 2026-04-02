import { useState, useMemo, useEffect } from 'react';
import type { Patient } from '@/app/emr/store/types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users, UserCircle, UsersRound, Bed, Stethoscope, Skull,
  Search, Filter, RotateCcw, Plus, Eye, Edit, Trash2,
  ChevronLeft, ChevronRight, UserPlus, Calendar, FolderOpen,
  User, UserX
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { AddPatientModal } from './components/add-patient-modal';
import { EditPatientModal } from './components/edit-patient-modal';
import { DeceasedModal } from './components/deceased-modal';
import { DeletePatientModal } from './components/delete-patient-modal';
import { FamilySubfilesModal } from './components/family-subfiles-modal';
import { CreateAppointmentModal } from '@/app/emr/dashboard/components/create-appointment-modal';

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

export default function PatientManagement() {
  const navigate = useNavigate();
  const { patients } = useEMRStore();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeceasedModalOpen, setIsDeceasedModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [liveIpdCount, setLiveIpdCount] = useState(0);

  useEffect(() => {
    fetch('/api/nurse_requests.php?type=ipd_patients', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLiveIpdCount(data.length);
        }
      })
      .catch(err => console.error('Error fetching live IPD data:', err));
  }, []);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientTypeFilter, setPatientTypeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and search patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        searchTerm === '' ||
        patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phoneNumber.includes(searchTerm);

      const matchesFileType = fileTypeFilter === 'all' || patient.fileType === fileTypeFilter;
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      const matchesPatientType = patientTypeFilter === 'all' || patient.patientType === patientTypeFilter;
      const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;

      return matchesSearch && matchesFileType && matchesStatus && matchesPatientType && matchesGender;
    });
  }, [patients, searchTerm, fileTypeFilter, statusFilter, patientTypeFilter, genderFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  // Calculate KPIs
  const totalPatients = patients.length;
  const familyFiles = patients.filter((p) => p.fileType === 'Family').length;
  const individualFiles = patients.filter((p) => p.fileType === 'Individual').length;
  const ipdPatients = liveIpdCount; // Fetched from tbl_bed_admission where sta = approved
  const opdPatients = patients.filter((p) => p.patientType === 'Outpatient').length;
  const deceasedRecords = patients.filter((p) => p.isDead).length;

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFileTypeFilter('all');
    setStatusFilter('all');
    setPatientTypeFilter('all');
    setGenderFilter('all');
    setCurrentPage(1);
    toast.success('Filters reset successfully');
  };

  // Action handlers
  const handleViewFile = (patient: Patient) => {
    if (patient.fileType === 'Family') {
      if (!patient.isPaid) {
        toast.error('Payment required before adding family subfiles');
      }
      setSelectedPatient(patient);
      setIsFamilyModalOpen(true);
    } else {
      // Navigate to patient file page
      navigate(`/emr/dashboard/patients/${patient.id}/ipd-file`);
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  const handleMarkDeceased = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeceasedModalOpen(true);
  };

  const handleDelete = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteModalOpen(true);
  };

  // Status badge helper
  const getStatusBadge = (patient: Patient) => {
    if (patient.isDead) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Deceased</Badge>;
    }

    const variants: Record<string, any> = {
      Active: { className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      Admitted: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      ICU: { className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
      Discharged: { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
    };

    return <Badge {...(variants[patient.status] || variants.Active)}>{patient.status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground mt-1">Manage all patient files, records and medical history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, file number, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setIsAppointmentModalOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Create Appointment
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          icon={FolderOpen}
          label="Total Files"
          value={totalPatients}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          icon={User}
          label="Individual Files"
          value={individualFiles}
          color="bg-green-100 text-green-600"
          delay={0.05}
        />
        <KPICard
          icon={UsersRound}
          label="Family Files"
          value={familyFiles}
          color="bg-purple-100 text-purple-600"
          delay={0.1}
        />
        <KPICard
          icon={Bed}
          label="IPD Patients"
          value={ipdPatients}
          color="bg-orange-100 text-orange-600"
          delay={0.15}
        />
        <KPICard
          icon={Stethoscope}
          label="OPD Patients"
          value={opdPatients}
          color="bg-cyan-100 text-cyan-600"
          delay={0.2}
        />
        <KPICard
          icon={UserX}
          label="Deceased Records"
          value={deceasedRecords}
          color="bg-red-100 text-red-600"
          delay={0.25}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-4 border border-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>

            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Family">Family</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Admitted">Admitted</SelectItem>
                <SelectItem value="ICU">ICU</SelectItem>
                <SelectItem value="Discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={patientTypeFilter} onValueChange={setPatientTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Patient Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IPD">IPD</SelectItem>
                <SelectItem value="OPD">OPD</SelectItem>
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </motion.div>

      {/* Patient Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">S/N</th>
                <th className="px-4 py-3 text-left text-sm font-medium">File No</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Gender</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">File Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Patient Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Payment</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Deceased</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentPatients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No patients found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentPatients.map((patient, index) => (
                  <motion.tr
                    key={patient.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{patient.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{patient.fullName}</td>
                    <td className="px-4 py-3 text-sm">{patient.gender}</td>
                    <td className="px-4 py-3 text-sm">{patient.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{patient.fileType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{patient.patientType}</td>
                    <td className="px-4 py-3">{getStatusBadge(patient)}</td>
                    <td className="px-4 py-3 text-sm">
                      {patient.isPaid ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Unpaid</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {patient.isDead ? (
                        <span className="text-red-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewFile(patient)}
                          title={patient.fileType === 'Family' ? 'View Subfiles' : 'View File'}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(patient)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!patient.isDead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-600 hover:text-orange-700"
                            onClick={() => handleMarkDeceased(patient)}
                            title="Mark as Deceased"
                          >
                            <Skull className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(patient)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredPatients.length)} of{' '}
              {filteredPatients.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AddPatientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
      <DeceasedModal
        isOpen={isDeceasedModalOpen}
        onClose={() => {
          setIsDeceasedModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
      <DeletePatientModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
      <FamilySubfilesModal
        isOpen={isFamilyModalOpen}
        onClose={() => {
          setIsFamilyModalOpen(false);
          setSelectedPatient(null);
        }}
        familyFile={selectedPatient}
      />
      <CreateAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
      />
    </div>
  );
}