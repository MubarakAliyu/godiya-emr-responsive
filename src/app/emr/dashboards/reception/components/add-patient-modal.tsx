import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Loader2 } from 'lucide-react';
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

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPatientModal({ isOpen, onClose }: AddPatientModalProps) {
  const { addPatient } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fileType: 'Individual',
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    nhisNumber: '',
    schemaId: '',
  });

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
      // Direct submission without artificial delay

      const newPatient = addPatient({
        fileType: formData.fileType as 'Individual' | 'Family',
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender as 'Male' | 'Female',
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        department: 'General',
        status: 'Alive',
        nhisNumber: formData.nhisNumber || undefined,
        schemaId: formData.schemaId || undefined,
        admissionType: 'OPD',
      });

      // Note: The backend auto-creates the initial subfile for Family files.
      // The store refreshes subfiles with the correct real IDs after the API confirms.


      toast.success(`Patient registered successfully! File No: ${newPatient.id}`);

      // Reset form
      setFormData({
        fileType: 'Individual',
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        phoneNumber: '',
        address: '',
        nhisNumber: '',
        schemaId: '',
      });

      onClose();
    } catch (error) {
      toast.error('Failed to register patient');
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
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Add New Patient</h2>
                  <p className="text-sm text-muted-foreground">Register a new patient in the system</p>
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
                {/* File Type */}
                <div className="space-y-2">
                  <Label htmlFor="fileType">File Type <span className="text-destructive">*</span></Label>
                  <Select value={formData.fileType} onValueChange={(value) => handleChange('fileType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                {/* Gender and DOB */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
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
                    <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      placeholder="+234 XXX XXX XXXX"
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

                {/* NHIS and Schema */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="schemaId">Schema ID</Label>
                    <Input
                      id="schemaId"
                      value={formData.schemaId}
                      onChange={(e) => handleChange('schemaId', e.target.value)}
                      placeholder="Enter schema ID"
                    />
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> A unique File Number (GH-PT-XXXXX) will be automatically generated upon registration.
                  </p>
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
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Register Patient
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