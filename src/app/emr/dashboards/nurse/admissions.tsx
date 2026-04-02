import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus, Search, Eye, Check, X, Filter, Calendar, Clock,
  FileText, AlertCircle, ChevronDown, User, Phone, MapPin,
  Building2, Bed, Activity, Printer, Loader2, Users
} from 'lucide-react';
import { printPOSSlip } from '@/app/emr/utils/pos-print';
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
import { useEMRStore } from '@/app/emr/store/emr-store';

export function NurseAdmissions() {
  const { settings } = useEMRStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const [requests, setRequests] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // New states for enhanced admission modal
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [admissionFee, setAdmissionFee] = useState(0);
  const [liveIpdCount, setLiveIpdCount] = useState(0);

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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const admRes = await fetch('/api/nurse_requests.php?type=admission&status=pending');
      if (!admRes.ok) throw new Error('Failed to fetch admissions');
      const admData = await admRes.json();

      const mappedRequests = admData.map((item: any) => ({
        id: item.admit_id,
        patientId: item.patient_unique_id,
        patientName: item.patient_name,
        age: calculateAge(item.dob),
        gender: item.gender,
        doctor: item.doctor_name || 'Dr. Assigned',
        diagnosis: item.consultation_diagnosis || 'Pending',
        observations: item.consultation_observations || '',
        admitRemarks: item.admit_remarks || '',
        requestedDate: item.admit_datetime.split(' ')[0],
        requestedTime: item.admit_datetime.split(' ')[1],
        wardType: 'General',
        urgency: 'Medium',
        status: 'Pending',
        phone: item.phone_number,
        isSubfile: !!item.is_subfile,
        bearerId: item.bearer_id
      }));
      setRequests(mappedRequests);

      const roomRes = await fetch('/api/rooms.php');
      if (!roomRes.ok) throw new Error('Failed to fetch wards');
      const roomData = await roomRes.json();
      setWards(roomData);

      // Fetch Live IPD Count for KPI
      const ipdRes = await fetch('/api/nurse_requests.php?type=ipd_patients', { credentials: 'include' });
      const ipdData = await ipdRes.json();
      if (Array.isArray(ipdData)) {
        setLiveIpdCount(ipdData.length);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Could not load admission data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveClick = (request: any) => {
    setSelectedRequest(request);
    setApprovalNotes('');
    setIsApproveModalOpen(true);
  };

  const handleRejectClick = (request: any) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleViewClick = (request: any) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        request.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'all' || request.urgency === urgencyFilter;

      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [requests, searchQuery, statusFilter, urgencyFilter]);

  const [isApproving, setIsApproving] = useState(false);

  const confirmApprove = async (shouldPrint: boolean = false) => {
    if (!selectedRequest || !selectedWard) return;

    setIsApproving(true);
    try {
      const response = await fetch('/api/nurse_requests.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          type: 'admission',
          id: selectedRequest.id,
          bed_id: selectedWard,
          case_id: 'C-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        })
      });

      if (!response.ok) throw new Error('Approval failed');
      const result = await response.json();

      if (shouldPrint && settings) {
        printPOSSlip(settings, {
          title: 'Admission Deposit Receipt',
          sections: [
            {
              title: 'Patient Information',
              items: [
                { label: 'Patient Name', value: selectedRequest.patientName },
                { label: 'File Number', value: selectedRequest.patientId },
                ...(selectedRequest.isSubfile ? [{ label: 'Bearer ID', value: selectedRequest.bearerId || 'N/A' }] : []),
                { label: 'IPD Number', value: result.ipd_number || 'N/A' },
                { label: 'Ward/Room', value: wards.find(w => w.dbId.toString() === selectedWard)?.categoryName || 'General Ward' }
              ]
            },
            {
              title: 'Admission Details',
              items: [
                { label: 'Admission Fee', value: `₦${admissionFee.toLocaleString()}` },
                { label: 'Doctor', value: selectedRequest.doctor },
                { label: 'Diagnosis', value: selectedRequest.diagnosis }
              ]
            }
          ],
          footer: 'Godiya Hospital - Quality Healthcare Service'
        });
      }

      toast.success('Admission approved successfully');
      fetchData();
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
      setSelectedWard('');
      setAdmissionFee(0);
    } catch (error) {
      toast.error('Failed to approve admission');
    } finally {
      setIsApproving(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch('/api/nurse_requests.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          type: 'admission',
          id: selectedRequest.id,
          remarks: rejectionReason
        })
      });

      if (!response.ok) throw new Error('Rejection failed');

      toast.error('Admission request rejected');
      fetchData();
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject admission');
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

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = liveIpdCount; // Reflect actual live IPD patients
  const criticalCount = requests.filter(r => r.urgency === 'Critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admission Requests</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage patient admission requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search patients..."
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

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admission Requests</CardTitle>
          <CardDescription>
            Showing {filteredRequests.length} of {requests.length} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Ward Type</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <UserPlus className="w-12 h-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No admission requests found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.patientName}</p>
                          <p className="text-xs text-muted-foreground">{request.patientId}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.age}y, {request.gender}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{request.doctor}</TableCell>
                      <TableCell>{request.diagnosis}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{request.wardType}</p>
                          <p className="text-xs text-muted-foreground">{request.bedCategory}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{request.requestedDate}</p>
                          <p className="text-xs text-muted-foreground">{request.requestedTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {request.status === 'Pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApproveClick(request)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectClick(request)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleViewClick(request)}>
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

      {/* Approve Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-green-100">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Approve Admission Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Select ward and room for {selectedRequest?.patientName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Patient Details */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request ID:</span>
                  <span className="font-semibold">{selectedRequest?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient ID:</span>
                  <span className="font-semibold">{selectedRequest?.patientId}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-semibold">{selectedRequest?.patientName}</span>
                </div>
                {selectedRequest?.isSubfile && (
                  <div className="flex justify-between items-center col-span-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-semibold text-amber-800">Family File Member</span>
                    </div>
                    <span className="text-xs font-bold text-amber-900 bg-amber-200/50 px-2 py-0.5 rounded">
                      Bearer: {selectedRequest?.bearerId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age / Gender:</span>
                  <span className="font-semibold">{selectedRequest?.age}y, {selectedRequest?.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold">{selectedRequest?.phone}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Diagnosis:</span>
                  <span className="font-semibold">{selectedRequest?.diagnosis}</span>
                </div>
                {selectedRequest?.observations && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Observations:</span>
                    <span className="text-sm italic">{selectedRequest?.observations}</span>
                  </div>
                )}
                <div className="flex justify-between col-span-2 pt-1 border-t">
                  <span className="text-muted-foreground font-medium">Doctor's Remarks:</span>
                  <span className="font-semibold">{selectedRequest?.admitRemarks}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Requested By:</span>
                  <span className="font-semibold">{selectedRequest?.doctor}</span>
                </div>
              </div>
            </div>

            {/* Ward Selector */}
            <div className="space-y-2">
              <Label htmlFor="ward-select" className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                Select Ward
              </Label>
              <Select
                value={selectedWard}
                onValueChange={(value) => {
                  setSelectedWard(value);
                  setSelectedRoom('');
                  const ward = wards.find(w => w.dbId.toString() === value);
                  setAdmissionFee(ward?.pricePerDay || 0);
                }}
              >
                <SelectTrigger id="ward-select">
                  <SelectValue placeholder="Choose a ward..." />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward.dbId} value={ward.dbId.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{ward.categoryName}</span>
                        <span className="text-xs text-muted-foreground ml-4">(Available: {ward.availableBeds})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instructions */}
            {!selectedWard && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900">
                  Please select a ward to proceed with admission.
                </p>
              </div>
            )}

            {selectedWard && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-emerald-900">
                  Ward selected successfully. Click approve to finalize admission.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsApproveModalOpen(false);
                setSelectedWard('');
                setSelectedRoom('');
                setAdmissionFee(0);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => confirmApprove(false)}
              disabled={!selectedWard || isApproving}
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Approve Only
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              onClick={() => confirmApprove(true)}
              disabled={!selectedWard || isApproving}
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
              Approve & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-red-100">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Reject Admission Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Request Details */}
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Request ID:</span>
                <span className="font-semibold">{selectedRequest?.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold">{selectedRequest?.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diagnosis:</span>
                <span className="font-semibold">{selectedRequest?.diagnosis}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-900">
                Once rejected, this request will be permanently declined and cannot be recovered.
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
                placeholder="Please provide a clear reason for rejecting this admission request..."
                className="min-h-[100px] resize-none"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim()}
            >
              <X className="w-4 h-4 mr-2" />
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-full ${selectedRequest?.status === 'Approved' ? 'bg-green-100' : selectedRequest?.status === 'Rejected' ? 'bg-red-100' : 'bg-blue-100'}`}>
                <Eye className={`w-6 h-6 ${selectedRequest?.status === 'Approved' ? 'text-green-600' : selectedRequest?.status === 'Rejected' ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <DialogTitle className="text-xl">View Admission Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Detailed information about the admission request
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Request Details */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Request Information</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Request ID:</span>
                <span className="font-semibold">{selectedRequest?.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patient ID:</span>
                <span className="font-semibold">{selectedRequest?.patientId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold">{selectedRequest?.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Age / Gender:</span>
                <span className="font-semibold">{selectedRequest?.age}y, {selectedRequest?.gender}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-semibold">{selectedRequest?.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diagnosis:</span>
                <span className="font-semibold">{selectedRequest?.diagnosis}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Requested By:</span>
                <span className="font-semibold">{selectedRequest?.doctor}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ward Type:</span>
                <span className="font-semibold">{selectedRequest?.wardType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bed Category:</span>
                <span className="font-semibold">{selectedRequest?.bedCategory}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Urgency:</span>
                <span className="font-semibold">{selectedRequest?.urgency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                {selectedRequest && getStatusBadge(selectedRequest.status)}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-semibold">{selectedRequest?.requestedDate} {selectedRequest?.requestedTime}</span>
              </div>
            </div>

            {/* Approval Details - Only show if approved */}
            {selectedRequest?.status === 'Approved' && 'approvedWardName' in selectedRequest && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-3">
                  <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Approval Details
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs mb-1">Assigned Ward</span>
                      <div className="flex items-center gap-2 font-semibold text-green-900">
                        <Building2 className="w-4 h-4" />
                        {(selectedRequest as any).approvedWardName}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs mb-1">Room Number</span>
                      <div className="flex items-center gap-2 font-semibold text-green-900">
                        <Bed className="w-4 h-4" />
                        {(selectedRequest as any).approvedRoomNumber}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Admission Fee:</span>
                      <span className="text-lg font-bold text-green-700">
                        ₦{((selectedRequest as any).approvedFee || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {(selectedRequest as any).approvedDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-green-200">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Approved on {new Date((selectedRequest as any).approvedDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Success Message */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900">
                    This admission request has been approved. The patient can now be admitted to {(selectedRequest as any).approvedRoomNumber} in {(selectedRequest as any).approvedWardName}.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Rejection Info */}
            {selectedRequest?.status === 'Rejected' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-900">
                  This admission request has been rejected and cannot be processed.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}