import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { useEMRStore } from '@/app/emr/store/emr-store';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

export function EditPatientModal({ isOpen, onClose, patient }: EditPatientModalProps) {
  const { updatePatient } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    nhisNumber: '',
    schemaId: '',
  });

  // Populate form with patient data when modal opens
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        gender: patient.gender || '',
        dateOfBirth: patient.dateOfBirth || '',
        phoneNumber: patient.phoneNumber || '',
        address: patient.address || '',
        nhisNumber: patient.nhisNumber || '',
        schemaId: patient.nhisProvider || '',
      });
    }
  }, [patient]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dateOfBirth) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      updatePatient(patient.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender as 'Male' | 'Female',
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        nhisNumber: formData.nhisNumber || undefined,
        nhisProvider: formData.schemaId || undefined,
      });

      toast.success('Patient updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update patient');
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
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl z-50"
          >
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Edit Patient</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update patient information for {patient?.fullName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-foreground">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        placeholder="Enter first name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
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
                  <h3 className="font-semibold text-lg text-foreground">Contact Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Enter address"
                    />
                  </div>
                </div>

                {/* NHIS Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-foreground">NHIS Information (Optional)</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nhisNumber">NHIS Number</Label>
                      <Input
                        id="nhisNumber"
                        value={formData.nhisNumber}
                        onChange={(e) => handleChange('nhisNumber', e.target.value)}
                        placeholder="Enter NHIS number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schemaId">HMO Provider</Label>
                      <Input
                        id="schemaId"
                        value={formData.schemaId}
                        onChange={(e) => handleChange('schemaId', e.target.value)}
                        placeholder="Enter HMO provider"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> File Number ({patient?.id}) cannot be changed after registration.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Patient
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