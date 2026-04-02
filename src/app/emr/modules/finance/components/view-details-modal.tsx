import { motion, AnimatePresence } from 'motion/react';
import { X, Receipt, User, CreditCard, Calendar, Printer } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import type { Invoice, Patient } from '@/app/emr/store/types';
import { format, parseISO } from 'date-fns';

interface ViewDetailsModalProps {
  invoice: Invoice;
  patient?: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewDetailsModal({ invoice, patient, isOpen, onClose }: ViewDetailsModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
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
            className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Transaction Details</h2>
                <p className="text-sm text-muted-foreground">Complete transaction information</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Transaction Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receipt No</p>
                    <p className="font-mono font-semibold">{invoice.receiptId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Type</p>
                    <Badge variant="outline">{invoice.invoiceType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Invoice ID</p>
                    <p className="font-mono text-sm">{invoice.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                    <p className="text-sm">{format(parseISO(invoice.dateCreated), 'MMM dd, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(invoice.dateCreated), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-100">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Patient Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                    <p className="font-semibold">{invoice.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">File Number</p>
                    <p className="font-mono text-sm">{patient?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                    <p className="text-sm">{patient?.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient Type</p>
                    <Badge variant="outline">{patient?.patientType || 'N/A'}</Badge>
                  </div>
                </div>
              </div>

              {/* Processing Info */}
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">Processing Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Staff Name</p>
                    <p className="font-semibold">Super Admin</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Department</p>
                    <p className="text-sm">Finance</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                    <p className="text-sm">Cash</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                    <Badge
                      className={
                        invoice.paymentStatus === 'Paid'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : invoice.paymentStatus === 'Partial'
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                          : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200'
                      }
                    >
                      {invoice.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="bg-gradient-to-r from-blue-600 to-primary rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Total Amount</p>
                    <p className="text-4xl font-bold">₦{invoice.amount.toLocaleString()}</p>
                  </div>
                  <Calendar className="w-12 h-12 opacity-50" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-muted/50 border-t border-border px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print Receipt
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}