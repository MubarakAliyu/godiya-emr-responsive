import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
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
import { PatientType, Gender } from '../../store/types';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPatientModal({ isOpen, onClose }: AddPatientModalProps) {
  const { addPatient } = useEMRStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '' as Gender,
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    patientType: '' as PatientType,
    status: 'Active' as any,
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
    nextOfKin: '',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (formData.phoneNumber && formData.phoneNumber.length < 11) newErrors.phoneNumber = 'Phone number must be at least 11 digits';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.patientType) newErrors.patientType = 'Patient type is required';
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';

    // Check if date of birth is not in the future
    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = 'Date of birth cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const patient = addPatient(formData);
      toast.success(`Patient added successfully - ${patient.id}`);
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Failed to add patient');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '' as Gender,
      dateOfBirth: '',
      phoneNumber: '',
      address: '',
      patientType: '' as PatientType,
      status: 'Active',
      emergencyContactName: '',
      emergencyContactPhone: '',
      notes: '',
      nextOfKin: '',
    });
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-semibold">Add New Patient</h2>
                  <p className="text-sm text-muted-foreground mt-1">Register a new patient in the system</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, firstName: e.target.value }));
                        setErrors(prev => ({ ...prev, firstName: '' }));
                      }}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, lastName: e.target.value }));
                        setErrors(prev => ({ ...prev, lastName: '' }));
                      }}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, gender: value as Gender }));
                        setErrors(prev => ({ ...prev, gender: '' }));
                      }}
                    >
                      <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }));
                        setErrors(prev => ({ ...prev, dateOfBirth: '' }));
                      }}
                      className={errors.dateOfBirth ? 'border-destructive' : ''}
                    />
                    {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, phoneNumber: e.target.value }));
                        setErrors(prev => ({ ...prev, phoneNumber: '' }));
                      }}
                      placeholder="08012345678"
                      className={errors.phoneNumber ? 'border-destructive' : ''}
                    />
                    {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
                  </div>

                  {/* Patient Type */}
                  <div className="space-y-2">
                    <Label>Patient Type *</Label>
                    <Select
                      value={formData.patientType}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, patientType: value as PatientType }));
                        setErrors(prev => ({ ...prev, patientType: '' }));
                      }}
                    >
                      <SelectTrigger className={errors.patientType ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select patient type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Outpatient">Outpatient</SelectItem>
                        <SelectItem value="Inpatient">Inpatient</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.patientType && <p className="text-sm text-destructive">{errors.patientType}</p>}
                  </div>

                  {/* Address */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, address: e.target.value }));
                        setErrors(prev => ({ ...prev, address: '' }));
                      }}
                      placeholder="Patient's full address"
                      className={errors.address ? 'border-destructive' : ''}
                    />
                    {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                  </div>

                  {/* Emergency Contact Name */}
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, emergencyContactName: e.target.value, nextOfKin: e.target.value }));
                        setErrors(prev => ({ ...prev, emergencyContactName: '' }));
                      }}
                      className={errors.emergencyContactName ? 'border-destructive' : ''}
                    />
                    {errors.emergencyContactName && <p className="text-sm text-destructive">{errors.emergencyContactName}</p>}
                  </div>

                  {/* Emergency Contact Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }));
                        setErrors(prev => ({ ...prev, emergencyContactPhone: '' }));
                      }}
                      placeholder="08012345678"
                      className={errors.emergencyContactPhone ? 'border-destructive' : ''}
                    />
                    {errors.emergencyContactPhone && <p className="text-sm text-destructive">{errors.emergencyContactPhone}</p>}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about the patient"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding Patient...
                      </div>
                    ) : (
                      'Add Patient'
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