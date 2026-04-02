import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, UserX, Users, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Patient } from '../store/types';

// Delete File Confirmation Modal
interface DeleteFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (reason: string) => void;
  patient: Patient | null;
}

export function DeleteFileModal({ isOpen, onClose, onDelete, patient }: DeleteFileModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Reason for deletion is required');
      return;
    }
    onDelete(reason);
    setReason('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
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
            onClick={handleClose}
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
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Delete Patient File</h2>
                    <p className="text-sm text-muted-foreground">
                      {patient.id} - {patient.fullName}
                    </p>
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
              <div className="p-6 space-y-4">
                {/* Warning */}
                <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <h3 className="font-medium text-destructive">Warning: This action cannot be undone!</h3>
                    <div className="text-sm text-destructive/90 space-y-1">
                      <p>Deleting this patient file will:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Permanently remove all patient information</li>
                        <li>Delete all associated appointments</li>
                        <li>Remove billing and invoice history</li>
                        <li>Clear all medical records and prescriptions</li>
                        <li>Remove all lab results and reports</li>
                      </ul>
                      <p className="font-medium mt-2">This action is irreversible.</p>
                    </div>
                  </div>
                </div>

                {/* Reason Field */}
                <div className="space-y-2">
                  <Label htmlFor="delete-reason" className="text-sm font-medium">
                    Reason for Deletion <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="delete-reason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setError('');
                    }}
                    placeholder="Please provide a detailed reason for deleting this patient file..."
                    rows={4}
                    className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSubmit}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete File
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Record as Dead Modal
interface RecordAsDeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordAsDeceased: (dateOfDeath: string, causeOfDeath: string, remarks: string) => void;
  patient: Patient | null;
}

export function RecordAsDeadModal({ isOpen, onClose, onRecordAsDeceased, patient }: RecordAsDeadModalProps) {
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!dateOfDeath) {
      newErrors.dateOfDeath = 'Date of death is required';
    }
    if (!causeOfDeath.trim()) {
      newErrors.causeOfDeath = 'Cause of death is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    onRecordAsDeceased(dateOfDeath, causeOfDeath, remarks);
    handleClose();
  };

  const handleClose = () => {
    setDateOfDeath('');
    setCauseOfDeath('');
    setRemarks('');
    setErrors({});
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <UserX className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Record Patient as Deceased</h2>
                    <p className="text-sm text-muted-foreground">
                      {patient.id} - {patient.fullName}
                    </p>
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
              <div className="p-6 space-y-4">
                {/* Date of Death */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfDeath" className="text-sm font-medium">
                    Date of Death <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dateOfDeath"
                    type="date"
                    value={dateOfDeath}
                    onChange={(e) => {
                      setDateOfDeath(e.target.value);
                      setErrors({ ...errors, dateOfDeath: '' });
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.dateOfDeath ? 'border-destructive' : ''}
                  />
                  {errors.dateOfDeath && (
                    <p className="text-sm text-destructive">{errors.dateOfDeath}</p>
                  )}
                </div>

                {/* Cause of Death */}
                <div className="space-y-2">
                  <Label htmlFor="causeOfDeath" className="text-sm font-medium">
                    Cause of Death <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="causeOfDeath"
                    value={causeOfDeath}
                    onChange={(e) => {
                      setCauseOfDeath(e.target.value);
                      setErrors({ ...errors, causeOfDeath: '' });
                    }}
                    placeholder="e.g., Cardiac arrest, Malaria complications, etc."
                    className={errors.causeOfDeath ? 'border-destructive' : ''}
                  />
                  {errors.causeOfDeath && (
                    <p className="text-sm text-destructive">{errors.causeOfDeath}</p>
                  )}
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="deathRemarks" className="text-sm font-medium">
                    Additional Remarks (Optional)
                  </Label>
                  <Textarea
                    id="deathRemarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any additional information about the circumstances..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="gap-2 bg-foreground hover:bg-foreground/90"
                >
                  <UserX className="w-4 h-4" />
                  Record as Deceased
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// View Family Subfiles Modal
interface ViewSubfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyFile: Patient | null;
  subfiles: Patient[];
  onViewFile: (fileNo: string) => void;
}

export function ViewSubfilesModal({ isOpen, onClose, familyFile, subfiles, onViewFile }: ViewSubfilesModalProps) {
  if (!familyFile) return null;

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status: string, isDeceased?: boolean) => {
    if (isDeceased) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Deceased</Badge>;
    }

    const variants: Record<string, any> = {
      Active: { className: 'bg-green-100 text-green-700 hover:bg-green-100 text-xs' },
      Admitted: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs' },
      ICU: { className: 'bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs' },
      Discharged: { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs' },
    };

    return <Badge {...(variants[status] || variants.Active)}>{status}</Badge>;
  };

  const getRelationshipBadge = (relationship?: string) => {
    if (!relationship) return <span className="text-muted-foreground text-xs">-</span>;
    
    const colors: Record<string, string> = {
      'Self': 'bg-purple-100 text-purple-700',
      'Spouse': 'bg-pink-100 text-pink-700',
      'Child': 'bg-blue-100 text-blue-700',
      'Parent': 'bg-green-100 text-green-700',
      'Sibling': 'bg-yellow-100 text-yellow-700',
      'Other': 'bg-gray-100 text-gray-700',
    };

    const colorClass = colors[relationship] || colors['Other'];
    return <Badge className={`${colorClass} hover:${colorClass} text-xs`}>{relationship}</Badge>;
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Family Subfiles</h2>
                    <p className="text-sm text-muted-foreground">
                      {familyFile.id} - {familyFile.fullName} ({subfiles.length} member{subfiles.length !== 1 ? 's' : ''})
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Table */}
              <div className="flex-1 overflow-y-auto">
                {subfiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No family members found</p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">S/N</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">File No</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Full Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Relationship</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Gender</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Age</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Patient Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {subfiles.map((subfile, index) => (
                            <motion.tr
                              key={subfile.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm">{index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium text-blue-600">{subfile.id}</td>
                              <td className="px-4 py-3 text-sm font-medium">{subfile.fullName}</td>
                              <td className="px-4 py-3">{getRelationshipBadge(subfile.relationshipToHead)}</td>
                              <td className="px-4 py-3 text-sm">{subfile.gender}</td>
                              <td className="px-4 py-3 text-sm">
                                {subfile.dateOfBirth ? `${getAge(subfile.dateOfBirth)} years` : subfile.age ? `${subfile.age} years` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Badge variant="outline" className="text-xs">{subfile.patientType}</Badge>
                              </td>
                              <td className="px-4 py-3">{getStatusBadge(subfile.status, subfile.isDead)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      onViewFile(subfile.id);
                                      onClose();
                                    }}
                                    className="text-xs gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View File
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 p-6 border-t bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Showing {subfiles.length} family member{subfiles.length !== 1 ? 's' : ''}
                </p>
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