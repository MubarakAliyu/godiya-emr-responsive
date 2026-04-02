import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, ArrowLeft, Bed, Calendar, CheckCircle, CheckCircle2, ClipboardList, Clock, DollarSign, Download, Droplets, Edit, Eye, FileText, FlaskConical, Heart, MapPin, Phone, Pill, Plus, Scissors, Shield, Skull, Stethoscope, Syringe, Trash2, TrendingUp, User, UserPlus, Users, X, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Appointment, Invoice } from '@/app/emr/store/types';
import {
  vipPatientId,
  vipPatientKPIs,
  vipVitalsData,
  vipConsultations,
  vipMedicalHistory,
  vipAdmissionsData,
  vipPrescriptionsData,
  vipNurseNotes,
  vipLabTests,
  vipFindings,
} from '@/app/emr/modules/patients/vip-patient-data';

const formatDate = (dateString: string | undefined, formatStr: string = 'MMM dd, yyyy') => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
};

const calculateAge = (dob: string | undefined): number | string => {
  if (!dob) return 'N/A';
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 'N/A';
    return new Date().getFullYear() - birthDate.getFullYear();
  } catch {
    return 'N/A';
  }
};

// KPI Mini Card Component
function KPIMiniCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{title}</p>
              <h3 className="text-2xl font-semibold">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// View Appointment Details Modal
