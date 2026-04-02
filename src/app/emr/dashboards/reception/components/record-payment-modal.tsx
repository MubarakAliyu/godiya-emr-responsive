import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Loader2, Printer } from 'lucide-react';
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
import { Checkbox } from '@/app/components/ui/checkbox';
import { toast } from 'sonner';
import { useEMRStore } from '@/app/emr/store/emr-store';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordPaymentModal({ isOpen, onClose }: RecordPaymentModalProps) {
  const { addPayment, patients } = useEMRStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    serviceType: '',
    amount: '',
    paymentMethod: '',
    printReceipt: true,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.patientId || !formData.serviceType || !formData.amount || !formData.paymentMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const patient = patients.find(p => p.id === formData.patientId);

      if (!patient) {
        toast.error('Invalid patient selected');
        return;
      }

      const newInvoice = addPayment({
        patient_unique_id: formData.patientId,
        amount_expected: amount,
        amount_paid: amount,
        payment_method: formData.paymentMethod,
        payment_description: formData.serviceType,
        reference_id: `REC-${Date.now()}`,
      });

      if (formData.printReceipt) {
        toast.success(`Payment recorded! Receipt ${newInvoice.receiptId} ready to print.`);
      } else {
        toast.success('Payment recorded successfully!');
      }

      // Reset form
      setFormData({
        patientId: '',
        serviceType: '',
        amount: '',
        paymentMethod: '',
        printReceipt: true,
      });

      onClose();
    } catch (error) {
      toast.error('Failed to record payment');
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
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Record Payment</h2>
                  <p className="text-sm text-muted-foreground">Process patient payment and generate receipt</p>
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
                {/* Patient Select */}
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient File Number <span className="text-destructive">*</span></Label>
                  <Select value={formData.patientId} onValueChange={(value) => handleChange('patientId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.slice(0, 20).map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.fullName} ({patient.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Type */}
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type <span className="text-destructive">*</span></Label>
                  <Select value={formData.serviceType} onValueChange={(value) => handleChange('serviceType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Laboratory">Laboratory Tests</SelectItem>
                      <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="Surgery">Surgery</SelectItem>
                      <SelectItem value="Admission">Admission Fee</SelectItem>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="Other">Other Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦) <span className="text-destructive">*</span></Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method <span className="text-destructive">*</span></Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleChange('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card (POS)</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="NHIS">NHIS</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Print Receipt Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                  <Checkbox
                    id="printReceipt"
                    checked={formData.printReceipt}
                    onCheckedChange={(checked) => handleChange('printReceipt', checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="printReceipt" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-muted-foreground" />
                        <span>Print receipt after payment</span>
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate and print receipt immediately after recording payment
                    </p>
                  </div>
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
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Record Payment
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