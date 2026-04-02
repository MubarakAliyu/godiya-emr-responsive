import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity, Search, Eye, Check, X, Calendar, Clock,
  AlertCircle, User, Phone, Stethoscope, Scissors,
  Building2, ClipboardList, Timer, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
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
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

// Mock surgery requests data
const mockSurgeryRequests = [
  {
    id: 'SUR-001',
    patientId: 'GH-2024-012',
    patientName: 'Abubakar Mohammed',
    age: 48,
    gender: 'Male',
    phone: '08012345678',
    surgeon: 'Dr. Ahmed Suleiman',
    department: 'General Surgery',
    surgeryType: 'Appendectomy',
    requiredEquipment: 'Laparoscopic surgery set, Suction equipment, Cautery device, Standard surgical instruments',
    estimatedTime: '1-2 hours',
    notes: 'Patient has acute appendicitis. Requires emergency appendectomy. Patient has been NPO since admission. Pre-operative labs completed.',
    urgency: 'Critical',
    status: 'Pending',
    requestedDate: '2024-02-11',
    requestedTime: '09:30 AM',
  },
  {
    id: 'SUR-002',
    patientId: 'GH-2024-034',
    patientName: 'Fatima Hassan',
    age: 35,
    gender: 'Female',
    phone: '08098765432',
    surgeon: 'Dr. Musa Ibrahim',
    department: 'Orthopedics',
    surgeryType: 'Knee Arthroscopy',
    requiredEquipment: 'Arthroscopy equipment, Camera system, Irrigation pump, Shaver system',
    estimatedTime: '2-3 hours',
    notes: 'Torn meniscus confirmed via MRI. Elective arthroscopy scheduled. Patient cleared by cardiology.',
    urgency: 'Medium',
    status: 'Pending',
    requestedDate: '2024-02-11',
    requestedTime: '10:15 AM',
  },
  {
    id: 'SUR-003',
    patientId: 'GH-2024-056',
    patientName: 'Ibrahim Yusuf',
    age: 62,
    gender: 'Male',
    phone: '08087654321',
    surgeon: 'Dr. Fatima Bello',
    department: 'Cardiothoracic Surgery',
    surgeryType: 'CABG (Coronary Artery Bypass)',
    requiredEquipment: 'Heart-lung machine, Cardiopulmonary bypass equipment, Sternotomy saw, Vascular instruments',
    estimatedTime: '4-6 hours',
    notes: 'Triple vessel coronary artery disease. Patient stable. Echo shows EF 45%. Pre-op clearance obtained.',
    urgency: 'High',
    status: 'Approved',
    requestedDate: '2024-02-10',
    requestedTime: '02:00 PM',
    approvedDate: '2024-02-10T15:30:00Z',
    surgeryDate: '2024-02-12',
    surgeryStartTime: '08:00 AM',
    surgeryEndTime: '02:00 PM',
    prepNotes: 'Patient to be NPO from midnight. Pre-op antibiotics at 7:00 AM. Consent signed. Blood products on standby.',
    assignedNurse: 'Nurse Aisha Mohammed',
    theatreRoom: 'OT-1 (Main Theatre)',
  },
  {
    id: 'SUR-004',
    patientId: 'GH-2024-078',
    patientName: 'Maryam Garba',
    age: 28,
    gender: 'Female',
    phone: '08076543210',
    surgeon: 'Dr. Umar Hassan',
    department: 'Obstetrics & Gynecology',
    surgeryType: 'Cesarean Section',
    requiredEquipment: 'OB surgical tray, Suction equipment, Infant warmer, Emergency resuscitation equipment',
    estimatedTime: '1 hour',
    notes: 'Emergency C-Section - fetal distress noted. Patient is 38 weeks pregnant. Previous C-section scar present.',
    urgency: 'Critical',
    status: 'Pending',
    requestedDate: '2024-02-11',
    requestedTime: '11:45 AM',
  },
];

// Theatre rooms list
const theatreRooms = [
  { id: 'OT-1', name: 'OT-1 (Main Theatre)' },
  { id: 'OT-2', name: 'OT-2 (Minor Theatre)' },
  { id: 'OT-3', name: 'OT-3 (Emergency Theatre)' },
  { id: 'OT-4', name: 'OT-4 (Specialty Theatre)' },
];