function ViewAppointmentModal({ isOpen, onClose, appointment }: { isOpen: boolean; onClose: () => void; appointment: Appointment | null }) {
  if (!appointment) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Appointment Details</h2>
                    <p className="text-sm text-muted-foreground">ID: {appointment.id}</p>
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
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                    <p className="font-medium">{appointment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient ID</p>
                    <p className="font-medium">{appointment.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Appointment Type</p>
                    <Badge variant="outline">{appointment.appointmentType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge>{appointment.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Department</p>
                    <p className="font-medium">{appointment.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Doctor</p>
                    <p className="font-medium">{appointment.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="font-medium">{formatDate(appointment.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time</p>
                    <p className="font-medium">{appointment.time}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Priority</p>
                    <Badge variant={appointment.priority === 'Critical' ? 'destructive' : 'default'}>
                      {appointment.priority}
                    </Badge>
                  </div>
                  {appointment.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="font-medium">{appointment.notes}</p>
                    </div>
                  )}
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

// View Invoice Modal with PDF Download
function ViewInvoiceModal({ isOpen, onClose, invoice }: { isOpen: boolean; onClose: () => void; invoice: Invoice | null }) {
  if (!invoice) return null;

  const handlePrintPOS = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>POS Receipt</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
            .header { text-align: center; margin-bottom: 10px; }
            .hospital-name { font-size: 16px; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .details { margin-bottom: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            .amount { font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">GODIYA HOSPITAL</div>
            <div>Birnin Kebbi, Kebbi State</div>
            <div>Official Receipt</div>
          </div>
          <div class="divider"></div>
          <div class="details">
            <div><strong>Receipt #:</strong> ${invoice.receiptId}</div>
            <div><strong>Date:</strong> ${formatDate(invoice.dateCreated, 'MMM dd, yyyy HH:mm')}</div>
            <div><strong>Patient:</strong> ${invoice.patientName}</div>
            <div><strong>ID:</strong> ${invoice.patientId}</div>
          </div>
          <div class="divider"></div>
          <div class="details">
            <div><strong>Type:</strong> ${invoice.invoiceType}</div>
            <div class="amount"><strong>Total:</strong> ₦${invoice.amount.toLocaleString()}</div>
            <div class="amount"><strong>Paid:</strong> ₦${(invoice.amountPaid || 0).toLocaleString()}</div>
            <div><strong>Balance:</strong> ₦${(invoice.amount - (invoice.amountPaid || 0)).toLocaleString()}</div>
          </div>
          <div class="divider"></div>
          <div class="details">
            <div><strong>Method:</strong> ${invoice.paymentMethod || 'N/A'}</div>
          </div>
          <div class="footer">
            <p>Thank you for choosing Godiya Hospital</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Invoice Details</h2>
                    <p className="text-sm text-muted-foreground">Receipt: {invoice.receiptId}</p>
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
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
                    <p className="font-medium">{invoice.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patient ID</p>
                    <p className="font-medium">{invoice.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Invoice Type</p>
                    <Badge variant="outline">{invoice.invoiceType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                    <Badge
                      variant={
                        invoice.paymentStatus === 'Paid' ? 'default' :
                          invoice.paymentStatus === 'Partial' ? 'secondary' :
                            'destructive'
                      }
                    >
                      {invoice.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date Created</p>
                    <p className="font-medium">{formatDate(invoice.dateCreated)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-green-600">₦{invoice.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                    <p className="font-medium">₦{(invoice.amountPaid || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Balance</p>
                    <p className="font-medium text-orange-600">₦{(invoice.amount - (invoice.amountPaid || 0)).toLocaleString()}</p>
                  </div>
                  {invoice.paymentMethod && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                      <p className="font-medium">{invoice.paymentMethod}</p>
                    </div>
                  )}
                  {invoice.paymentDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
                      <p className="font-medium">{formatDate(invoice.paymentDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handlePrintPOS} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Print POS Receipt
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// View Lab Result Modal
function ViewLabResultModal({ isOpen, onClose, result, patient }: { isOpen: boolean; onClose: () => void; result: any; patient: any }) {
  if (!result) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Lab Result Report - ${result.result_id || result.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .hospital-name { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .report-title { font-size: 18px; font-weight: bold; margin-top: 10px; color: #3b82f6; text-transform: uppercase; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb; font-size: 13px; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .summary-section { margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .technician-signature { margin-top: 40px; display: flex; justify-content: flex-end; }
            .signature-box { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">GODIYA HOSPITAL</div>
            <div>Birnin Kebbi, Kebbi State, Nigeria</div>
            <div class="report-title">Laboratory Investigation Report</div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-item">
                <div class="label">Patient Name</div>
                <div class="value">${patient?.fullName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Patient ID</div>
                <div class="value">${patient?.id || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Gender / Age</div>
                <div class="value">${patient?.gender || 'N/A'} / ${patient?.age || 'N/A'} yrs</div>
              </div>
            </div>
            <div>
              <div class="info-item">
                <div class="label">Report Date</div>
                <div class="value">${new Date(result.result_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-item">
                <div class="label">Report ID</div>
                <div class="value">LAB-${result.result_id || result.id}</div>
              </div>
              <div class="info-item">
                <div class="label">Invoice ID</div>
                <div class="value">${result.lab_invoice_id || 'N/A'}</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Investigation (Test)</th>
                <th>Result / Finding</th>
                <th>Reference Range / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${Array.isArray(result.result_list) ? result.result_list.map((item: any) => `
                <tr>
                  <td><strong>${item.test_name || 'Test'}</strong></td>
                  <td>${item.result || item.value || 'N/A'}</td>
                  <td>${item.summary || '-'}</td>
                </tr>
              `).join('') : '<tr><td colspan="3">No test data available</td></tr>'}
            </tbody>
          </table>

          ${result.result_summary ? `
            <div class="summary-section">
              <div class="label" style="margin-bottom: 10px;">Technician's Summary & Remarks</div>
              <div class="value" style="font-weight: 400; font-style: italic;">${result.result_summary}</div>
            </div>
          ` : ''}

          <div class="technician-signature">
            <div>
              <div class="label" style="text-align: right; margin-bottom: 40px;">Certified By</div>
              <div class="signature-box">
                <div class="value">${result.technician_name || 'Laboratory Staff'}</div>
                <div class="label" style="font-size: 10px;">Technician Signature</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is a computer-generated report. Valid only with official stamp and signature.</p>
            <p>Printed on ${new Date().toLocaleString()}</p>
          </div>

          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FlaskConical className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Lab Investigation Report</DialogTitle>
                <DialogDescription>
                  Report ID: LAB-{result.result_id || result.id} • Date: {new Date(result.result_date).toLocaleDateString()}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-xl border">
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Patient Name</Label>
                <p className="font-semibold">{patient?.fullName}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Patient ID</Label>
                <p className="font-mono font-medium text-sm text-primary">{patient?.id}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Gender / Age</Label>
                <p className="font-medium">{patient?.gender} / {patient?.age} yrs</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Invoice Reference</Label>
                <p className="font-medium">#{result.lab_invoice_id}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Certified By</Label>
                <p className="font-medium">{result.technician_name || 'Laboratory Staff'}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Report Status</Label>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified & Completed</Badge>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Test Findings
            </h3>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Test Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Result</th>
                    <th className="px-4 py-3 text-left font-semibold">Remarks/Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Array.isArray(result.result_list) && result.result_list.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.test_name || 'Test'}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-primary">{item.result || item.value || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.summary || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          {result.result_summary && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Technical Remarks
              </h3>
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                <p className="text-sm leading-relaxed text-orange-900 italic whitespace-pre-wrap">
                  "{result.result_summary}"
                </p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {result.result_pictures && Object.keys(result.result_pictures).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-blue-700">
                <Download className="w-5 h-5" />
                Evidence & Visual Results
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(result.result_pictures).map(([name, path]: [string, any]) => {
                  const isPDF = typeof path === 'string' && path.toLowerCase().endsWith('.pdf');
                  const isDataURL = typeof path === 'string' && path.startsWith('data:');
                  const src = isDataURL ? path : `/api/uploads/${path}`;
                  return (
                    <div key={name} className="border rounded-xl overflow-hidden p-2 bg-muted/10 group relative">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 px-1">{name}</p>
                      {isPDF ? (
                        <Button asChild variant="outline" size="sm" className="w-full gap-2 border-dashed">
                          <a href={src} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4" />
                            View Document
                          </a>
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <img src={src} alt={name} className="w-full h-40 object-contain rounded-lg border bg-white" />
                          <Button size="sm" variant="ghost" asChild className="w-full h-8 text-[10px]">
                            <a href={src} target="_blank" rel="noopener noreferrer">Open Original</a>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 rounded-xl gap-2">
            <Download className="w-4 h-4" />
            Print Full Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export function NursePatientFullFilePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { patients, appointments, invoices, subfiles, markPatientAsDeceased } = useEMRStore();

  // Determine the role from the current path for correct navigation
  const currentPath = window.location.pathname;
  const isDoctor = currentPath.includes('/doctor/');
  const isAdmin = currentPath.includes('/dashboard/');
  const isReception = currentPath.includes('/reception/');

  const roleBasePath = isDoctor ? '/emr/doctor' :
    isAdmin ? '/emr/dashboard' :
      isReception ? '/emr/reception' : '/emr/nurse';

  // Data States
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [nurseNotes, setNurseNotes] = useState<any[]>([]);
  const [appointmentsHistory, setAppointmentsHistory] = useState<any[]>([]);
  const [medicationsHistory, setMedicationsHistory] = useState<any[]>([]);
  const [operationsHistory, setOperationsHistory] = useState<any[]>([]);
  const [referRequests, setReferRequests] = useState<any[]>([]);
  const [surgeryRequests, setSurgeryRequests] = useState<any[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [findingsHistory, setFindingsHistory] = useState<{ prescriptions: any[], tests: any[] }>({ prescriptions: [], tests: [] });
  const [loading, setLoading] = useState(true);

  // Find patient by ID (check both patients and subfiles)
  const mainPatient = patients.find((p: any) => p.id === patientId);
  const subfilePatient = !mainPatient ? subfiles.find((s: any) => `SF-${s.id}` === patientId || `sf-${s.id}` === patientId) : null;

  // Create a patient object if it's a subfile
  const patient = mainPatient || (subfilePatient ? {
    id: `SF-${subfilePatient.id}`,
    fullName: `${subfilePatient.firstName} ${subfilePatient.lastName}`,
    firstName: subfilePatient.firstName,
    lastName: subfilePatient.lastName,
    gender: subfilePatient.gender,
    dateOfBirth: subfilePatient.dateOfBirth,
    age: calculateAge(subfilePatient.dateOfBirth),
    phoneNumber: 'Dependent',
    address: 'Family Address',
    patientType: 'Outpatient' as const,
    fileType: 'Individual' as const,
    status: 'Active' as const,
    isPaid: true,
    isDead: subfilePatient.isDead,
    dateOfDeath: subfilePatient.dateOfDeath,
    causeOfDeath: subfilePatient.causeOfDeath,
    deathRemarks: subfilePatient.deathRemarks,
    dateRegistered: subfilePatient.createdAt,
    bloodGroup: subfilePatient.bloodGroup,
    allergies: subfilePatient.allergies,
    parentFileId: subfilePatient.fileId,
    isSubfile: true,
    nextOfKin: 'Parent',
    emergencyContactName: 'Parent',
    emergencyContactPhone: 'Parent',
    notes: 'Subfile record'
  } : null);
  const [localPatient, setLocalPatient] = useState<any>(mainPatient || (subfilePatient ? {
    id: `SF-${subfilePatient.id}`,
    fullName: `${subfilePatient.subfile_fname} ${subfilePatient.subfile_lname}`,
    firstName: subfilePatient.subfile_fname,
    lastName: subfilePatient.subfile_lname,
    gender: subfilePatient.subfile_gender,
    age: calculateAge(subfilePatient.subfile_dob),
    dateOfBirth: subfilePatient.subfile_dob,
    phoneNumber: 'N/A',
    fileType: 'Subfile',
    patientType: 'Outpatient',
    status: subfilePatient.is_dead ? 'Deceased' : 'Active',
    isNHIS: false,
    isDead: !!subfilePatient.is_dead,
    dateRegistered: subfilePatient.created_at,
    isSubfile: true,
    parentFileId: subfilePatient.subfile_file_id
  } : null));
  const currentPatient = localPatient || patient;
  const parentPatient = currentPatient?.isSubfile ? (patients.find((p: any) => p.patient_unique_id === currentPatient.parentFileId || p.id === currentPatient.parentFileId)) : null;

  const siblings = subfilePatient ? subfiles.filter((p: any) => p.fileId === subfilePatient.fileId && p.id !== subfilePatient.id) : [];

  // Derived data
  const patientAppointments = appointments.filter((a: any) => a.patientId === patientId);

  // Fetch all patient data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!patientId) return;
      setLoading(true);
      try {
        const r = await fetch(`/api/medical_records.php?action=full_patient_file&patient_id=${patientId}`, { credentials: 'include' });
        const data = await r.json();

        if (data.error) {
          toast.error(data.error);
        } else {
          setAppointmentsHistory(data.appointments || []);
          setAllPrescriptions(data.prescriptions || []);
          setPaymentHistory(data.payments || []);
          setAdmissions(data.admissions || []);
          setLabRequests(data.lab_tests || []);
          setFindingsHistory(data.findings ? {
            prescriptions: data.findings.filter((f: any) => !f.test_name),
            tests: data.findings.filter((f: any) => f.test_name)
          } : { prescriptions: [], tests: [] });
          setMedicationsHistory(data.medications || []);
          setOperationsHistory(data.operations || []);
          setReferRequests(data.refer_requests || []);
          setSurgeryRequests(data.surgery_requests || []);
          setVitalsHistory(data.vitals || []);
          if ((!data.vitals || data.vitals.length === 0) && patientId) {
            // Fallback: try fetching vitals separately if full_file didn't return them
            fetch(`/api/medical_records.php?action=get_vitals&patient_id=${patientId}`, { credentials: 'include' })
              .then(res => res.json())
              .then(vData => {
                if (Array.isArray(vData) && vData.length > 0) {
                  setVitalsHistory(vData);
                }
              })
              .catch(err => console.error("Vitals fallback fetch error", err));
          }
          setConsultations(data.consultations || []);
          setNurseNotes(data.nurse_notes || []);
          setDoctorNotes(data.doctor_notes || []);
          setLabResults(data.lab_results || []);
          if (data.patient) setLocalPatient(data.patient);
        }

      } catch (e) {
        console.error("Full file fetch error", e);
        toast.error("Failed to load some records");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [patientId]);

  // Modal states
  const [isDeceasedModalOpen, setIsDeceasedModalOpen] = useState(false);
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [deathRemarks, setDeathRemarks] = useState('');

  // View modals
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedLabTest, setSelectedLabTest] = useState<any>(null);
  const [selectedLabResult, setSelectedLabResult] = useState<any>(null);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);

  // Get family members
  const getFamilyMembers = () => {
    if (!patient) return null;

    // If this is a Family file, get all individual members
    if (patient.fileType === 'Family') {
      return patients.filter(p => p.parentFileId === patient.id);
    }

    // If this is an Individual with a parent file, get siblings and parent
    if (patient.parentFileId) {
      const familyFile = patients.find(p => p.id === patient.parentFileId);
      const siblings = patients.filter(p => p.parentFileId === patient.parentFileId && p.id !== patient.id);
      return { familyFile, siblings };
    }

    return null;
  };

  const familyData = getFamilyMembers();

  if (!patient) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`${roleBasePath}/patients`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Patient File Not Found</h2>
            <p className="text-muted-foreground">
              The patient file with ID {patientId} could not be found in the system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mockFindingsData = findingsHistory?.prescriptions || [];

  // Handle mark as deceased
  const handleMarkAsDeceased = () => {
    if (!dateOfDeath || !causeOfDeath) {
      toast.error('Missing Information', {
        description: 'Please provide date of death and cause of death.',
      });
      return;
    }

    markPatientAsDeceased(patient.id, dateOfDeath, causeOfDeath, deathRemarks);
    setIsDeceasedModalOpen(false);
    setDateOfDeath('');
    setCauseOfDeath('');
    setDeathRemarks('');

    toast.success('Patient Marked as Deceased', {
      description: `${patient.fullName}'s status has been updated.`,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => {
          const suffix = (isAdmin || isReception) ? '/ipd-file' : '/file';
          // For Doctor/Nurse, both paths usually work or map correctly
          const finalPath = (isAdmin || isReception) ? `${roleBasePath}/patients/${patientId}/ipd-file` :
            (isDoctor ? `/emr/doctor/patients/${patientId}` : `/emr/nurse/patients/${patientId}`);
          navigate(finalPath);
        }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to File
        </Button>
      </div>

      {/* Patient Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              {/* Left Section - Patient Info */}
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary/10">
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {patient.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{currentPatient?.fullName}</h1>
                  <p className="text-muted-foreground text-sm mb-3">
                    File Number: <span className="font-mono font-semibold text-foreground">{currentPatient?.id}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {currentPatient?.age} years
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {currentPatient?.phoneNumber}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge className={currentPatient?.patientType === 'Inpatient' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-green-100 text-green-700 hover:bg-green-100'}>
                      {currentPatient?.patientType === 'Inpatient' ? 'IPD' : 'OPD'}
                    </Badge>
                    <Badge className={currentPatient?.fileType === 'Family' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1' : 'bg-slate-100 text-slate-700 hover:bg-slate-100 flex items-center gap-1'}>
                      {currentPatient?.fileType === 'Family' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {currentPatient?.fileType} File
                    </Badge>
                    {currentPatient?.status === 'Admitted' && (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Admitted</Badge>
                    )}
                    {currentPatient?.isNHIS && (
                      <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        NHIS
                      </Badge>
                    )}
                    {currentPatient?.isDead ? (
                      <Badge variant="destructive" className="bg-black text-white hover:bg-black cursor-pointer" onClick={() => toast.info('Patient is deceased')}>
                        Deceased ✗
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 cursor-pointer" onClick={() => toast.info('Patient is alive')}>
                        Alive ✓
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Section - Quick Actions / Status */}
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  {!patient.isDead && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setIsDeceasedModalOpen(true)}
                    >
                      <Skull className="w-4 h-4 mr-2" />
                      Mark as Deceased
                    </Button>
                  )}
                  <Badge className={patient.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {patient.isDead ? 'Deceased' : patient.status}
                  </Badge>
                  <Badge variant="outline" className="border-primary/20">
                    {patient.patientType}
                  </Badge>
                </div>
                <div className="text-left lg:text-right text-sm">
                  <p className="text-muted-foreground">Registration Date</p>
                  <p className="font-medium">{formatDate(currentPatient?.dateRegistered)}</p>
                  <p className="font-medium">{formatDate(currentPatient?.dateRegistered, 'hh:mm a')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Mini Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPIMiniCard
          title="Appointments"
          value={appointmentsHistory.length}
          icon={Calendar}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <KPIMiniCard
          title="Prescriptions"
          value={allPrescriptions.length}
          icon={Pill}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <KPIMiniCard
          title="Payments"
          value={paymentHistory.length}
          icon={DollarSign}
          color="text-emerald-600"
          bgColor="bg-emerald-100"
        />
        <KPIMiniCard
          title="Admissions"
          value={admissions.length}
          icon={Bed}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <KPIMiniCard
          title="Lab Tests"
          value={labRequests.length}
          icon={FlaskConical}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* KPI Mini Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPIMiniCard
          title="Findings"
          value={findingsHistory.prescriptions.length + findingsHistory.tests.length}
          icon={FileText}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <KPIMiniCard
          title="Medications"
          value={medicationsHistory.length}
          icon={Syringe}
          color="text-pink-600"
          bgColor="bg-pink-100"
        />
        <KPIMiniCard
          title="Operations"
          value={operationsHistory.length}
          icon={Scissors}
          color="text-red-600"
          bgColor="bg-red-100"
        />
        <KPIMiniCard
          title="Refer Requests"
          value={referRequests.length}
          icon={UserPlus}
          color="text-teal-600"
          bgColor="bg-teal-100"
        />
        <KPIMiniCard
          title="Surgery Requests"
          value={surgeryRequests.length}
          icon={Activity}
          color="text-cyan-600"
          bgColor="bg-cyan-100"
        />
        <KPIMiniCard
          title="Lab Results"
          value={labResults.length}
          icon={FileText}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <KPIMiniCard
          title="Vitals"
          value={vitalsHistory.length}
          icon={Heart}
          color="text-rose-600"
          bgColor="bg-rose-100"
        />
      </div>

      {/* Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex flex-nowrap w-full md:w-auto h-auto p-1 gap-1">
              <TabsTrigger value="overview" className="whitespace-nowrap px-4 py-2">Overview</TabsTrigger>
              <TabsTrigger value="appointments" className="whitespace-nowrap px-4 py-2">Appointments</TabsTrigger>
              <TabsTrigger value="consultations" className="whitespace-nowrap px-4 py-2">Consultations</TabsTrigger>
              <TabsTrigger value="history" className="whitespace-nowrap px-4 py-2">Medical History</TabsTrigger>
              <TabsTrigger value="admissions" className="whitespace-nowrap px-4 py-2">Admissions</TabsTrigger>
              <TabsTrigger value="vitals" className="whitespace-nowrap px-4 py-2">
                Vitals {vitalsHistory.length > 0 && <Badge variant="secondary" className="ml-1 px-1 py-0 h-4 min-w-[16px] text-[10px]">{vitalsHistory.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="whitespace-nowrap px-4 py-2">Prescriptions</TabsTrigger>
              <TabsTrigger value="invoices" className="whitespace-nowrap px-4 py-2">Payments</TabsTrigger>
              <TabsTrigger value="medications" className="whitespace-nowrap px-4 py-2">Medications</TabsTrigger>
              <TabsTrigger value="lab-tests" className="whitespace-nowrap px-4 py-2">Lab Tests</TabsTrigger>
              <TabsTrigger value="lab-results" className="whitespace-nowrap px-4 py-2">Lab Results</TabsTrigger>
              <TabsTrigger value="nurse-notes" className="whitespace-nowrap px-4 py-2">Nurse Notes</TabsTrigger>
              <TabsTrigger value="doctor-notes" className="whitespace-nowrap px-4 py-2">Doctor Notes</TabsTrigger>
              <TabsTrigger value="findings" className="whitespace-nowrap px-4 py-2">Findings</TabsTrigger>
              <TabsTrigger value="operations" className="whitespace-nowrap px-4 py-2">Operations</TabsTrigger>
              <TabsTrigger value="clinical-requests" className="whitespace-nowrap px-4 py-2">Clinical Requests</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Full Name</p>
                      <p className="font-medium">{patient.fullName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium">{patient.gender}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{formatDate(patient.dateOfBirth, 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Age</p>
                      <p className="font-medium">{patient.age} years</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{patient.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{patient.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium">{patient.emergencyContactName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Emergency Phone</p>
                      <p className="font-medium">{patient.emergencyContactPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Next of Kin</p>
                      <p className="font-medium">{patient.nextOfKin}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Information */}
              <Card>
                <CardHeader>
                  <CardTitle>File Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">File Type</p>
                      <p className="font-medium">{patient.fileType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Patient Type</p>
                      <p className="font-medium">{patient.patientType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{patient.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date Registered</p>
                      <p className="font-medium">{formatDate(patient.dateRegistered, 'MMM dd, yyyy')}</p>
                    </div>
                    {patient.isNHIS && (
                      <>
                        <div>
                          <p className="text-muted-foreground">NHIS Provider</p>
                          <p className="font-medium">{patient.nhisProvider}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">NHIS Number</p>
                          <p className="font-medium">{patient.nhisNumber}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Family Members */}
              {familyData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Family Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patient.fileType === 'Family' && Array.isArray(familyData) && (
                      <div className="space-y-2">
                        {familyData.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No family members added yet
                          </p>
                        ) : (
                          familyData.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                <div>
                                  <p className="text-sm font-medium">{member.fullName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.age} years, {member.gender} • {member.id}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`${roleBasePath}/patients/${member.id}/full-file`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {patient.parentFileId && typeof familyData === 'object' && !Array.isArray(familyData) && (
                      <div className="space-y-3">
                        {/* Parent file viewing disabled */}

                        {familyData.siblings && familyData.siblings.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Siblings</p>
                            <div className="space-y-1">
                              {familyData.siblings.map((sibling) => (
                                <div key={sibling.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" />
                                    <div>
                                      <p className="text-sm font-medium">{sibling.fullName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {sibling.age} years, {sibling.gender} • {sibling.id}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => navigate(`${roleBasePath}/patients/${sibling.id}/full-file`)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Center Section - Parent Relation (Only for Subfiles) */}
              {currentPatient?.isSubfile && parentPatient && (
                <div className="mt-4 p-3 rounded-lg bg-purple-50/50 border border-purple-100 max-w-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-600">Parent Account</span>
                    <Shield className="w-3 h-3 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                      {parentPatient.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-purple-900">{parentPatient.fullName}</p>
                      <p className="text-[10px] text-purple-600 truncate">ID: {parentPatient.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Latest Vitals Summary in Overview */}
              {vitalsHistory.length > 0 && (
                <Card className="border shadow-sm border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-500" />
                        Latest Clinical Observations
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {formatDate(vitalsHistory[0].date_time, 'MMM dd, HH:mm')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-50 rounded-lg"><Heart className="w-3.5 h-3.5 text-red-600" /></div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">BP</p>
                          <p className="text-sm font-bold">{vitalsHistory[0].vital_bloodpressure || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-50 rounded-lg"><Droplets className="w-3.5 h-3.5 text-orange-600" /></div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Temp</p>
                          <p className="text-sm font-bold">{vitalsHistory[0].vital_temperature || 'N/A'}°C</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg"><Activity className="w-3.5 h-3.5 text-blue-600" /></div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Pulse</p>
                          <p className="text-sm font-bold">{vitalsHistory[0].vital_heartrate || 'N/A'} <span className="text-[8px] font-normal">bpm</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 rounded-lg"><Droplets className="w-3.5 h-3.5 text-emerald-600" /></div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Sugar</p>
                          <p className="text-sm font-bold">{vitalsHistory[0].vital_rbs || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="w-full mt-4 h-6 text-xs text-primary"
                      onClick={() => {
                        const tabsList = document.querySelector('[role="tablist"]');
                        const vitalsTab = tabsList?.querySelector('[value="vitals"]') as HTMLElement;
                        vitalsTab?.click();
                      }}
                    >
                      View Full History & Trends →
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Appointments */}
          <TabsContent value="appointments">
            <div className="space-y-3">
              {appointmentsHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Appointments</h3>
                    <p className="text-muted-foreground">This patient has no scheduled appointments.</p>
                  </CardContent>
                </Card>
              ) : (
                appointmentsHistory.map((appointment) => (
                  <Card key={appointment.appointment_id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAppointment({
                    id: appointment.appointment_id,
                    patientId: appointment.appointment_fileid,
                    patientName: patient.fullName,
                    doctorName: appointment.appointment_doctor,
                    date: appointment.appointment_date,
                    time: appointment.appointment_shift,
                    status: appointment.appointment_sta,
                    priority: appointment.appointment_priority,
                    appointmentType: appointment.appointment_department,
                    department: appointment.appointment_department,
                    notes: appointment.appointment_messege,
                    isPaid: appointment.appointment_ispaid === "1"
                  } as any)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{appointment.appointment_department || 'General Consultation'}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointment_date, 'EEEE, MMM dd, yyyy')} • {appointment.appointment_shift}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Doc ID: {appointment.appointment_doctor} • Ref: {appointment.appointment_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={
                              appointment.appointment_sta === 'finished' ? 'default' :
                                appointment.appointment_sta === 'pending' ? 'secondary' :
                                  'outline'
                            }
                          >
                            {appointment.appointment_sta}
                          </Badge>
                          <Badge variant={appointment.appointment_ispaid === "1" ? 'default' : 'destructive'}>
                            {appointment.appointment_ispaid === "1" ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Consultations */}
          <TabsContent value="consultations">
            <div className="space-y-4">
              {consultations.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Consultations</h3>
                    <p className="text-muted-foreground">No consultation records found for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                consultations.map((consultation: any) => (
                  <Card key={consultation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Dr. {consultation.doctor_name || consultation.doctor}</CardTitle>
                          <CardDescription>{consultation.department || 'General Medicine'}</CardDescription>
                        </div>
                        <Badge variant="outline">{formatDate(consultation.consultation_date || consultation.date, 'MMM dd, yyyy')}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Chief Complaints</p>
                        <p className="text-sm">{consultation.complaints}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</p>
                        <p className="text-sm font-semibold">{consultation.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Observations</p>
                        <p className="text-sm">{consultation.observations || 'None recorded'}</p>
                      </div>

                      {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                            <Pill className="w-4 h-4" /> Prescriptions
                          </p>
                          <div className="space-y-1">
                            {consultation.prescriptions.map((p: any, idx: number) => (
                              <p key={idx} className="text-xs bg-green-50 p-1 rounded">
                                {p.drugName || p.name} - {p.dosage} ({p.frequency})
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {consultation.lab_tests && consultation.lab_tests.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
                            <FlaskConical className="w-4 h-4" /> Lab Tests
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {consultation.lab_tests.map((t: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[10px] bg-orange-50 capitalize">
                                {t.testName || t.name || t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Drug Prescriptions</p>
                          <div className="flex flex-wrap gap-1">
                            {consultation.prescriptions.map((p: any, idx: number) => (
                              <Badge key={idx} variant="secondary">{p.drugName || p.drug_name || p.drug}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {consultation.lab_tests && consultation.lab_tests.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Lab Test Requests</p>
                          <div className="flex flex-wrap gap-1">
                            {consultation.lab_tests.map((t: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {typeof t === 'string' ? t : t.testName || t.name || 'Test'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 4: Medical History */}
          <TabsContent value="history">
            <div className="space-y-4">
              {consultations.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Medical History</h3>
                    <p className="text-muted-foreground">Historical records are derived from consultations.</p>
                  </CardContent>
                </Card>
              ) : (
                consultations.map((item: any, index: number) => (
                  <Card key={`history-${item.id || index}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Consultation History</Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{item.diagnosis}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Date: {formatDate(item.consultation_date || item.date, 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">Doctor: {item.doctor_name || item.doctor}</p>
                          {item.observations && (
                            <p className="text-sm mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <strong>Note:</strong> {item.observations}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 5: Admissions */}
          <TabsContent value="admissions">
            <div className="space-y-3">
              {admissions.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bed className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Admissions</h3>
                    <p className="text-muted-foreground">This patient has no active or past admission history recorded in this view.</p>
                  </CardContent>
                </Card>
              ) : (
                admissions.map((admission: any) => (
                  <Card key={admission.admission_id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Bed className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{admission.ward_name} - Bed: {admission.bed_no || admission.admission_bed || 'N/A'}</h3>
                            <p className="text-sm text-muted-foreground">Admission ID: {admission.ipd_number || admission.admission_id}</p>
                          </div>
                        </div>
                        <Badge variant={admission.admission_ispaid === "1" ? 'default' : 'destructive'}>
                          {admission.admission_ispaid === "1" ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date Admitted</p>
                          <p className="font-medium">{formatDate(admission.admission_datetime, 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">{admission.admission_ispaid === "1" ? "Settled" : "Awaiting Payment"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 6: Vitals */}
          <TabsContent value="vitals">
            <div className="space-y-6">
              {vitalsHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Vitals Data</h3>
                    <p className="text-muted-foreground">No vital signs recorded for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Vitals Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Vitals Trend</CardTitle>
                      <CardDescription>Blood Pressure & Blood Sugar Monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={[...vitalsHistory].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date_time"
                            tickFormatter={(value) => formatDate(value, 'MMM dd')}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => formatDate(value, 'MMM dd, yyyy')}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="vital_rbs" stroke="#059669" name="Blood Sugar (mg/dL)" />
                          <Line type="monotone" dataKey="vital_temperature" stroke="#dc2626" name="Temperature (°C)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Vitals Records */}
                  <div className="space-y-3">
                    {vitalsHistory.map((vital: any, index: number) => (
                      <Card key={`vital-${vital.id || vital.vital_id || index}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{formatDate(vital.date_time || vital.created_at || vital.vital_date, 'EEEE, MMM dd, yyyy • hh:mm a')}</h3>
                            <Badge variant="outline">{vital.vital_appointment || vital.vital_app_no || 'Routine'}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Blood Pressure</p>
                              <p className="font-semibold">{vital.vital_bloodpressure || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Temperature</p>
                              <p className="font-semibold">{vital.vital_temperature}°C</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Pulse</p>
                              <p className="font-semibold">{vital.vital_heartrate} bpm</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Weight</p>
                              <p className="font-semibold">{vital.vital_weight} kg</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Height</p>
                              <p className="font-semibold">{vital.vital_height} cm</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Blood Sugar</p>
                              <p className="font-semibold">{vital.vital_rbs} mg/dL</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Resp. Rate</p>
                              <p className="font-semibold">{vital.vital_respiratory || 'N/A'} cpm</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Oxygen Sat.</p>
                              <p className="font-semibold">{vital.vital_oxygen || 'N/A'}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab 7: Prescriptions */}
          <TabsContent value="prescriptions">
            <div className="space-y-3">
              {allPrescriptions.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Prescriptions</h3>
                    <p className="text-muted-foreground">No prescriptions found for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                allPrescriptions.map((rx: any) => (
                  <Card key={rx.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 rounded-lg">
                            <Pill className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Prescription #{rx.id}</h3>
                            <div className="space-y-1 mt-2">
                              {(() => {
                                try {
                                  const drugs = JSON.parse(rx.prescription || '[]');
                                  return drugs.map((d: any, idx: number) => (
                                    <p key={idx} className="text-sm font-medium">
                                      {d.drugName} - {d.dosage} ({d.frequency}, {d.duration} days)
                                    </p>
                                  ));
                                } catch (e) { return <p className="text-sm text-red-500">Error loading drugs</p>; }
                              })()}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Prescribed on {formatDate(rx.created_at, 'MMM dd, yyyy')} • Consultation #{rx.consultation_id}
                            </p>
                          </div>
                        </div>
                        <Badge variant={rx.sta === 'dispensed' ? 'default' : rx.is_paid === "1" ? 'secondary' : 'destructive'}>
                          {rx.sta === 'dispensed' ? 'Dispensed' : rx.is_paid === "1" ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 8: Invoices */}
          <TabsContent value="invoices">
            <div className="space-y-3">
              {paymentHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Payments</h3>
                    <p className="text-muted-foreground">No billing records found for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                paymentHistory.map((payment: any, idx) => (
                  <Card key={`payment-${payment.reference_id || payment.payment_id || payment.inv_id || idx}`} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedInvoice({
                    id: payment.payment_id || payment.inv_id,
                    patientId: patient.id,
                    patientName: patient.fullName,
                    amount: parseFloat(payment.amount_paid || payment.total || 0),
                    amountPaid: parseFloat(payment.amount_paid || payment.total || 0),
                    dateCreated: payment.created_at || payment.gen_date,
                    paymentStatus: 'Paid',
                    invoiceType: payment.payment_category || 'Service',
                    receiptId: payment.reference_id || payment.payment_id || payment.inv_id || `RCT-${idx}`,
                    items: []
                  } as any)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 bg-emerald-100 rounded-lg`}>
                            <DollarSign className={`w-6 h-6 text-emerald-600`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{payment.payment_category || 'Payment Received'}</h3>
                            <p className="text-sm text-muted-foreground">
                              {payment.payment_description || `Receipt #: ${payment.reference_id || payment.payment_id || payment.inv_id || 'N/A'}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(payment.created_at || payment.gen_date || payment.date, 'MMM dd, yyyy • hh:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold text-emerald-600`}>
                            ₦{parseFloat(payment.amount_paid || payment.total || 0).toLocaleString()}
                          </p>
                          <Badge className="mt-2" variant="default">
                            Paid
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="nurse-notes">
            <div className="space-y-3">
              {nurseNotes.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Nurse Notes</h3>
                    <p className="text-muted-foreground">No nursing notes recorded for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                nurseNotes.map((note: any) => (
                  <Card key={note.note_id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{note.nurse_name || 'Nurse'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(note.date_time || note.created_at, 'MMM dd, yyyy')} at {formatDate(note.date_time || note.created_at, 'hh:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline">IPD Note</Badge>
                      </div>
                      <p className="text-sm">{note.note_note}</p>
                      {note.note_comment && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs">
                          <p className="font-medium text-blue-800 mb-1">Comment:</p>
                          <p className="text-blue-700">{note.note_comment}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 9.5: Doctor Notes */}
          <TabsContent value="doctor-notes">
            <div className="space-y-3">
              {doctorNotes.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Doctor Notes</h3>
                    <p className="text-muted-foreground">No doctor notes/instructions recorded for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                doctorNotes.map((note: any) => (
                  <Card key={note.timeline_id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">Dr. {note.doctor_name || 'Consultant'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(note.timeline_date, 'MMM dd, yyyy')} at {formatDate(note.timeline_date, 'hh:mm a')}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">Doctor Note</Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.timeline_description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 10: Lab Tests */}
          <TabsContent value="lab-tests">
            <div className="space-y-3">
              {labRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FlaskConical className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Lab Tests</h3>
                    <p className="text-muted-foreground">No laboratory tests found for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                labRequests.map((test: any) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLabTest(test)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-orange-100 rounded-lg">
                            <FlaskConical className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Lab Request #{test.id}</h3>
                            <div className="space-y-1 mt-1">
                              {(() => {
                                try {
                                  const tests = typeof test.test === 'string' ? JSON.parse(test.test || '[]') : test.test || [];
                                  return tests.map((lt: any, idx: number) => (
                                    <p key={idx} className="text-sm font-medium">{lt.testName || lt.name || lt} {lt.result ? `- Result: ${lt.result}` : ''}</p>
                                  ));
                                } catch (e) { return <p className="text-sm">Error loading tests</p>; }
                              })()}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {test.doctor_name || test.doctor || 'Ordered by Doctor'} • {formatDate(test.appointment_date || test.date || test.created_at, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={test.sta === 'completed' || test.sta === 'dispensed' ? 'default' : 'secondary'}>
                            {test.sta || test.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2">
                            {Number(test.is_paid) === 1 || test.isPaid === 1 ? 'Paid' : 'Unpaid'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 10.5: Lab Results */}
          <TabsContent value="lab-results">
            <div className="space-y-4">
              {labResults.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FlaskConical className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Lab Results</h3>
                    <p className="text-muted-foreground">No laboratory test results found for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                labResults.map((result: any) => (
                  <Card
                    key={`lab-result-${result.result_id || result.id}`}
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-transparent hover:border-primary/20"
                    onClick={() => setSelectedLabResult(result)}
                  >
                    <CardHeader className="bg-orange-50/50 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <FlaskConical className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Test Result #{result.result_id || result.id}</CardTitle>
                            <CardDescription>
                              Invoice: {result.lab_invoice_id} • Date: {formatDate(result.result_date, 'MMM dd, yyyy')}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
                          <p className="text-xs text-muted-foreground mt-1">By {result.technician_name || 'Laboratory Staff'}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Result List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.isArray(result.result_list) && result.result_list.map((item: any, idx: number) => (
                          <div key={idx} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                            <p className="text-xs text-muted-foreground font-medium uppercase mb-1">{item.test_name || 'Test'}</p>
                            <p className="text-lg font-bold text-foreground">{item.result || item.value || 'N/A'}</p>
                            {item.summary && <p className="text-sm text-muted-foreground mt-2 italic">"{item.summary}"</p>}
                          </div>
                        ))}
                      </div>

                      {/* Summary / Remarks */}
                      {result.result_summary && (
                        <div className="p-4 bg-orange-50/30 rounded-lg border border-orange-100">
                          <h4 className="text-sm font-semibold text-orange-900 mb-2">Technician Summary:</h4>
                          <p className="text-sm text-orange-800 leading-relaxed whitespace-pre-wrap">{result.result_summary}</p>
                        </div>
                      )}

                      {/* Display Pictures or PDF Links */}
                      {result.result_pictures && Object.keys(result.result_pictures).length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Attachments / Visual Results
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(result.result_pictures).map(([name, path]: [string, any]) => {
                              const isPDF = typeof path === 'string' && path.toLowerCase().endsWith('.pdf');
                              const isDataURL = typeof path === 'string' && path.startsWith('data:');
                              const src = isDataURL ? path : `/api/uploads/${path}`;

                              return (
                                <div key={name} className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground uppercase">{name}</p>
                                  {isPDF ? (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                      <FileText className="w-5 h-5 text-blue-600" />
                                      <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-medium truncate">Document PDF</p>
                                        <p className="text-[10px] text-muted-foreground">Available in full report</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative group rounded-lg overflow-hidden border shadow-sm bg-muted/20">
                                      <img
                                        src={src}
                                        alt={name}
                                        className="w-full h-48 object-contain bg-black/5"
                                        onError={(e: any) => {
                                          e.target.parentElement.style.display = 'none';
                                        }}
                                      />
                                      <div className="absolute inset-x-0 bottom-0 p-2 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-white text-center">Click card for full view</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="findings">
            <div className="space-y-3">
              {findingsHistory.prescriptions.length === 0 && findingsHistory.tests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Findings</h3>
                    <p className="text-muted-foreground">No clinical findings recorded for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                [...findingsHistory.prescriptions, ...findingsHistory.tests].map((finding: any, idx: number) => (
                  <Card key={`finding-${finding.finding_id || idx}`} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedFinding(finding)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{finding.finding_description.substring(0, 50)}...</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Ref ID: {finding.finding_prescription_id} • Date: {formatDate(finding.finding_date, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {finding.finding_appointment_id ? `Appt #${finding.finding_appointment_id}` : 'General'}
                        </Badge>
                      </div>
                      <p className="text-sm">{finding.finding_description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 12: Medications */}
          <TabsContent value="medications">
            <div className="space-y-3">
              {medicationsHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Syringe className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Medications Administered</h3>
                    <p className="text-muted-foreground">No recorded medication administration from drug charts.</p>
                  </CardContent>
                </Card>
              ) : (
                medicationsHistory.map((med: any) => (
                  <Card key={med.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-pink-100 rounded-lg">
                            <Syringe className="w-6 h-6 text-pink-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{med.drug_name}</h3>
                            <p className="text-sm font-medium">{med.dosage} via {med.route}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Administered by {med.administered_by} • {formatDate(med.administered_at, 'MMM dd, yyyy hh:mm a')}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Administered</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 13: Operations */}
          <TabsContent value="operations">
            <div className="space-y-3">
              {operationsHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Scissors className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Operations</h3>
                    <p className="text-muted-foreground">No surgical/OT records found for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                operationsHistory.map((op: any) => (
                  <Card key={op.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-100 rounded-lg">
                            <Scissors className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{op.operation_name}</h3>
                            <p className="text-sm text-muted-foreground">{op.operation_category}</p>
                            <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                              <p><span className="text-muted-foreground">Date:</span> {formatDate(op.operation_date)}</p>
                              <p><span className="text-muted-foreground">Surgeon:</span> {op.consultant_doctor}</p>
                              <p className="col-span-2"><span className="text-muted-foreground">Result:</span> {op.result}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab 14: Clinical Requests (Refer & Surgery) */}
          <TabsContent value="clinical-requests">
            <div className="space-y-6">
              {/* Refer Requests */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Referral Requests (Approved)
                </h3>
                {referRequests.length === 0 ? (
                  <p className="text-sm text-center py-8 border rounded-lg bg-muted/20">No approved referral requests.</p>
                ) : (
                  <div className="grid gap-3">
                    {referRequests.map((req: any) => (
                      <Card key={req.rs_id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">Refer to: {req.rs_referto}</p>
                            <p className="text-sm text-muted-foreground italic">"{req.rs_remarks}"</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(req.rs_datetime, 'MMM dd, yyyy')}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">Approved</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Surgery Requests */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Surgery Requests (Approved)
                </h3>
                {surgeryRequests.length === 0 ? (
                  <p className="text-sm text-center py-8 border rounded-lg bg-muted/20">No approved surgery requests.</p>
                ) : (
                  <div className="grid gap-3">
                    {surgeryRequests.map((req: any) => (
                      <Card key={req.sr_id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">Surgery: {req.sr_name}</p>
                            <p className="text-sm text-muted-foreground">{req.sr_remarks}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(req.sr_datetime, 'MMM dd, yyyy')}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Approved</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Mark as Deceased Modal */}
      <Dialog open={isDeceasedModalOpen} onOpenChange={setIsDeceasedModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Mark Patient as Deceased
            </DialogTitle>
            <DialogDescription>
              Please provide the following information to mark {patient?.fullName} as deceased.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfDeath">Date of Death *</Label>
              <Input
                id="dateOfDeath"
                type="date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="causeOfDeath">Cause of Death *</Label>
              <Input
                id="causeOfDeath"
                value={causeOfDeath}
                onChange={(e) => setCauseOfDeath(e.target.value)}
                placeholder="e.g., Cardiac Arrest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deathRemarks">Additional Remarks (Optional)</Label>
              <Textarea
                id="deathRemarks"
                value={deathRemarks}
                onChange={(e) => setDeathRemarks(e.target.value)}
                placeholder="Any additional notes or remarks..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeceasedModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMarkAsDeceased}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modals */}
      <ViewAppointmentModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />
      <ViewInvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
      <ViewLabResultModal
        isOpen={!!selectedLabResult}
        onClose={() => setSelectedLabResult(null)}
        result={selectedLabResult}
        patient={patient}
      />
    </div>
  );
}
