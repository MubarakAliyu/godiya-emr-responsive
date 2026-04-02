import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import { useEMRStore } from '../../store/emr-store';
import { AppointmentType, AppointmentPriority } from '../../store/types';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: string;
}

export function CreateAppointmentModal({ isOpen, onClose, preselectedPatientId }: CreateAppointmentModalProps) {
  const { patients, subfiles, doctors, addAppointment } = useEMRStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || '',
    subfileId: '',
    appointmentType: '' as AppointmentType,
    department: '',
    doctorName: '',
    doctorId: '',
    date: '',
    time: '',
    priority: 'Normal' as AppointmentPriority,
    status: 'Scheduled' as any,
    notes: '',
    totalFee: '0',
  });

  const filteredPatients = patients.filter(p => {
    const matchesSearch = searchTerm
      ? (p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    // Strictly only paid patients as requested
    return matchesSearch && p.isPaid;
  });

  const selectedPatient = patients.find(p => p.id === formData.patientId);
  const patientSubfiles = selectedPatient?.fileType === 'Family'
    ? subfiles.filter(s => s.fileId === selectedPatient.id)
    : [];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) newErrors.patientId = 'Please select a patient';
    if (selectedPatient?.fileType === 'Family' && !formData.subfileId) {
      newErrors.subfileId = 'Please select a family member';
    }
    if (!formData.appointmentType) newErrors.appointmentType = 'Appointment type is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.doctorId) newErrors.doctorName = 'Please assign a doctor';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const doctor = doctors.find(d => d.id === formData.doctorId);

      const appointment = addAppointment({
        ...formData,
        patientId: formData.subfileId ? `SF-${formData.subfileId}` : formData.patientId,
        patientName: formData.subfileId
          ? `${patientSubfiles.find(s => s.id.toString() === formData.subfileId)?.firstName} ${patientSubfiles.find(s => s.id.toString() === formData.subfileId)?.lastName}`
          : patient.fullName,
        doctorName: doctor?.name || 'Dr. Unknown',
        isSubfile: !!formData.subfileId,
        isPaid: false, // Initial state
        totalFee: parseFloat(formData.totalFee) || 0,
      });

      toast.success(`Appointment created successfully - ${appointment.id}`);
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Failed to create appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      subfileId: '',
      appointmentType: '' as AppointmentType,
      department: '',
      doctorName: '',
      doctorId: '',
      date: '',
      time: '',
      priority: 'Normal',
      status: 'Scheduled',
      notes: '',
      totalFee: '0',
    });
    setSearchTerm('');
    setIsSuggestionsOpen(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-semibold">Create Appointment</h2>
                  <p className="text-sm text-muted-foreground mt-1">Schedule a new appointment</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <Label>Select Patient *</Label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          placeholder="Type patient name or ID..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsSuggestionsOpen(true);
                            if (formData.patientId) {
                              setFormData(prev => ({ ...prev, patientId: '', subfileId: '' }));
                            }
                          }}
                          onFocus={() => setIsSuggestionsOpen(true)}
                          className={`pl-9 border-b-0 rounded-b-none focus-visible:ring-0 ${errors.patientId ? 'border-destructive' : ''}`}
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm('');
                              setFormData(prev => ({ ...prev, patientId: '', subfileId: '' }));
                              setIsSuggestionsOpen(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {isSuggestionsOpen && searchTerm.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[110] left-0 right-0 bg-white border border-border border-t-0 rounded-b-xl shadow-xl max-h-[300px] overflow-y-auto"
                          >
                            {filteredPatients.length > 0 ? (
                              <div className="p-1">
                                {filteredPatients.map((patient) => (
                                  <button
                                    key={patient.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, patientId: patient.id, subfileId: '' }));
                                      setSearchTerm(patient.fullName);
                                      setIsSuggestionsOpen(false);
                                      setErrors(prev => ({ ...prev, patientId: '', subfileId: '' }));
                                    }}
                                    className="w-full flex flex-col items-start px-4 py-3 hover:bg-muted/50 rounded-lg transition-colors border-b last:border-0 border-muted/30"
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-semibold text-sm">{patient.fullName}</span>
                                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{patient.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[11px] text-muted-foreground">{patient.gender}</span>
                                      <span className="text-[11px] text-muted-foreground">•</span>
                                      <span className="text-[11px] text-muted-foreground">{patient.fileType} File</span>
                                      {patient.fileType === 'Family' && (
                                        <span className="ml-1 text-[9px] bg-purple-50 text-purple-600 px-1 rounded">Family</span>
                                      )}
                                    </div>
                                  </button>
                                {))}
                              </div>
                            ) : (
                              <div className="p-8 text-center bg-muted/10">
                                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground font-medium">No paid patients matching "{searchTerm}"</p>
                                <p className="text-[11px] text-muted-foreground/60 mt-1">Make sure the file is registered and paid.</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Hidden selection state indicator */}
                      {!isSuggestionsOpen && formData.patientId && (
                        <div className="h-6 flex items-center px-3 bg-green-50/50 rounded-b-xl border border-border border-t-0 -mt-px pointer-events-none">
                          <span className="text-[10px] text-green-600 font-medium">Selected: {patients.find(p => p.id === formData.patientId)?.fullName} ({formData.patientId})</span>
                        </div>
                      )}
                    </div>
                    {errors.patientId && <p className="text-sm text-destructive">{errors.patientId}</p>}
                  </div>

                  {/* Subfile Selection (if Family File) */}
                  {selectedPatient?.fileType === 'Family' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label>Select Family Member *</Label>
                      <Select
                        value={formData.subfileId}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, subfileId: value }));
                          setErrors(prev => ({ ...prev, subfileId: '' }));
                        }}
                      >
                        <SelectTrigger className={errors.subfileId ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Choose a member" />
                        </SelectTrigger>
                        <SelectContent>
                          {patientSubfiles.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id.toString()}>
                              {sub.firstName} {sub.lastName}
                            </SelectItem>
                          ))}
                          {patientSubfiles.length === 0 && (
                            <div className="p-2 text-sm text-destructive text-center">
                              No family members added to this file yet.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {errors.subfileId && <p className="text-sm text-destructive">{errors.subfileId}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Appointment Type */}
                    <div className="space-y-2">
                      <Label>Appointment Type *</Label>
                      <Select
                        value={formData.appointmentType}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, appointmentType: value as AppointmentType }));
                          setErrors(prev => ({ ...prev, appointmentType: '' }));
                        }}
                      >
                        <SelectTrigger className={errors.appointmentType ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consultation">Consultation</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                          <SelectItem value="ANC">ANC</SelectItem>
                          <SelectItem value="Immunization">Immunization</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.appointmentType && <p className="text-sm text-destructive">{errors.appointmentType}</p>}
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <Label>Department *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, department: value }));
                          setErrors(prev => ({ ...prev, department: '' }));
                        }}
                      >
                        <SelectTrigger className={errors.department ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Medicine">General Medicine</SelectItem>
                          <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                          <SelectItem value="Surgery">Surgery</SelectItem>
                          <SelectItem value="Obstetrics & Gynecology">Obstetrics & Gynecology</SelectItem>
                          <SelectItem value="Radiology">Radiology</SelectItem>
                          <SelectItem value="Family Medicine">Family Medicine</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
                    </div>

                    {/* Doctor */}
                    <div className="space-y-2">
                      <Label>Assign Doctor *</Label>
                      <Select
                        value={formData.doctorId}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, doctorId: value }));
                          setErrors(prev => ({ ...prev, doctorName: '' }));
                        }}
                      >
                        <SelectTrigger className={errors.doctorName ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.doctorName && <p className="text-sm text-destructive">{errors.doctorName}</p>}
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as AppointmentPriority }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, date: e.target.value }));
                          setErrors(prev => ({ ...prev, date: '' }));
                        }}
                        className={errors.date ? 'border-destructive' : ''}
                      />
                      {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, time: e.target.value }));
                          setErrors(prev => ({ ...prev, time: '' }));
                        }}
                        className={errors.time ? 'border-destructive' : ''}
                      />
                      {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                    </div>

                    {/* Total Fee */}
                    <div className="space-y-2">
                      <Label htmlFor="totalFee">Consultation Amount (₦) *</Label>
                      <Input
                        id="totalFee"
                        type="number"
                        value={formData.totalFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, totalFee: e.target.value }))}
                        placeholder="e.g. 10000"
                        required
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      'Create Appointment'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}