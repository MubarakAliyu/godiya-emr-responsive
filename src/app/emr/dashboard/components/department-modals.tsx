import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Plus, Edit, Trash2, AlertTriangle, Building, Ban, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import type { Department, DepartmentType, DepartmentStatus } from '../../store/types';
import { format } from 'date-fns';

// View Department Modal
interface ViewDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
}

export function ViewDepartmentModal({ isOpen, onClose, department }: ViewDepartmentModalProps) {
  if (!department) return null;

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Department Details</h2>
                    <p className="text-sm text-muted-foreground">{department.id}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Department Info */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Department Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{department.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ID</p>
                      <p className="font-medium">{department.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge variant={department.type === 'Clinical' ? 'default' : 'secondary'}>
                        {department.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={department.status === 'Active' ? 'default' : 'secondary'}>
                        {department.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm text-foreground">{department.description}</p>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Staff Count</p>
                      <p className="text-2xl font-semibold">{department.staffCount}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Active Staff</p>
                      <p className="text-2xl font-semibold">{department.staffCount}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium">
                        {format(new Date(department.lastUpdated), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Add Department Modal
interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: DepartmentType;
    description: string;
    staffCount: number;
    status: DepartmentStatus;
    icon?: string;
  }) => void;
  existingDepartments: Department[];
}

export function AddDepartmentModal({ isOpen, onClose, onSubmit, existingDepartments }: AddDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Clinical' as DepartmentType,
    description: '',
    staffCount: 0,
    status: 'Active' as DepartmentStatus,
    icon: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (existingDepartments.some(d => d.name.toLowerCase() === formData.name.trim().toLowerCase())) {
      newErrors.name = 'Department already exists';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'Clinical',
      description: '',
      staffCount: 0,
      status: 'Active',
      icon: '',
    });
    setErrors({});
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Add New Department</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">
                        Department Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setErrors({ ...errors, name: '' });
                        }}
                        placeholder="e.g., Laboratory"
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="type">
                        Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value as DepartmentType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Clinical">Clinical</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">
                        Status <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value as DepartmentStatus })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          setErrors({ ...errors, description: '' });
                        }}
                        placeholder="Brief description of the department"
                        rows={5}
                        className={errors.description ? 'border-destructive' : ''}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive mt-1">{errors.description}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="icon">Icon (Optional)</Label>
                      <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="e.g., Pill, FlaskConical"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Department
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Edit Department Modal
interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: DepartmentType;
    description: string;
    staffCount: number;
    status: DepartmentStatus;
    icon?: string;
  }) => void;
  department: Department | null;
  existingDepartments: Department[];
}

export function EditDepartmentModal({
  isOpen,
  onClose,
  onSubmit,
  department,
  existingDepartments,
}: EditDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    type: (department?.type || 'Clinical') as DepartmentType,
    description: department?.description || '',
    staffCount: department?.staffCount || 0,
    status: (department?.status || 'Active') as DepartmentStatus,
    icon: department?.icon || '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update form when department changes
  useState(() => {
    if (department) {
      setFormData({
        name: department.name,
        type: department.type,
        description: department.description,
        staffCount: department.staffCount,
        status: department.status,
        icon: department.icon || '',
      });
    }
  });

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (
      existingDepartments.some(
        (d) => d.name.toLowerCase() === formData.name.trim().toLowerCase() && d.id !== department?.id
      )
    ) {
      newErrors.name = 'Department already exists';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!department) return null;

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
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Edit className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Edit Department</h2>
                    <p className="text-sm text-muted-foreground">{department.id}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">
                        Department Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setErrors({ ...errors, name: '' });
                        }}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="type">
                        Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value as DepartmentType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Clinical">Clinical</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">
                        Status <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value as DepartmentStatus })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          setErrors({ ...errors, description: '' });
                        }}
                        rows={5}
                        className={errors.description ? 'border-destructive' : ''}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive mt-1">{errors.description}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="icon">Icon (Optional)</Label>
                      <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="e.g., Pill, FlaskConical"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="gap-2">
                  <Edit className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Delete Department Modal
interface DeleteDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  department: Department | null;
}

export function DeleteDepartmentModal({ isOpen, onClose, onConfirm, department }: DeleteDepartmentModalProps) {
  if (!department) return null;

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-destructive/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Delete Department?</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-destructive/90">
                      Deleting this department will remove its assignments. Staff will become unassigned.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Department:</p>
                    <p className="font-medium">{department.name}</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">Staff Affected:</p>
                    <p className="font-medium">{department.staffCount} staff members</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Deactivate Department Modal
interface DeactivateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  department: Department | null;
}

export function DeactivateDepartmentModal({ isOpen, onClose, onConfirm, department }: DeactivateDepartmentModalProps) {
  if (!department) return null;

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-orange-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Ban className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Deactivate Department?</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-orange-900">
                      Are you sure you want to deactivate this department? This action will:
                    </p>
                    <ul className="text-sm text-orange-900 list-disc list-inside space-y-1 ml-2">
                      <li>Set department status to <strong>Inactive</strong></li>
                      <li>Prevent new staff assignments</li>
                      <li>Hide from active department listings</li>
                      <li>Retain all historical data</li>
                    </ul>
                    <p className="text-sm text-orange-900 font-medium mt-2">
                      You can reactivate this department later if needed.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Department:</p>
                      <p className="font-medium">{department.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">ID:</p>
                      <p className="font-medium">{department.id}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Type:</p>
                      <Badge variant={department.type === 'Clinical' ? 'default' : 'secondary'}>
                        {department.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Current Staff:</p>
                      <p className="font-medium">{department.staffCount} members</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <Ban className="w-4 h-4" />
                  Deactivate
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Reactivate Department Modal
interface ReactivateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  department: Department | null;
}

export function ReactivateDepartmentModal({ isOpen, onClose, onConfirm, department }: ReactivateDepartmentModalProps) {
  if (!department) return null;

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Reactivate Department?</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-green-900">
                      Reactivating this department will:
                    </p>
                    <ul className="text-sm text-green-900 list-disc list-inside space-y-1 ml-2">
                      <li>Set department status to <strong>Active</strong></li>
                      <li>Allow new staff assignments</li>
                      <li>Show in active department listings</li>
                      <li>Resume normal operations</li>
                    </ul>
                    <p className="text-sm text-green-900 font-medium mt-2">
                      All historical data will remain intact.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Department:</p>
                      <p className="font-medium">{department.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">ID:</p>
                      <p className="font-medium">{department.id}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Type:</p>
                      <Badge variant={department.type === 'Clinical' ? 'default' : 'secondary'}>
                        {department.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Current Staff:</p>
                      <p className="font-medium">{department.staffCount} members</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reactivate
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}