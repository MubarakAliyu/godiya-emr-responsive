import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import { useEMRStore } from '@/app/emr/store/emr-store';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAppointmentModal({ isOpen, onClose }: CreateAppointmentModalProps) {
  const { addAppointment, patients, doctors, departments } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    department: '',
    date: '',
    time: '',
    priority: 'Normal',
    notes: '',
    totalFee: '0',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.patientId || !formData.doctorId || !formData.department || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Direct submission without artificial delay

      const patient = patients.find(p => p.id === formData.patientId);
      const doctor = doctors.find(d => d.id === formData.doctorId);

      if (!patient || !doctor) {
        toast.error('Invalid patient or doctor selected');
        return;
      }

      addAppointment({
        patientId: formData.patientId,
        patientName: patient.fullName,
        doctorId: formData.doctorId,
        doctorName: doctor.name,
        department: formData.department,
        date: formData.date,
        time: formData.time,
        status: 'Scheduled',
        priority: formData.priority as 'Normal' | 'Urgent' | 'Emergency',
        notes: formData.notes,
        totalFee: parseFloat(formData.totalFee) || 0,
        appointmentType: 'Consultation',
        isSubfile: false
      });

      toast.success('Appointment created successfully!');

      // Reset form
      setFormData({
        patientId: '',
        doctorId: '',
        department: '',
        date: '',
        time: '',
        priority: 'Normal',
        notes: '',
        totalFee: '0',
      });

      onClose();
    } catch (error) {
      toast.error('Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            style={{ height: '100vh', width: '100vw' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Create Appointment</h2>
                  <p className="text-sm text-muted-foreground">Schedule a new patient appointment</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-6 space-y-6">
                {/* Patient Select */}
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient <span className="text-destructive">*</span></Label>
                  <Select value={formData.patientId} onValueChange={(value) => handleChange('patientId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.fullName} ({patient.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Doctor and Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctorId">Doctor <span className="text-destructive">*</span></Label>
                    <Select value={formData.doctorId} onValueChange={(value) => handleChange('doctorId', value)}>
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
                    <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time <span className="text-destructive">*</span></Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleChange('time', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority <span className="text-destructive">*</span></Label>
                    <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalFee">Consultation Amount (₦) <span className="text-destructive">*</span></Label>
                    <Input
                      id="totalFee"
                      type="number"
                      value={formData.totalFee}
                      onChange={(e) => handleChange('totalFee', e.target.value)}
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
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Add any relevant notes or instructions..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Create Appointment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}