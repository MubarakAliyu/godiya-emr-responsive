import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity, Search, Eye, Check, X, Filter, Calendar, Clock,
  FileText, AlertCircle, ChevronDown, User, Phone, MapPin,
  Building2, ArrowRight, Stethoscope, Ambulance
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

// Mock referral requests data - Updated with external hospital referrals
const mockReferrals = [
  {
    id: 'REF-001',
    patientId: 'GH-2024-012',
    patientName: 'Fatima Garba',
    age: 38,
    gender: 'Female',
    phone: '08012345678',
    fromDoctor: 'Dr. Umar Ibrahim',
    fromDepartment: 'General Medicine',
    referralType: 'External',
    hospitalReferredTo: 'Federal Medical Centre, Sokoto',
    hospitalContact: '+234 803 456 7890',
    doctorNote: 'Patient requires specialized cardiac intervention not available at our facility. ECG shows abnormal patterns requiring immediate specialist attention.',
    reason: 'Suspected Cardiac Arrhythmia - Requires Specialist Cardiologist',
    transportNotes: 'Ambulance required with cardiac monitoring equipment. Patient should be accompanied by nurse.',
    urgency: 'High',
    status: 'Pending',
    date: '2024-02-11',
    time: '10:45 AM',
  },
  {
    id: 'REF-002',
    patientId: 'GH-2024-034',
    patientName: 'Suleiman Bello',
    age: 52,
    gender: 'Male',
    phone: '08098765432',
    fromDoctor: 'Dr. Fatima Hassan',
    fromDepartment: 'Emergency',
    referralType: 'External',
    hospitalReferredTo: 'Usmanu Danfodiyo University Teaching Hospital',
    hospitalContact: '+234 806 123 4567',
    doctorNote: 'Multiple compound fractures requiring orthopedic surgery. Patient has been stabilized but requires advanced surgical intervention.',
    reason: 'Complex Orthopedic Surgery - Compound Fractures',
    transportNotes: 'Critical transport needed. Patient should remain immobilized. Pain management ongoing.',
    urgency: 'Critical',
    status: 'Pending',
    date: '2024-02-11',
    time: '11:20 AM',
  },
  {
    id: 'REF-003',
    patientId: 'GH-2024-056',
    patientName: 'Maryam Yusuf',
    age: 29,
    gender: 'Female',
    phone: '08087654321',
    fromDoctor: 'Dr. Musa Ahmed',
    fromDepartment: 'Obstetrics',
    referralType: 'External',
    hospitalReferredTo: 'National Hospital, Abuja',
    hospitalContact: '+234 809 876 5432',
    doctorNote: 'High-risk pregnancy with complications. Requires NICU facilities for premature delivery management.',
    reason: 'High-Risk Pregnancy - Premature Labor',
    transportNotes: 'Immediate air ambulance recommended. Patient is 32 weeks pregnant with preeclampsia.',
    urgency: 'Critical',
    status: 'Accepted',
    date: '2024-02-11',
    time: '09:30 AM',
  },
  {
    id: 'REF-004',
    patientId: 'GH-2024-078',
    patientName: 'Ibrahim Musa',
    age: 45,
    gender: 'Male',
    phone: '08076543210',
    fromDoctor: 'Dr. Ahmed Suleiman',
    fromDepartment: 'Internal Medicine',
    referralType: 'External',
    hospitalReferredTo: 'Aminu Kano Teaching Hospital',
    hospitalContact: '+234 802 345 6789',
    doctorNote: 'Patient showing signs of advanced liver disease. Requires hepatology specialist consultation and possible transplant evaluation.',
    reason: 'Advanced Liver Disease - Specialist Hepatology Consultation',
    transportNotes: 'Standard ambulance transport. Patient stable but requires monitoring.',
    urgency: 'Medium',
    status: 'Pending',
    date: '2024-02-10',
    time: '02:15 PM',
  },
];

