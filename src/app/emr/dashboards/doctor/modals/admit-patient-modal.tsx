import { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Activity, Bed } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { toast } from 'sonner';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    remarks: string;
  }) => void;
  patientData: any;
}

export function AdmitPatientModal({
  isOpen,
  onClose,
  onConfirm,
  patientData,
}: AdmitPatientModalProps) {
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!remarks.trim()) {
      toast.error('Remarks Required', {
        description: 'Please enter admission remarks',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm({
        remarks,
      });
      setIsSubmitting(false);
      setRemarks('');
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Admit Patient
          </DialogTitle>
          <DialogDescription>
            Submit admission request for {patientData?.fullName || patientData?.patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Admission Remarks / Clinical Notes</Label>
            <Textarea
              id="remarks"
              placeholder="Enter diagnosis, treatment plan, special requirements, etc."
              rows={6}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Include important information about the patient's condition or special requirements
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-secondary hover:bg-secondary/90"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <Activity className="w-4 h-4" />
                </motion.div>
                Processing...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Submit Admission Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
