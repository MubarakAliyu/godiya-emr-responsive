import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Edit, Shield, UserPlus, Phone, MapPin, Calendar } from 'lucide-react';
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
import type { Patient, Gender, PatientType, FileType } from '@/app/emr/store/types';

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
    middleName: '',
    lastName: '',
    gender: '' as Gender,
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    fileType: '' as FileType,
    patientType: '' as PatientType,
    isNHIS: false,
    nhisProvider: '',
    nhisNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    nextOfKin: '',
    bloodGroup: '',
    allergies: '',
    notes: '',
    status: '' as any,
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        middleName: patient.middleName || '',
        lastName: patient.lastName,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        phoneNumber: patient.phoneNumber,
        address: patient.address,
        fileType: patient.fileType,
        patientType: patient.patientType === 'Inpatient' ? 'IPD' : 'OPD',
        isNHIS: patient.isNHIS || false,
        nhisProvider: patient.nhisProvider || '',
        nhisNumber: patient.nhisNumber || '',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactPhone: patient.emergencyContactPhone || '',
        nextOfKin: patient.nextOfKin || '',
        bloodGroup: patient.bloodGroup || '',
        allergies: patient.allergies || '',
        notes: patient.notes || '',
        status: patient.status,
      });
    }
  }, [patient]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsSubmitting(true);

    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.gender ||
      !formData.phoneNumber ||
      !formData.address ||
      !formData.fileType ||
      !formData.patientType
    ) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      updatePatient(patient.id, {
        ...formData,
        patientType: formData.patientType === 'IPD' ? 'Inpatient' : 'Outpatient'
      });

      toast.success(`Patient ${patient.fullName} updated successfully!`);
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold">Edit Patient Information</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Updating file for {patient.fullName} ({patient.id})
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form - Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Personal Information
                      </h3>

                      <div className="space-y-2">
                        <Label htmlFor="firstName">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          value={formData.middleName}
                          onChange={(e) => handleChange('middleName', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Gender <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">
                          Date of Birth (Optional)
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => handleChange('phoneNumber', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">
                          Address <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          rows={3}
                          required
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        File & Medical Information
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>File Type</Label>
                          <Select value={formData.fileType} onValueChange={(value) => handleChange('fileType', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Individual">Individual</SelectItem>
                              <SelectItem value="Family">Family</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Patient Type</Label>
                          <Select value={formData.patientType} onValueChange={(value) => handleChange('patientType', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IPD">IPD</SelectItem>
                              <SelectItem value="OPD">OPD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* NHIS Section */}
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <Label className="text-base font-medium">NHIS Enrollment</Label>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-isNHIS"
                            checked={formData.isNHIS}
                            onChange={(e) => handleChange('isNHIS', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <Label htmlFor="edit-isNHIS" className="text-sm cursor-pointer">
                            Enrolled in NHIS
                          </Label>
                        </div>

                        {formData.isNHIS && (
                          <div className="space-y-3 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor="edit-nhisProvider">Provider</Label>
                              <Input
                                id="edit-nhisProvider"
                                value={formData.nhisProvider}
                                onChange={(e) => handleChange('nhisProvider', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-nhisNumber">ID Number</Label>
                              <Input
                                id="edit-nhisNumber"
                                value={formData.nhisNumber}
                                onChange={(e) => handleChange('nhisNumber', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-emergencyContactName">Emergency Contact Name</Label>
                          <Input
                            id="edit-emergencyContactName"
                            value={formData.emergencyContactName}
                            onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-emergencyContactPhone">Emergency Contact Phone</Label>
                          <Input
                            id="edit-emergencyContactPhone"
                            value={formData.emergencyContactPhone}
                            onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-bloodGroup">Blood Group</Label>
                        <Select value={formData.bloodGroup} onValueChange={(value) => handleChange('bloodGroup', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-allergies">Allergies</Label>
                        <Textarea
                          id="edit-allergies"
                          value={formData.allergies}
                          onChange={(e) => handleChange('allergies', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-notes">Internal Notes</Label>
                        <Textarea
                          id="edit-notes"
                          value={formData.notes}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
