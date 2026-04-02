import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { Patient, PatientType, PatientStatus, Gender } from '@/app/emr/store/types';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function EditPatientModal({ isOpen, onClose, patient }: EditPatientModalProps) {
  const { updatePatient } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '' as Gender,
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    patientType: '' as PatientType,
    status: '' as PatientStatus,
    emergencyContactName: '',
    emergencyContactPhone: '',
    nextOfKin: '',
    notes: '',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        phoneNumber: patient.phoneNumber,
        address: patient.address,
        patientType: patient.patientType,
        status: patient.status,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        nextOfKin: patient.nextOfKin,
        notes: patient.notes,
      });
    }
  }, [patient]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    
    setIsSubmitting(true);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.gender || 
        !formData.dateOfBirth || !formData.phoneNumber || !formData.address ||
        !formData.patientType || !formData.status || !formData.emergencyContactName ||
        !formData.emergencyContactPhone || !formData.nextOfKin) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      updatePatient(patient.id, formData);
      
      toast.success(`Patient ${formData.firstName} ${formData.lastName} updated successfully!`);
      
      onClose();
    } catch (error) {
      toast.error('Failed to update patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patient) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-xl shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold">Edit Patient File</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update patient information</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Patient ID Badge */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Patient ID (File No)</p>
                  <p className="text-lg font-semibold font-mono">{patient.id}</p>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Home Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Patient Type & Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Patient Classification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient Type *</Label>
                      <Select value={formData.patientType} onValueChange={(value) => handleChange('patientType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inpatient">Inpatient</SelectItem>
                          <SelectItem value="Outpatient">Outpatient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status *</Label>
                      <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Admitted">Admitted</SelectItem>
                          <SelectItem value="Discharged">Discharged</SelectItem>
                          <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                      <Input
                        id="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKin">Next of Kin *</Label>
                    <Input
                      id="nextOfKin"
                      value={formData.nextOfKin}
                      onChange={(e) => handleChange('nextOfKin', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Medical Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Medical Notes</h3>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Enter any additional medical notes or information..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Patient File'}
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