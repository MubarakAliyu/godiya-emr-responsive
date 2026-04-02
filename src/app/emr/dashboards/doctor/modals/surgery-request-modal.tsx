import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Activity, Scissors, Users, Clock, ClipboardList } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
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

interface SurgeryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    surgeryType: string;
    remarks: string;
  }) => void;
  patientData: any;
}

export function SurgeryRequestModal({
  isOpen,
  onClose,
  onConfirm,
  patientData,
}: SurgeryRequestModalProps) {
  const [surgeryType, setSurgeryType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!surgeryType || !remarks.trim()) {
      toast.error('Missing Information', {
        description: 'Please provide both surgery type and remarks',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm({
        surgeryType,
        remarks,
      });
      setIsSubmitting(false);
      setSurgeryType('');
      setRemarks('');
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Scissors className="w-6 h-6 text-primary" />
            Surgery Request
          </DialogTitle>
          <DialogDescription>
            Submit surgery request for {patientData?.fullName || patientData?.patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Surgery Type */}
          <div className="space-y-2">
            <Label htmlFor="surgeryType">
              Surgery Type <span className="text-destructive">*</span>
            </Label>
            <Input
              id="surgeryType"
              placeholder="Enter surgery type (e.g. Appendectomy)"
              value={surgeryType}
              onChange={(e) => setSurgeryType(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Surgery Remarks / Clinical Notes <span className="text-destructive">*</span></Label>
            <Textarea
              id="remarks"
              placeholder="Enter clinical reasons, urgency, and any special requirements..."
              rows={6}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="resize-none"
            />
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
                <Scissors className="w-4 h-4 mr-2" />
                Submit Surgery Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