export function NurseSurgeries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchSurgeries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/nurse_requests.php?type=surgery&status=pending');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      const mappedSurgeries = data.map((item: any) => ({
        id: item.sr_id,
        patientId: item.patient_unique_id,
        patientName: item.patient_name,
        age: calculateAge(item.dob),
        gender: item.gender,
        phone: item.phone_number,
        surgeon: 'Assigned Specialist',
        department: 'Surgical Dept',
        surgeryType: item.sr_name,
        requiredEquipment: 'Standard Pack',
        estimatedTime: '2 hours',
        diagnosis: item.consultation_diagnosis || 'Pending',
        observations: item.consultation_observations || '',
        notes: item.sr_remarks,
        urgency: 'Medium',
        status: 'Pending',
        requestedDate: item.sr_datetime.split(' ')[0],
        requestedTime: item.sr_datetime.split(' ')[1],
      }));
      setSurgeries(mappedSurgeries);
    } catch (error) {
      console.error('Error fetching surgeries:', error);
      toast.error('Could not load surgery requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeries();
  }, []);

  // Modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Surgery prep fields (shown after approval)
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryStartTime, setSurgeryStartTime] = useState('');
  const [surgeryEndTime, setSurgeryEndTime] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [assignedNurse, setAssignedNurse] = useState('');
  const [theatreRoom, setTheatreRoom] = useState('');

  // Filter surgeries
  const filteredSurgeries = useMemo(() => {
    return surgeries.filter((surgery) => {
      const matchesSearch =
        surgery.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surgery.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surgery.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        surgery.surgeryType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surgery.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || surgery.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'all' || surgery.urgency === urgencyFilter;

      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [surgeries, searchQuery, statusFilter, urgencyFilter]);

  const handleApproveClick = (surgery: any) => {
    setSelectedSurgery(surgery);
    setSurgeryDate('');
    setSurgeryStartTime('');
    setSurgeryEndTime('');
    setPrepNotes('');
    setAssignedNurse('');
    setTheatreRoom('');
    setIsApproveModalOpen(true);
  };

  const handleRejectClick = (surgery: any) => {
    setSelectedSurgery(surgery);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleViewClick = (surgery: any) => {
    setSelectedSurgery(surgery);
    setIsViewModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedSurgery || !surgeryDate || !surgeryStartTime || !surgeryEndTime || !theatreRoom || !assignedNurse) {
      toast.error('Please fill in all surgery preparation fields');
      return;
    }

    try {
      const response = await fetch('/api/nurse_requests.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          type: 'surgery',
          id: selectedSurgery.id,
          schedule: {
            surgeryDate,
            surgeryStartTime,
            surgeryEndTime,
            prepNotes,
            assignedNurse,
            theatreRoom
          }
        })
      });

      if (!response.ok) throw new Error('Approval failed');

      toast.success('Surgery request approved and scheduled');
      fetchSurgeries();
      setIsApproveModalOpen(false);
      setSelectedSurgery(null);
      setSurgeryDate('');
      setSurgeryStartTime('');
      setSurgeryEndTime('');
      setPrepNotes('');
      setAssignedNurse('');
      setTheatreRoom('');
    } catch (error) {
      toast.error('Failed to approve surgery');
    }
  };

  const confirmReject = async () => {
    if (!selectedSurgery || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch('/api/nurse_requests.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          type: 'surgery',
          id: selectedSurgery.id,
          remarks: rejectionReason
        })
      });

      if (!response.ok) throw new Error('Rejection failed');

      toast.error('Surgery request rejected');
      fetchSurgeries();
      setIsRejectModalOpen(false);
      setSelectedSurgery(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject surgery');
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      Critical: 'bg-red-100 text-red-700',
      High: 'bg-orange-100 text-orange-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Low: 'bg-green-100 text-green-700',
    };
    return (
      <Badge className={`${variants[urgency as keyof typeof variants]} hover:${variants[urgency as keyof typeof variants]}`}>
        {urgency}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Pending: 'bg-blue-100 text-blue-700',
      Approved: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
    };
    return (
      <Badge className={`${variants[status as keyof typeof variants]} hover:${variants[status as keyof typeof variants]}`}>
        {status}
      </Badge>
    );
  };

  const pendingCount = surgeries.filter((s) => s.status === 'Pending').length;
  const approvedCount = surgeries.filter((s) => s.status === 'Approved').length;
  const criticalCount = surgeries.filter((s) => s.urgency === 'Critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Surgery Requests</h1>
        <p className="text-muted-foreground mt-1">
          Manage patient surgery requests and theatre scheduling
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold">{criticalCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-100">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Surgeries</p>
                  <p className="text-2xl font-bold">{surgeries.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Surgery Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search surgeries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setUrgencyFilter('all');
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Surgery Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Surgery Requests</CardTitle>
          <CardDescription>
            Showing {filteredSurgeries.length} of {surgeries.length} surgery requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Surgery ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Surgery Type</TableHead>
                  <TableHead>Surgeon</TableHead>
                  <TableHead>Est. Time</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurgeries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Scissors className="w-12 h-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No surgery requests found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSurgeries.map((surgery, index) => (
                    <motion.tr
                      key={surgery.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{surgery.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{surgery.patientName}</p>
                          <p className="text-xs text-muted-foreground">{surgery.patientId}</p>
                          <p className="text-xs text-muted-foreground">
                            {surgery.age}y, {surgery.gender}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{surgery.surgeryType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{surgery.surgeon}</p>
                          <p className="text-xs text-muted-foreground">{surgery.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          {surgery.estimatedTime}
                        </div>
                      </TableCell>
                      <TableCell>{getUrgencyBadge(surgery.urgency)}</TableCell>
                      <TableCell>{getStatusBadge(surgery.status)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{surgery.requestedDate}</p>
                          <p className="text-xs text-muted-foreground">{surgery.requestedTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {surgery.status === 'Pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApproveClick(surgery)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectClick(surgery)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleViewClick(surgery)}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Approve Surgery Modal - ENHANCED WITH PREP FIELDS */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-green-100">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Approve Surgery Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Review details and schedule surgery for {selectedSurgery?.patientName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Patient Details */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Information
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient ID:</span>
                  <span className="font-semibold">{selectedSurgery?.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold">{selectedSurgery?.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age / Gender:</span>
                  <span className="font-semibold">
                    {selectedSurgery?.age}y, {selectedSurgery?.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold">{selectedSurgery?.phone}</span>
                </div>
              </div>
            </div>

            {/* Surgery Details */}
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 space-y-2">
              <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Surgery Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surgery Type:</span>
                  <span className="font-semibold text-purple-900">{selectedSurgery?.surgeryType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surgeon:</span>
                  <span className="font-semibold text-purple-900">{selectedSurgery?.surgeon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-semibold text-purple-900">{selectedSurgery?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Time:</span>
                  <span className="font-semibold text-purple-900">{selectedSurgery?.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-muted-foreground">Urgency:</span>
                  {selectedSurgery && getUrgencyBadge(selectedSurgery.urgency)}
                </div>
              </div>
            </div>

            {/* Required Equipment */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
              <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Required Equipment
              </h3>
              <p className="text-sm text-amber-900 leading-relaxed">{selectedSurgery?.requiredEquipment}</p>
            </div>

            {/* Clinical Notes */}
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 space-y-2">
              <h3 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Clinical Notes
              </h3>
              <p className="text-sm text-orange-900 leading-relaxed">{selectedSurgery?.notes}</p>
            </div>

            {/* SURGERY PREPARATION FIELDS - After Approval */}
            <div className="p-4 rounded-lg bg-green-50 border-2 border-green-300 space-y-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Surgery Preparation & Scheduling
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Surgery Date */}
                <div className="space-y-2">
                  <Label htmlFor="surgeryDate" className="text-sm font-medium">
                    Surgery Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="surgeryDate"
                    type="date"
                    value={surgeryDate}
                    onChange={(e) => setSurgeryDate(e.target.value)}
                    required
                  />
                </div>

                {/* Theatre Room */}
                <div className="space-y-2">
                  <Label htmlFor="theatreRoom" className="text-sm font-medium">
                    Theatre Room <span className="text-red-500">*</span>
                  </Label>
                  <Select value={theatreRoom} onValueChange={setTheatreRoom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theatre" />
                    </SelectTrigger>
                    <SelectContent>
                      {theatreRooms.map((room) => (
                        <SelectItem key={room.id} value={room.name}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium">
                    Start Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={surgeryStartTime}
                    onChange={(e) => setSurgeryStartTime(e.target.value)}
                    required
                  />
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium">
                    End Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={surgeryEndTime}
                    onChange={(e) => setSurgeryEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Assigned Nurse */}
              <div className="space-y-2">
                <Label htmlFor="assignedNurse" className="text-sm font-medium">
                  Assigned Nurse <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="assignedNurse"
                  type="text"
                  value={assignedNurse}
                  onChange={(e) => setAssignedNurse(e.target.value)}
                  placeholder="Enter assigned nurse name"
                  required
                />
              </div>

              {/* Prep Notes */}
              <div className="space-y-2">
                <Label htmlFor="prepNotes" className="text-sm font-medium">
                  Preparation Notes
                </Label>
                <Textarea
                  id="prepNotes"
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Enter surgery preparation instructions, pre-op requirements, etc."
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={confirmApprove}
            >
              <Check className="w-4 h-4 mr-2" />
              Approve & Schedule Surgery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Surgery Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-red-100">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Reject Surgery Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Surgery Details */}
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Surgery ID:</span>
                <span className="font-semibold">{selectedSurgery?.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold">{selectedSurgery?.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Surgery Type:</span>
                <span className="font-semibold">{selectedSurgery?.surgeryType}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-900">
                Once rejected, this surgery request will be permanently declined and cannot be recovered.
              </p>
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-sm font-medium">
                Reason for Rejection <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejecting this surgery request..."
                className="min-h-[100px] resize-none"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim()}
            >
              <X className="w-4 h-4 mr-2" />
              Reject Surgery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Surgery Modal - ENHANCED */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-3 rounded-full ${selectedSurgery?.status === 'Approved' ? 'bg-green-100' : 'bg-blue-100'
                  }`}
              >
                <Eye
                  className={`w-6 h-6 ${selectedSurgery?.status === 'Approved' ? 'text-green-600' : 'text-blue-600'
                    }`}
                />
              </div>
              <div>
                <DialogTitle className="text-xl">View Surgery Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Complete details for {selectedSurgery?.patientName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Patient Details */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Information
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient ID:</span>
                  <span className="font-semibold">{selectedSurgery?.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold">{selectedSurgery?.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age / Gender:</span>
                  <span className="font-semibold">
                    {selectedSurgery?.age}y, {selectedSurgery?.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold">{selectedSurgery?.phone}</span>
                </div>
              </div>
            </div>

            {/* Surgery Details */}
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 space-y-2">
              <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Surgery Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surgery Type:</span>
                  <span className="font-semibold text-purple-900">{selectedSurgery?.surgeryType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surgeon:</span>
                  <span className="font-semibold text-purple-900">{selectedSurgery?.surgeon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-semibold text-purple-900">{selectedSurgery?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Time:</span>
                  <span className="font-semibold text-purple-900">{selectedSurgery?.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-muted-foreground">Urgency:</span>
                  {selectedSurgery && getUrgencyBadge(selectedSurgery.urgency)}
                </div>
              </div>
            </div>

            {/* Required Equipment */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
              <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Required Equipment
              </h3>
              <p className="text-sm text-amber-900 leading-relaxed">{selectedSurgery?.requiredEquipment}</p>
            </div>

            {/* Clinical Notes */}
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 space-y-2">
              <h3 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Clinical Notes
              </h3>
              <p className="text-sm text-orange-900 leading-relaxed">{selectedSurgery?.notes}</p>
            </div>

            {/* Surgery Schedule - Only if Approved */}
            {selectedSurgery?.status === 'Approved' && 'surgeryDate' in selectedSurgery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-green-50 border-2 border-green-300 space-y-3"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-900">Surgery Approved & Scheduled</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs mb-1">Surgery Date</span>
                    <div className="flex items-center gap-2 font-semibold text-green-900">
                      <Calendar className="w-4 h-4" />
                      {(selectedSurgery as any).surgeryDate}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs mb-1">Theatre Room</span>
                    <div className="flex items-center gap-2 font-semibold text-green-900">
                      <Building2 className="w-4 h-4" />
                      {(selectedSurgery as any).theatreRoom}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs mb-1">Start Time</span>
                    <div className="flex items-center gap-2 font-semibold text-green-900">
                      <Clock className="w-4 h-4" />
                      {(selectedSurgery as any).surgeryStartTime}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs mb-1">End Time</span>
                    <div className="flex items-center gap-2 font-semibold text-green-900">
                      <Clock className="w-4 h-4" />
                      {(selectedSurgery as any).surgeryEndTime}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Assigned Nurse:</span>
                    <span className="text-sm font-semibold text-green-900">
                      {(selectedSurgery as any).assignedNurse}
                    </span>
                  </div>

                  {(selectedSurgery as any).prepNotes && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <span className="text-xs text-muted-foreground block mb-1">Preparation Notes:</span>
                      <p className="text-sm text-green-900 leading-relaxed">
                        {(selectedSurgery as any).prepNotes}
                      </p>
                    </div>
                  )}
                </div>

                {(selectedSurgery as any).approvedDate && (
                  <div className="flex items-center gap-2 text-xs text-green-700 pt-2 border-t border-green-200">
                    <CalendarIcon className="w-3 h-3" />
                    <span>
                      Approved on{' '}
                      {new Date((selectedSurgery as any).approvedDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Rejection Badge */}
            {selectedSurgery?.status === 'Rejected' && (
              <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-900">Surgery Rejected</h3>
                </div>
                <p className="text-sm text-red-800 mt-2">
                  This surgery request has been rejected and cannot be processed.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
