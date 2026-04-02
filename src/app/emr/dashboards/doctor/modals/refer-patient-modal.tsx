import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Activity, Building2, Phone } from 'lucide-react';
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

interface ReferPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    receivingHospital: string;
    remarks: string;
  }) => void;
  patientData: any;
}

export function ReferPatientModal({
  isOpen,
  onClose,
  onConfirm,
  patientData,
}: ReferPatientModalProps) {
  const [receivingHospital, setReceivingHospital] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!receivingHospital || !remarks.trim()) {
      toast.error('Missing Information', {
        description: 'Please provide both hospital and remarks',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm({
        receivingHospital,
        remarks,
      });
      setIsSubmitting(false);
      setReceivingHospital('');
      setRemarks('');
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Send className="w-6 h-6 text-primary" />
            Refer Patient
          </DialogTitle>
          <DialogDescription>
            Submit external hospital referral for {patientData?.fullName || patientData?.patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="receivingHospital">
              Receiving Hospital <span className="text-destructive">*</span>
            </Label>
            <Input
              id="receivingHospital"
              placeholder="Enter hospital name"
              value={receivingHospital}
              onChange={(e) => setReceivingHospital(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Referral Remarks / Clinical Summary <span className="text-destructive">*</span></Label>
            <Textarea
              id="remarks"
              placeholder="Enter clinical summary and reason for referral..."
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
                <Send className="w-4 h-4 mr-2" />
                Submit Referral Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
