import { useState, useEffect, useRef } from 'react';
import { X, Upload, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
import type { Staff, StaffDepartment, StaffRole, EmploymentType, StaffStatus, Gender } from '@/app/emr/store/types';

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

export function EditStaffModal({ isOpen, onClose, staff }: EditStaffModalProps) {
  const { updateStaff, departments, roles } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '' as Gender,
    email: '',
    phoneNumber: '',
    address: '',
    department: '',
    departmentId: undefined as number | undefined,
    role: '',
    employmentType: '',
    dateJoined: '',
    status: '' as StaffStatus,
    profilePhoto: '',
    salary: 0,
    dateOfBirth: '',
    qualification: '',
    licenseNumber: '',
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        firstName: staff.firstName,
        middleName: staff.middleName || '',
        lastName: staff.lastName,
        gender: staff.gender,
        email: staff.email,
        phoneNumber: staff.phoneNumber,
        address: staff.address,
        department: staff.department,
        departmentId: staff.departmentId,
        role: staff.role,
        employmentType: staff.employmentType,
        dateJoined: staff.dateJoined ? staff.dateJoined.split('T')[0] : '',
        status: staff.status,
        profilePhoto: staff.profilePhoto || '',
        salary: staff.salary || 0,
        dateOfBirth: staff.dateOfBirth || '',
        qualification: staff.qualification || '',
        licenseNumber: staff.licenseNumber || '',
      });
    }
  }, [staff]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB');
      return;
    }

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch('/api/upload.php', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (response.ok) {
        handleChange('profilePhoto', result.url);
        toast.success('Photo uploaded successfully');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    setIsSubmitting(true);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.gender ||
      !formData.email || !formData.phoneNumber || !formData.address ||
      !formData.department || !formData.role || !formData.employmentType || !formData.status) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      updateStaff(staff.id, formData);

      toast.success(`Staff member ${formData.firstName} ${formData.lastName} updated successfully!`);

      onClose();
    } catch (error) {
      toast.error('Failed to update staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!staff) return null;

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold">Edit Staff Member</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update staff member information</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Staff ID Badge */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Staff ID</p>
                    <p className="text-lg font-semibold">{staff.id}</p>
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="flex flex-col items-center gap-4 pb-4 border-b border-border">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center relative overflow-hidden group">
                      {formData.profilePhoto ? (
                        <img src={formData.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.profilePhoto ? 'Change Photo' : 'Upload Photo (Optional)'}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          value={formData.middleName}
                          onChange={(e) => handleChange('middleName', e.target.value)}
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
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => handleChange('phoneNumber', e.target.value)}
                          required
                        />
                      </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Monthly Salary *</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={formData.salary}
                          onChange={(e) => handleChange('salary', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateJoined">Date Joined *</Label>
                        <Input
                          id="dateJoined"
                          type="date"
                          value={formData.dateJoined}
                          onChange={(e) => handleChange('dateJoined', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Employment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Department *</Label>
                        <Select
                          value={formData.departmentId?.toString()}
                          onValueChange={(value) => {
                            const dept = departments.find(d => d.dbId?.toString() === value);
                            setFormData(prev => ({
                              ...prev,
                              departmentId: parseInt(value),
                              department: dept?.name || ''
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.dbId?.toString() || ''}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Role *</Label>
                        <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.roleName}>
                                {role.roleName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="qualification">Qualification *</Label>
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => handleChange('qualification', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">Professional License Number</Label>
                        <Input
                          id="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={(e) => handleChange('licenseNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Employment Type *</Label>
                        <Select value={formData.employmentType} onValueChange={(value) => handleChange('employmentType', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
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
                            <SelectItem value="On Leave">On Leave</SelectItem>
                            <SelectItem value="Suspended">Suspended</SelectItem>
                            <SelectItem value="Resigned">Resigned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                </form>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex items-center justify-end gap-3 z-10">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Updating...' : 'Update Staff Member'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}