import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
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
import type { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '@/app/emr/store/types';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export function EditAppointmentModal({ isOpen, onClose, appointment }: EditAppointmentModalProps) {
  const { updateAppointment, departments } = useEMRStore();
  
  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('Consultation');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [priority, setPriority] = useState<AppointmentPriority>('Normal');
  const [status, setStatus] = useState<AppointmentStatus>('Scheduled');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (appointment) {
      setDepartment(appointment.department);
      setDoctor(appointment.doctorName);
      setAppointmentType(appointment.appointmentType);
      setDate(appointment.date);
      setShift(appointment.time);
      setPriority(appointment.priority);
      setStatus(appointment.status);
      setNotes(appointment.notes);
    }
  }, [appointment]);

  const handleSubmit = () => {
    if (!appointment || !department || !doctor || !date || !shift) {
      toast.error('Please fill all required fields');
      return;
    }

    updateAppointment(appointment.id, {
      department,
      doctorName: doctor,
      appointmentType,
      date,
      time: shift,
      priority,
      status,
      notes,
    });

    toast.success('Appointment updated successfully');
    onClose();
  };

  if (!isOpen || !appointment) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold">Edit Appointment</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Update appointment details for {appointment.patientName}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700">Patient:</span>{' '}
                    <span className="font-medium text-blue-900">{appointment.patientName}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">File No:</span>{' '}
                    <span className="font-medium text-blue-900">{appointment.patientId}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Appt #:</span>{' '}
                    <span className="font-medium text-blue-900">{appointment.id}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select value={department} onValueChange={setDepartment}>
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

                <div className="space-y-2">
                  <Label htmlFor="doctor">
                    Doctor <span className="text-red-500">*</span>
                  </Label>
                  <Select value={doctor} onValueChange={setDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr. Aisha Mohammed">Dr. Aisha Mohammed</SelectItem>
                      <SelectItem value="Dr. Ibrahim Yusuf">Dr. Ibrahim Yusuf</SelectItem>
                      <SelectItem value="Dr. Fatima Hassan">Dr. Fatima Hassan</SelectItem>
                      <SelectItem value="Dr. Usman Abdullahi">Dr. Usman Abdullahi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select
                  value={appointmentType}
                  onValueChange={(value) => setAppointmentType(value as AppointmentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="ANC">ANC</SelectItem>
                    <SelectItem value="Immunization">Immunization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift">
                    Shift <span className="text-red-500">*</span>
                  </Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                      <SelectItem value="Afternoon">Afternoon (12:00 PM - 4:00 PM)</SelectItem>
                      <SelectItem value="Evening">Evening (4:00 PM - 8:00 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as AppointmentPriority)}
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

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as AppointmentStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[100px] px-3 py-2 border border-border rounded-md"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save Changes</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