export function NurseReferrals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/nurse_requests.php?type=referral&status=pending');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      // Map API data to component format
      const mappedReferrals = data.map((item: any) => ({
        id: item.rs_id,
        patientId: item.patient_unique_id,
        patientName: item.patient_name,
        age: calculateAge(item.dob),
        gender: item.gender,
        phone: item.phone_number,
        fromDoctor: 'Assigned Physician',
        fromDepartment: 'Clinical',
        referralType: 'External',
        hospitalReferredTo: item.rs_referto,
        hospitalContact: 'N/A',
        diagnosis: item.consultation_diagnosis || 'Pending',
        observations: item.consultation_observations || '',
        doctorNote: item.rs_remarks,
        reason: item.rs_remarks,
        transportNotes: 'N/A',
        urgency: 'Medium',
        status: 'Pending',
        date: item.rs_datetime.split(' ')[0],
        time: item.rs_datetime.split(' ')[1],
      }));
      setReferrals(mappedReferrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Could not load referral requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      const matchesSearch =
        referral.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        referral.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        referral.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        referral.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'all' || referral.urgency === urgencyFilter;

      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [referrals, searchQuery, statusFilter, urgencyFilter]);

  const handleAcceptClick = (referral: any) => {
    setSelectedReferral(referral);
    setAcceptanceNotes('');
    setIsAcceptModalOpen(true);
  };

  const handleRejectClick = (referral: any) => {
    setSelectedReferral(referral);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleViewClick = (referral: any) => {
    setSelectedReferral(referral);
    setIsViewModalOpen(true);
  };

  const confirmAccept = async () => {
    if (!selectedReferral) return;

    try {
      const response = await fetch('/api/nurse_requests.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          type: 'referral',
          id: selectedReferral.id,
          remarks: acceptanceNotes || 'Approved'
        })
      });

      if (!response.ok) throw new Error('Approval failed');

      toast.success('Referral request accepted successfully');
      fetchReferrals();
      setIsAcceptModalOpen(false);
      setSelectedReferral(null);
      setAcceptanceNotes('');
    } catch (error) {
      toast.error('Failed to approve referral');
    }
  };

  const confirmReject = async () => {
    if (!selectedReferral || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch('/api/nurse_requests.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          type: 'referral',
          id: selectedReferral.id,
          remarks: rejectionReason
        })
      });

      if (!response.ok) throw new Error('Rejection failed');

      toast.error('Referral request rejected');
      fetchReferrals();
      setIsRejectModalOpen(false);
      setSelectedReferral(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject referral');
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
      Accepted: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
    };
    return (
      <Badge className={`${variants[status as keyof typeof variants]} hover:${variants[status as keyof typeof variants]}`}>
        {status}
      </Badge>
    );
  };

  const pendingCount = referrals.filter(r => r.status === 'Pending').length;
  const acceptedCount = referrals.filter(r => r.status === 'Accepted').length;
  const criticalCount = referrals.filter(r => r.urgency === 'Critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Referral Requests</h1>
        <p className="text-muted-foreground mt-1">
          Manage external hospital referral requests
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
                  <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                  <p className="text-2xl font-bold">{acceptedCount}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold">{referrals.length}</p>
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
          <CardTitle>Filter Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search referrals..."
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
                <SelectItem value="Accepted">Accepted</SelectItem>
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

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Requests</CardTitle>
          <CardDescription>
            Showing {filteredReferrals.length} of {referrals.length} referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To Hospital</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Activity className="w-12 h-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No referral requests found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferrals.map((referral, index) => (
                    <motion.tr
                      key={referral.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{referral.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.patientName}</p>
                          <p className="text-xs text-muted-foreground">{referral.patientId}</p>
                          <p className="text-xs text-muted-foreground">
                            {referral.age}y, {referral.gender}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{referral.fromDoctor}</p>
                          <p className="text-xs text-muted-foreground">{referral.fromDepartment}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm">{referral.hospitalReferredTo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm truncate">{referral.reason}</p>
                      </TableCell>
                      <TableCell>{getUrgencyBadge(referral.urgency)}</TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{referral.date}</p>
                          <p className="text-xs text-muted-foreground">{referral.time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {referral.status === 'Pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleAcceptClick(referral)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectClick(referral)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleViewClick(referral)}>
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

      {/* Accept Referral Modal - ENHANCED */}
      <Dialog open={isAcceptModalOpen} onOpenChange={setIsAcceptModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-green-100">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Accept Referral Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Review referral details for {selectedReferral?.patientName}
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
                  <span className="font-semibold">{selectedReferral?.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold">{selectedReferral?.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age / Gender:</span>
                  <span className="font-semibold">{selectedReferral?.age}y, {selectedReferral?.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold">{selectedReferral?.phone}</span>
                </div>
              </div>
            </div>

            {/* Doctor's Note */}
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 space-y-2">
              <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Doctor's Note
              </h3>
              <p className="text-sm text-purple-900 leading-relaxed">{selectedReferral?.doctorNote}</p>
              <div className="pt-2 border-t border-purple-200 flex justify-between text-xs">
                <span className="text-muted-foreground">Referring Doctor:</span>
                <span className="font-semibold text-purple-900">{selectedReferral?.fromDoctor}</span>
              </div>
            </div>

            {/* Hospital Referred To */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
              <h3 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Referral Destination
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hospital:</span>
                  <span className="font-semibold text-emerald-900">{selectedReferral?.hospitalReferredTo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Contact:</span>
                  <div className="flex items-center gap-1 font-semibold text-emerald-900">
                    <Phone className="w-3 h-3" />
                    <span>{selectedReferral?.hospitalContact}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason for Referral */}
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 space-y-2">
              <h3 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Reason for Referral
              </h3>
              <p className="text-sm text-orange-900 font-medium">{selectedReferral?.reason}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-orange-200">
                <span className="text-xs text-muted-foreground">Urgency Level:</span>
                {selectedReferral && getUrgencyBadge(selectedReferral.urgency)}
              </div>
            </div>

            {/* Transport Notes */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
              <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Ambulance className="w-4 h-4" />
                Transport Notes
              </h3>
              <p className="text-sm text-amber-900 leading-relaxed">{selectedReferral?.transportNotes}</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAcceptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={confirmAccept}
            >
              <Check className="w-4 h-4 mr-2" />
              Accept Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Referral Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-red-100">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Reject Referral Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Referral Details */}
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Referral ID:</span>
                <span className="font-semibold">{selectedReferral?.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold">{selectedReferral?.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reason:</span>
                <span className="font-semibold">{selectedReferral?.reason}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-900">
                Once rejected, this referral will be permanently declined and cannot be recovered.
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
                placeholder="Please provide a clear reason for rejecting this referral request..."
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
              Reject Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Referral Modal - ENHANCED */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-full ${selectedReferral?.status === 'Accepted' ? 'bg-green-100' : 'bg-blue-100'}`}>
                <Eye className={`w-6 h-6 ${selectedReferral?.status === 'Accepted' ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <DialogTitle className="text-xl">View Referral Request</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Complete details for {selectedReferral?.patientName}
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
                  <span className="font-semibold">{selectedReferral?.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold">{selectedReferral?.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age / Gender:</span>
                  <span className="font-semibold">{selectedReferral?.age}y, {selectedReferral?.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold">{selectedReferral?.phone}</span>
                </div>
              </div>
            </div>

            {/* Doctor's Note */}
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 space-y-2">
              <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Doctor's Note
              </h3>
              <p className="text-sm text-purple-900 leading-relaxed">{selectedReferral?.doctorNote}</p>
              <div className="pt-2 border-t border-purple-200 flex justify-between text-xs">
                <span className="text-muted-foreground">Referring Doctor:</span>
                <span className="font-semibold text-purple-900">{selectedReferral?.fromDoctor}</span>
              </div>
            </div>

            {/* Hospital Referred To */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
              <h3 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Referral Destination
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hospital:</span>
                  <span className="font-semibold text-emerald-900">{selectedReferral?.hospitalReferredTo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Contact:</span>
                  <div className="flex items-center gap-1 font-semibold text-emerald-900">
                    <Phone className="w-3 h-3" />
                    <span>{selectedReferral?.hospitalContact}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason for Referral */}
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 space-y-2">
              <h3 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Reason for Referral
              </h3>
              <p className="text-sm text-orange-900 font-medium">{selectedReferral?.reason}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-orange-200">
                <span className="text-xs text-muted-foreground">Urgency Level:</span>
                {selectedReferral && getUrgencyBadge(selectedReferral.urgency)}
              </div>
            </div>

            {/* Transport Notes */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
              <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Ambulance className="w-4 h-4" />
                Transport Notes
              </h3>
              <p className="text-sm text-amber-900 leading-relaxed">{selectedReferral?.transportNotes}</p>
            </div>

            {/* Approval Details Badge - Only if Accepted */}
            {selectedReferral?.status === 'Accepted' && 'acceptedDate' in selectedReferral && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-green-50 border-2 border-green-300 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-900">Referral Approved</h3>
                </div>
                <p className="text-sm text-green-800">
                  This referral has been approved and the patient can be transferred to {selectedReferral.hospitalReferredTo}.
                </p>
                <div className="flex items-center gap-2 text-xs text-green-700 pt-2 border-t border-green-200">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Approved on {new Date((selectedReferral as any).acceptedDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Rejection Badge */}
            {selectedReferral?.status === 'Rejected' && (
              <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-900">Referral Rejected</h3>
                </div>
                <p className="text-sm text-red-800 mt-2">
                  This referral request has been rejected and cannot be processed.
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
