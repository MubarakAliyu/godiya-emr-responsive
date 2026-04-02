import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Skull, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { Patient } from '@/app/emr/store/types';

interface DeceasedModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function DeceasedModal({ isOpen, onClose, patient }: DeceasedModalProps) {
  const { markPatientAsDeceased } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    dateOfDeath: new Date().toISOString().split('T')[0],
    causeOfDeath: '',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsSubmitting(true);

    if (!formData.dateOfDeath || !formData.causeOfDeath) {
      toast.error('Please provide date and cause of death');
      setIsSubmitting(false);
      return;
    }

    try {
      markPatientAsDeceased(patient.id, formData.dateOfDeath, formData.causeOfDeath, formData.notes);

      toast.success(`Patient ${patient.fullName} has been marked as deceased`, {
        description: 'Status updated in all records',
      });

      // Reset form
      setFormData({
        dateOfDeath: new Date().toISOString().split('T')[0],
        causeOfDeath: '',
        notes: '',
      });

      onClose();
    } catch (error) {
      toast.error('Failed to update patient status');
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <Skull className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Mark Patient as Deceased</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-orange-900">
                        You are about to mark{' '}
                        <strong className="font-semibold">{patient.fullName}</strong> as deceased. This will
                        update their status across all records.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfDeath">
                      Date of Death <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dateOfDeath"
                      type="date"
                      value={formData.dateOfDeath}
                      onChange={(e) => handleChange('dateOfDeath', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="causeOfDeath">
                      Cause of Death <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="causeOfDeath"
                      value={formData.causeOfDeath}
                      onChange={(e) => handleChange('causeOfDeath', e.target.value)}
                      placeholder="e.g., Cardiac arrest, Natural causes..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Any additional information (optional)"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Confirm Deceased'}
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
