import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import type { Invoice } from '@/app/emr/store/types';
import { toast } from 'sonner';

interface RefundModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export function RefundModal({ invoice, isOpen, onClose }: RefundModalProps) {
  const [refundAmount, setRefundAmount] = useState(invoice.amount.toString());
  const [refundReason, setRefundReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!refundReason.trim()) {
      toast.error('Please provide a refund reason');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > invoice.amount) {
      toast.error('Invalid refund amount');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Refund processed successfully');
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-xl max-w-lg w-full"
          >
            {/* Header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Confirm Refund?</h2>
                  <p className="text-sm text-muted-foreground">This action will process a refund</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Invoice Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Receipt No:</span>
                  <span className="font-mono font-semibold text-sm">{invoice.receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Patient:</span>
                  <span className="font-semibold text-sm">{invoice.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Original Amount:</span>
                  <span className="font-bold text-sm">₦{invoice.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Refund Amount */}
              <div className="space-y-2">
                <Label htmlFor="refundAmount" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Refund Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    id="refundAmount"
                    type="number"
                    placeholder="0.00"
                    className="pl-8"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={invoice.amount}
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum refund: ₦{invoice.amount.toLocaleString()}
                </p>
              </div>

              {/* Refund Reason */}
              <div className="space-y-2">
                <Label htmlFor="refundReason">
                  Refund Reason <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="refundReason"
                  placeholder="e.g., Service not provided, Duplicate payment"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any additional information about this refund..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900 mb-1">Important Notice</p>
                  <p className="text-xs text-yellow-800">
                    This refund will be permanently recorded in the financial system. Please ensure all
                    information is accurate before proceeding.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Confirm Refund
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
