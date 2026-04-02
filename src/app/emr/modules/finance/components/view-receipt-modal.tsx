import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Printer } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { Invoice, Patient } from '@/app/emr/store/types';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface ViewReceiptModalProps {
  invoice: Invoice;
  patient?: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewReceiptModal({ invoice, patient, isOpen, onClose }: ViewReceiptModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    toast.success('Receipt ready to print');
  };

  const handleDownloadPDF = () => {
    toast.success('PDF download started');
    // In a real implementation, you would generate and download the PDF here
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
              <h2 className="text-2xl font-bold text-foreground">Receipt</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Receipt Content - Thermal Print Style */}
            <div className="p-8">
              <div className="max-w-md mx-auto bg-white border-2 border-dashed border-gray-300 p-8 rounded-lg font-mono">
                {/* Hospital Header */}
                <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
                  <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">GH</span>
                  </div>
                  <h1 className="text-xl font-bold mb-1">GODIYA HOSPITAL</h1>
                  <p className="text-xs text-muted-foreground">No. 2 Sani Abacha Way</p>
                  <p className="text-xs text-muted-foreground">Birnin Kebbi, Kebbi State</p>
                  <p className="text-xs text-muted-foreground">Tel: +234 803 456 7890</p>
                </div>

                {/* Receipt Title */}
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold mb-1">PAYMENT RECEIPT</h2>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(invoice.dateCreated), 'MMMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(invoice.dateCreated), 'hh:mm a')}
                  </p>
                </div>

                {/* Receipt Details */}
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-muted-foreground">Receipt No:</span>
                    <span className="font-bold">{invoice.receiptId}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-muted-foreground">Patient Name:</span>
                    <span className="font-semibold">{invoice.patientName}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-muted-foreground">File No:</span>
                    <span className="font-semibold">{patient?.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-muted-foreground">Service Type:</span>
                    <span className="font-semibold">{invoice.invoiceType}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-semibold">Cash</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold">{invoice.paymentStatus}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL AMOUNT:</span>
                    <span className="text-2xl font-bold text-primary">
                      ₦{invoice.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Service Breakdown */}
                <div className="mb-6 text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-2">{invoice.invoiceType}</td>
                        <td className="text-right py-2">₦{invoice.amount.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-gray-300 pt-4 text-center">
                  <p className="text-xs mb-2">Cashier: Super Admin</p>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <p className="text-xs font-semibold mb-2">Thank you for choosing Godiya Hospital</p>
                    <p className="text-xs text-muted-foreground">For your health and wellness</p>
                  </div>
                  
                  {/* Signature Line */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-end text-xs">
                      <div>
                        <div className="border-b border-gray-400 w-32 mb-1"></div>
                        <p>Patient Signature</p>
                      </div>
                      <div>
                        <div className="border-b border-gray-400 w-32 mb-1"></div>
                        <p>Cashier Signature</p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="mt-6 flex justify-center">
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">QR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-muted/50 border-t border-border px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
