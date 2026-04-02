import { useState, useMemo, useEffect } from 'react';
import type { Patient } from '@/app/emr/store/types';
import { useNavigate } from 'react-router-dom';
import { usePatientBasePath } from '@/app/emr/hooks/usePatientBasePath';
import { motion } from 'motion/react';
import { Activity, Bed, ChevronLeft, ChevronRight, Download, Edit, Eye, Filter, Printer, RotateCcw, Search, Skull, Stethoscope, Trash2, TrendingUp, User, UserCircle, UserPlus, UserX, Users } from 'lucide-react';
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
import { EditPatientModal } from './components/edit-patient-modal';
import { DeceasedModal } from './components/deceased-modal';
import { DeletePatientModal } from './components/delete-patient-modal';
import { AddPatientModal } from './components/add-patient-modal';
import { FamilySubfilesModal } from './components/family-subfiles-modal';
import { differenceInYears } from 'date-fns';
import { usePermissions } from '@/app/emr/auth/PermissionsContext';
import { getCurrentUser } from '@/app/emr/utils/auth';

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
  value: number | string;
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

export function AllPatientsPage() {
  const navigate = useNavigate();
  const patientBasePath = usePatientBasePath();
  const { patients, addNotification } = useEMRStore();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('Patients', 'create');
  const canEdit = hasPermission('Patients', 'edit');
  const canDelete = hasPermission('Patients', 'delete');
  const canExport = hasPermission('Patients', 'export');
  const canApprove = hasPermission('Patients', 'approve');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeceasedModalOpen, setIsDeceasedModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
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
  const [patientTypeFilter, setPatientTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Apply filters
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        searchTerm === '' ||
        patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phoneNumber.includes(searchTerm);

      const matchesPatientType =
        patientTypeFilter === 'all' ||
        patient.patientType === patientTypeFilter;

      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;

      return matchesSearch && matchesPatientType && matchesStatus && matchesGender;
    });
  }, [patients, searchTerm, patientTypeFilter, statusFilter, genderFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  // Calculate KPIs
  const totalPatients = patients.length;
  const ipdPatients = liveIpdCount; // Fetched from tbl_bed_admission where sta = approved
  const opdPatients = patients.filter((p) => p.patientType === 'Outpatient').length;
  const activePatients = patients.filter((p) => p.status === 'Active' && !p.isDead).length;
  const deceased = patients.filter((p) => p.isDead).length;

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setPatientTypeFilter('all');
    setStatusFilter('all');
    setGenderFilter('all');
    setCurrentPage(1);
    toast.success('Filters reset successfully');
  };

  // Action handlers
  const handleViewFile = (patient: Patient) => {
    if (patient.fileType === 'Family') {
      setSelectedPatient(patient);
      setIsFamilyModalOpen(true);
    } else {
      navigate(`${patientBasePath}/${patient.id}/ipd-file`);
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

  const getAge = (dateOfBirth: string) => {
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const isDoctor = getCurrentUser()?.role === 'Doctor';

  const handleConsult = (patient: Patient) => {
    navigate(`${patientBasePath}/${patient.id}/consultation`);
  };

  // Status badge helper
  const getStatusBadge = (patient: Patient) => {
    if (patient.isDead) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Deceased</Badge>;
    }

    const variants: Record<string, any> = {
      Active: { className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      Admitted: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      Discharged: { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
      'Pending Payment': { className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
    };

    return <Badge {...(variants[patient.status] || variants.Active)}>{patient.status}</Badge>;
  };

  // Patient type badge helper
  const getPatientTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      Inpatient: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      Outpatient: { className: 'bg-green-100 text-green-700 hover:bg-green-100' },
    };

    return <Badge {...(variants[type] || variants.Outpatient)}>{type === 'Inpatient' ? 'IPD' : 'OPD'}</Badge>;
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['S/N', 'File No.', 'Name', 'Age', 'Gender', 'Phone', 'File Type', 'Patient Type', 'Status'];
    const csvData = filteredPatients.map((patient, index) => [
      index + 1,
      patient.id,
      patient.fullName,
      `${getAge(patient.dateOfBirth)} years`,
      patient.gender,
      patient.phoneNumber,
      patient.fileType,
      patient.patientType,
      patient.isDead ? 'Deceased' : patient.status
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-patients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('CSV Exported', {
      description: `${filteredPatients.length} records exported successfully.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Patient Report Exported',
      message: `All patients CSV report generated (${filteredPatients.length} records)`,
      type: 'info',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Low',
    });
  };

  // Print report
  const handlePrintReport = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Patients Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #000; }
            .report-container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
            .header h1 { color: #1e40af; font-size: 32px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; }
            .patients-table { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 12px; }
            .patients-table th { background: #1e40af; color: white; padding: 10px; text-align: left; }
            .patients-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .patients-table tr:nth-child(even) { background: #f9fafb; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>GODIYA HOSPITAL</h1>
              <p>All Patients Report - ${new Date().toLocaleDateString()}</p>
              <p>Birnin Kebbi, Kebbi State, Nigeria</p>
            </div>
            <table class="patients-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>File No.</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPatients.map((patient, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${patient.id}</strong></td>
                    <td>${patient.fullName}</td>
                    <td>${getAge(patient.dateOfBirth)} yrs</td>
                    <td>${patient.gender}</td>
                    <td>${patient.phoneNumber}</td>
                    <td>${patient.patientType === 'Inpatient' ? 'IPD' : 'OPD'}</td>
                    <td>${patient.isDead ? 'Deceased' : patient.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    if (frameDoc) {
      const doc = frameDoc.document || frameDoc;
      doc.open();
      doc.write(reportHTML);
      doc.close();

      setTimeout(() => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          }

          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);

          toast.success('Report Printing');

          addNotification({
            id: Date.now(),
            title: 'Patient Report Printed',
            message: 'All patients report generated and sent to printer',
            type: 'info',
            status: 'Unread',
            timestamp: new Date().toISOString(),
            priority: 'Low',
          });
        } catch (error) {
          toast.error('Print Error', {
            description: 'Unable to print report. Please try again.',
          });
        }
      }, 500);
    }
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
          <h1 className="text-3xl font-bold">All Patients</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all hospital patients (IPD & OPD)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {canExport && (
            <Button variant="outline" onClick={exportAsCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
          <Button
            className="flex-1 sm:flex-none gap-2"
            onClick={() => setIsAddModalOpen(true)}
            disabled={!canCreate}
          >
            Register Patient
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={Users}
          label="Total Patients"
          value={totalPatients}
          color="bg-primary/10 text-primary"
          delay={0}
        />
        <KPICard
          icon={Activity}
          label="Active Patients"
          value={activePatients}
          color="bg-green-100 text-green-600"
          delay={0.05}
        />
        <KPICard
          icon={Bed}
          label="IPD Patients"
          value={ipdPatients}
          color="bg-blue-100 text-blue-600"
          delay={0.1}
        />
        <KPICard
          icon={Stethoscope}
          label="OPD Patients"
          value={opdPatients}
          color="bg-purple-100 text-purple-600"
          delay={0.15}
        />
        <KPICard
          icon={UserX}
          label="Deceased"
          value={deceased}
          color="bg-red-100 text-red-600"
          delay={0.2}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
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
          </div>

          {/* Patient Type Filter */}
          <Select
            value={patientTypeFilter}
            onValueChange={(value) => {
              setPatientTypeFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Patient Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Inpatient">IPD (Inpatient)</SelectItem>
              <SelectItem value="Outpatient">OPD (Outpatient)</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Admitted">Admitted</SelectItem>
              <SelectItem value="Discharged">Discharged</SelectItem>
              <SelectItem value="Pending Payment">Pending Payment</SelectItem>
            </SelectContent>
          </Select>

          {/* Gender Filter */}
          <Select
            value={genderFilter}
            onValueChange={(value) => {
              setGenderFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {currentPatients.length} of {filteredPatients.length} patients
          </p>
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
                <th className="px-4 py-3 text-left text-sm font-medium">Patient Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Age</th>
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
                  <td colSpan={11} className="px-4 py-12 text-center">
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
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{patient.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{patient.fullName}</td>
                    <td className="px-4 py-3 text-sm">{getAge(patient.dateOfBirth)} yrs</td>
                    <td className="px-4 py-3 text-sm">{patient.gender}</td>
                    <td className="px-4 py-3 text-sm">{patient.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{patient.fileType}</Badge>
                    </td>
                    <td className="px-4 py-3">{getPatientTypeBadge(patient.patientType)}</td>
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
                          title="View Full File"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isDoctor && !patient.isDead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary/90"
                            onClick={() => handleConsult(patient)}
                            title="Consult"
                          >
                            <Stethoscope className="w-4 h-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(patient)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && !patient.isPaid && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(patient)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} • {filteredPatients.length} total records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        patient={selectedPatient}
      />

      <DeceasedModal
        isOpen={isDeceasedModalOpen}
        onClose={() => setIsDeceasedModalOpen(false)}
        patient={selectedPatient}
      />

      <DeletePatientModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        patient={selectedPatient}
      />

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <FamilySubfilesModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        familyFile={selectedPatient}
      />
    </div>
  );
}
