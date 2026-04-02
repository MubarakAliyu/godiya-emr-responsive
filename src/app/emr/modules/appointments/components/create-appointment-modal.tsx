import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Stethoscope, AlertCircle, Search, DollarSign } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { AppointmentType, AppointmentPriority } from '@/app/emr/store/types';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAppointmentModal({ isOpen, onClose }: CreateAppointmentModalProps) {
  const { patients, subfiles, doctors, departments, addAppointment } = useEMRStore();

  const [activeTab, setActiveTab] = useState<'basic' | 'scheduling'>('basic');

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedSubfileId, setSelectedSubfileId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('Consultation');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [priority, setPriority] = useState<AppointmentPriority>('Normal');
  const [notes, setNotes] = useState('');
  const [doctorFee, setDoctorFee] = useState('10000');

  const resetForm = () => {
    setSelectedPatientId('');
    setSelectedSubfileId('');
    setSearchTerm('');
    setIsSuggestionsOpen(false);
    setDepartment('');
    setDoctor('');
    setAppointmentType('Consultation');
    setDate('');
    setShift('');
    setPriority('Normal');
    setNotes('');
    setDoctorFee('10000');
    setActiveTab('basic');
  };

  const handleSubmit = () => {
    const patientObj = patients.find(p => p.id === selectedPatientId);
    const isFamily = patientObj?.fileType === 'Family';

    if (!selectedPatientId || (isFamily && !selectedSubfileId) || !department || !doctor || !date || !shift) {
      toast.error('Please fill all required fields');
      return;
    }

    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) {
      toast.error('Patient not found');
      return;
    }

    const subfile = isFamily ? subfiles.find(s => s.id.toString() === selectedSubfileId) : null;

    addAppointment({
      id: `GH-AP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      patientId: isFamily ? `SF-${selectedSubfileId}` : patient.id,
      patientName: isFamily ? `${subfile?.firstName} ${subfile?.lastName}` : patient.fullName,
      appointmentType,
      department,
      doctorName: doctors.find(d => d.id === doctor)?.name || doctor,
      doctorId: doctor,
      date,
      time: shift,
      shift,
      priority,
      status: 'Scheduled',
      notes,
      totalFee: parseFloat(doctorFee || '0') + 1000,
      isSubfile: isFamily
    });

    toast.success('Appointment created successfully');
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const filteredPatients = patients.filter(p => {
    const matchesSearch = searchTerm
      ? (p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    return matchesSearch && p.isPaid;
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Appointment</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  New consultation booking and fee setting
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                1. Basic Info & Fee
              </button>
              <button
                onClick={() => setActiveTab('scheduling')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'scheduling'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                2. Scheduling
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Fee Section - CRITICAL REQUEST */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-blue-900">Consultation Fee Configuration</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="doctorFee" className="text-blue-900 font-semibold">Doctor's Consultation Fee (₦)</Label>
                        <Input
                          id="doctorFee"
                          type="number"
                          value={doctorFee}
                          onChange={(e) => setDoctorFee(e.target.value)}
                          placeholder="e.g. 10000"
                          className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-lg font-mono"
                        />
                        <p className="text-[10px] text-blue-700 italic">Enter the amount to be charged for the doctor's visit.</p>
                      </div>

                      <div className="space-y-2 p-3 bg-white/80 rounded-lg border border-blue-100 flex flex-col justify-center">
                        <div className="flex justify-between text-xs text-blue-700">
                          <span>Base Hospital Fee:</span>
                          <span className="font-medium">₦1,000</span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-700">
                          <span>Doctor Fee (Fixed Above):</span>
                          <span className="font-medium">₦{parseInt(doctorFee || '0').toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-blue-100 mt-2">
                          <span className="text-blue-900">Total Billable Fee:</span>
                          <span className="text-blue-600 font-mono">₦{(parseInt(doctorFee || '0') + 1000).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="patient" className="font-semibold">
                      Search Patient <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search File No or Name..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsSuggestionsOpen(true);
                        }}
                        onFocus={() => setIsSuggestionsOpen(true)}
                        className="pl-9"
                      />
                    </div>

                    <AnimatePresence>
                      {isSuggestionsOpen && searchTerm.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto"
                        >
                          {filteredPatients.length > 0 ? (
                            <div className="p-1">
                              {filteredPatients.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPatientId(p.id);
                                    setSearchTerm(p.fullName);
                                    setIsSuggestionsOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-md transition-colors border-b last:border-0"
                                >
                                  <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm">{p.fullName}</p>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.id}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">No matching patients found</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {selectedPatient && (
                    <div className="space-y-4">
                      {selectedPatient.fileType === 'Family' && (
                        <div className="space-y-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <Label htmlFor="subfile" className="text-purple-900 font-semibold uppercase text-[10px] tracking-wider">
                            Select Family Member <span className="text-red-500">*</span>
                          </Label>
                          <Select value={selectedSubfileId} onValueChange={setSelectedSubfileId}>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Choose member" />
                            </SelectTrigger>
                            <SelectContent>
                              {subfiles.filter(s => s.fileId === selectedPatient.id).map((sub) => (
                                <SelectItem key={sub.id} value={sub.id.toString()}>
                                  {sub.firstName} {sub.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doctor">Doctor <span className="text-red-500">*</span></Label>
                      <Select value={doctor} onValueChange={setDoctor}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {doctors.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'scheduling' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shift">Shift <span className="text-red-500">*</span></Label>
                      <Select value={shift} onValueChange={setShift}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Afternoon">Afternoon</SelectItem>
                          <SelectItem value="Evening">Evening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Appointment Type</Label>
                    <Select value={appointmentType} onValueChange={(v) => setAppointmentType(v as AppointmentType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consultation">Consultation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as AppointmentPriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Clinical Notes</Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[100px] px-3 py-2 border border-border rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-gray-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Total Payment Due:</span>
                <span className="text-xl font-black text-gray-900">₦{(parseInt(doctorFee || '0') + 1000).toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                {activeTab === 'basic' ? (
                  <Button onClick={() => setActiveTab('scheduling')} className="bg-blue-600 hover:bg-blue-700">Next Step</Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 px-8">Complete Booking</Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
