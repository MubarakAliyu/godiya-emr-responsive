import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Loader2, User, Phone, MapPin, Calendar, Shield, Heart } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
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
import { Separator } from '@/app/components/ui/separator';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterPatientModal({ isOpen, onClose }: RegisterPatientModalProps) {
  const { addPatient, addNotification } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fileType: 'Individual',
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    address: '',
    patientType: 'Outpatient',
    emergencyContactName: '',
    emergencyContactPhone: '',
    nextOfKin: '',
    bloodGroup: '',
    isNHIS: false,
    nhisNumber: '',
    nhisProvider: '',
    notes: '',
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dateOfBirth) {
      toast.error('Required Fields Missing', {
        description: 'Please fill in all required fields marked with *',
      });
      return;
    }

    // Validate NHIS fields if NHIS is enabled
    if (formData.isNHIS && !formData.nhisNumber) {
      toast.error('NHIS Number Required', {
        description: 'Please enter NHIS number for NHIS patients',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPatient = addPatient({
        fileType: formData.fileType as 'Individual' | 'Family',
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender as 'Male' | 'Female',
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        patientType: formData.patientType === 'Inpatient' ? 'Inpatient' : 'Outpatient',
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        nextOfKin: formData.nextOfKin,
        isNHIS: formData.isNHIS,
        nhisNumber: formData.isNHIS ? formData.nhisNumber : undefined,
        nhisProvider: formData.isNHIS ? formData.nhisProvider : undefined,
        notes: formData.notes,
        status: 'Active',
        isDead: false,
      });

      // Note: The backend auto-creates the initial subfile for Family files.
      // The store refreshes subfiles with the correct real IDs after the API confirms.


      toast.success('Patient Registered Successfully!', {
        description: `File Number: ${newPatient.id} - ${newPatient.fullName}`,
      });

      addNotification({
        type: 'success',
        category: 'clinical',
        module: 'Patients',
        icon: 'UserPlus',
        title: 'New Patient Registered',
        description: `${newPatient.fullName} (${newPatient.id}) has been registered in the system`,
      });

      // Reset form
      setFormData({
        fileType: 'Individual',
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        phoneNumber: '',
        email: '',
        address: '',
        patientType: 'Outpatient',
        emergencyContactName: '',
        emergencyContactPhone: '',
        nextOfKin: '',
        bloodGroup: '',
        isNHIS: false,
        nhisNumber: '',
        nhisProvider: '',
        notes: '',
      });

      onClose();
    } catch (error) {
      toast.error('Registration Failed', {
        description: 'Failed to register patient. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Register New Patient</h2>
                  <p className="text-sm text-muted-foreground">Add a new patient to the hospital system</p>
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
                {/* File Type & Patient Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="patientType">Patient Type <span className="text-destructive">*</span></Label>
                    <Select value={formData.patientType} onValueChange={(value) => handleChange('patientType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Outpatient">OPD (Outpatient)</SelectItem>
                        <SelectItem value="Inpatient">IPD (Inpatient)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Personal Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                  </div>

                  <div className="space-y-4">
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

                    {/* Gender, DOB, Blood Group */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <Label htmlFor="dateOfBirth">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Date of Birth <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Select value={formData.bloodGroup} onValueChange={(value) => handleChange('bloodGroup', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                  </div>

                  <div className="space-y-4">
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
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="patient@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Enter residential address"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Emergency Contact */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                        <Input
                          id="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                          placeholder="+234 XXX XXX XXXX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nextOfKin">Next of Kin</Label>
                      <Input
                        id="nextOfKin"
                        value={formData.nextOfKin}
                        onChange={(e) => handleChange('nextOfKin', e.target.value)}
                        placeholder="Enter next of kin name"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* NHIS Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">NHIS Information</h3>
                  </div>

                  <div className="space-y-4">
                    {/* NHIS Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-primary" />
                        <div>
                          <Label htmlFor="isNHIS" className="text-base font-semibold cursor-pointer">
                            NHIS Patient
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enable if patient is enrolled in National Health Insurance Scheme
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="isNHIS"
                        checked={formData.isNHIS}
                        onCheckedChange={(checked) => handleChange('isNHIS', checked)}
                      />
                    </div>

                    {/* NHIS Fields - Show only when enabled */}
                    {formData.isNHIS && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nhisNumber">
                              NHIS Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="nhisNumber"
                              value={formData.nhisNumber}
                              onChange={(e) => handleChange('nhisNumber', e.target.value)}
                              placeholder="Enter NHIS number"
                              required={formData.isNHIS}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nhisProvider">HMO Provider</Label>
                            <Select
                              value={formData.nhisProvider}
                              onValueChange={(value) => handleChange('nhisProvider', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select HMO provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Hygeia HMO">Hygeia HMO</SelectItem>
                                <SelectItem value="Avon Healthcare">Avon Healthcare</SelectItem>
                                <SelectItem value="Total Health Trust">Total Health Trust</SelectItem>
                                <SelectItem value="Integrated Healthcare">Integrated Healthcare</SelectItem>
                                <SelectItem value="Reliance HMO">Reliance HMO</SelectItem>
                                <SelectItem value="AXA Mansard">AXA Mansard</SelectItem>
                                <SelectItem value="MetroHealth HMO">MetroHealth HMO</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <p className="text-xs text-blue-800">
                            <strong>Note:</strong> NHIS patients may have different billing procedures. Ensure all NHIS information is accurate.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Enter any additional notes or medical history..."
                    rows={3}
                  />
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <strong>📋 File Number Generation:</strong> A unique File Number (GH-MMYY-XXXXX) will be automatically generated upon successful registration.
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
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering Patient...
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