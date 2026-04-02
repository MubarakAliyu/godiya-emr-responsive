import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Calendar, CheckCheck, CheckCircle, CheckCircle2, Clock, CreditCard, DollarSign, Download, Eye, FileText, Filter, Minus, Phone, Pill, Printer, Receipt, RotateCcw, Search, TrendingDown, TrendingUp, User, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';

interface KPICardProps {
  title: string;
  value: number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  tooltip?: string;
  prefix?: string;
}

interface InvoiceItem {
  drugId: string;
  name: string;
  dosage: string;
  quantity: number;
  price: number;
  subtotal: number;
  status: 'Available' | 'Unavailable';
}

interface Invoice {
  id: string;
  invoiceId: string;
  fileNumber: string;
  patientName: string;
  patientPhone: string;
  patientGender: string;
  patientAge?: number;
  patientType: 'IPD' | 'OPD';
  items: InvoiceItem[];
  amount: number;
  status: 'Paid' | 'Unpaid';
  isDispensed: boolean;
  paymentMethod?: string;
  cashier?: string;
  paidAt?: string;
  date: string;
  time: string;
}


// Mock data removed - fetching from API

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip, prefix = '' }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const numericValue = typeof value === 'number' ? value : 0;
    const duration = 1000;
    const increment = numericValue / (duration / 16);

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(startValue));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-foreground">
                      {prefix}{displayValue.toLocaleString()}
                    </h3>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: color === 'primary' ? '#1e40af15' : color === 'secondary' ? '#05966915' : color === 'warning' ? '#f5900b15' : '#dc262615'
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{
                        color: color === 'primary' ? '#1e40af' : color === 'secondary' ? '#059669' : color === 'warning' ? '#f59e0b' : '#dc2626'
                      }}
                    />
                  </div>
                </div>
                {trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span>{trendValue}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
export function InvoiceReportPanel() {
  const { addNotification } = useEMRStore();

  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [hospitalSettings, setHospitalSettings] = useState<{
    general?: { hospitalName: string },
    profile?: { address: string, phoneNumber: string }
  }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dispenseFilter, setDispenseFilter] = useState<string>('all');


  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Fetch data
  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings.php');
      const data = await res.json();
      setHospitalSettings(data);
    } catch (error) {
      console.error('Failed to fetch hospital settings:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/invoices.php');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'Paid').length;
  const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid').length;
  const dispensedCount = invoices.filter(i => i.isDispensed).length;
  const pendingDispensingCount = invoices.filter(i => !i.isDispensed).length;


  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesDispense = dispenseFilter === 'all' ||
      (dispenseFilter === 'Dispensed' && invoice.isDispensed) ||
      (dispenseFilter === 'Pending' && !invoice.isDispensed);

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const invoiceDate = new Date(invoice.date);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && invoiceDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && invoiceDate <= toDate;
      }
    }

    return matchesSearch && matchesStatus && matchesDispense && matchesDate;

  });

  // Paginate
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDispenseFilter('all');
    setDateFrom('');
    setDateTo('');

    setCurrentPage(1);
    toast.info('Filters Reset', {
      description: 'All filters have been cleared.',
    });
  };

  // Open view modal
  const openViewModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewModalOpen(true);
  };

  // Print invoice
  const handlePrintInvoice = (invoice: Invoice) => {
    const availableItems = invoice.items.filter(i => i.status === 'Available');
    const unavailableItems = invoice.items.filter(i => i.status === 'Unavailable');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Receipt - ${invoice.invoiceId}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 72mm; 
              margin: 0 auto; 
              padding: 5mm; 
              font-size: 12px; 
              line-height: 1.2;
              color: #000;
            }
            .receipt-header { text-align: center; margin-bottom: 5mm; border-bottom: 1px dashed #000; padding-bottom: 2mm; }
            .hospital-name { font-size: 16px; font-weight: bold; margin: 0; }
            .receipt-title { font-size: 14px; margin: 2px 0; }
            
            .info-section { margin-bottom: 4mm; font-size: 11px; }
            .info-line { display: flex; justify-content: space-between; margin-bottom: 1mm; }
            .info-label { font-weight: bold; }
            
            .items-section { border-bottom: 1px dashed #000; margin-bottom: 3mm; padding-bottom: 2mm; }
            .item-row { margin-bottom: 2mm; }
            .item-main { display: flex; justify-content: space-between; font-weight: bold; }
            
            .unavailable-header { 
              text-align: center; 
              font-weight: bold; 
              margin-top: 4mm; 
              border-top: 1px solid #000; 
              padding-top: 2mm;
              font-size: 11px;
            }
            .unavailable-list { font-size: 10px; font-style: italic; margin-bottom: 4mm; }
            
            .total-section { text-align: right; margin-top: 2mm; font-size: 14px; font-weight: bold; }
            .payment-badge { 
              text-align: center; 
              margin: 4mm 0; 
              padding: 2mm; 
              border: 1px solid #000; 
              font-size: 16px; 
              font-weight: bold; 
              text-transform: uppercase;
            }
            
            .footer { text-align: center; margin-top: 5mm; font-size: 10px; border-top: 1px dashed #000; padding-top: 3mm; }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h1 class="hospital-name">${hospitalSettings.general?.hospitalName || 'GODIYA HOSPITAL'}</h1>
            <p class="receipt-title">Pharmacy Receipt</p>
            <p>${hospitalSettings.profile?.address || 'Birnin Kebbi, Kebbi State'}</p>
            <p>Tel: ${hospitalSettings.profile?.phoneNumber || '0803XXXXXXX'}</p>
          </div>

          <div class="info-section">
            <div class="info-line">
              <span class="info-label">Invoice ID:</span>
              <span>${invoice.invoiceId}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Date/Time:</span>
              <span>${invoice.date} ${invoice.time}</span>
            </div>
            <div class="info-line">
              <span class="info-label">File No:</span>
              <span>${invoice.fileNumber}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Patient:</span>
              <span>${invoice.patientName}</span>
            </div>
          </div>

          <div class="items-section">
            <div style="border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 2mm; font-weight: bold; display: flex; justify-content: space-between;">
              <span>Item</span>
              <span>Qty x Price = Total</span>
            </div>
            ${availableItems.map(item => `
              <div class="item-row">
                <div class="item-main">
                  <span>${item.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                  <span>${item.quantity} x ₦${(item.price || 0).toLocaleString()}</span>
                  <span>₦${(item.subtotal || 0).toLocaleString()}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="total-section">
            TOTAL: ₦${(invoice.amount || 0).toLocaleString()}
          </div>

          <div class="payment-badge">
            ${invoice.status.toUpperCase()}
          </div>

          ${unavailableItems.length > 0 ? `
            <div class="unavailable-header">PRESCRIBED (NOT AVAILABLE)</div>
            <div class="unavailable-list" style="text-align: center;">
              ${unavailableItems.map(item => `• ${item.name}`).join('<br>')}
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for choosing Godiya Hospital</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    // Create iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow;
    if (frameDoc) {
      const doc = frameDoc.document;
      doc.open();
      doc.write(printContent);
      doc.close();

      setTimeout(() => {
        try {
          frameDoc.focus();
          frameDoc.print();
          setTimeout(() => document.body.removeChild(printFrame), 1000);
          toast.success('Invoice Printed', {
            description: `Invoice ${invoice.invoiceId} sent to printer`,
          });
        } catch (error) {
          toast.error('Print Error', {
            description: 'Unable to print invoice. Please try again.',
          });
        }
      }, 500);
    }
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['Invoice ID', 'File Number', 'Patient Name', 'Amount', 'Status', 'Date', 'Time'];
    const csvData = filteredInvoices.map(invoice => [
      invoice.invoiceId,
      invoice.fileNumber,
      invoice.patientName,
      invoice.amount,
      invoice.status,
      invoice.date,
      invoice.time
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice - report - ${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('CSV Exported', {
      description: `${filteredInvoices.length} records exported successfully.`,
    });
  };

  // Print report
  const handlePrintReport = () => {
    const reportHTML = `
      < !DOCTYPE html >
        <html>
          <head>
            <title>Invoice Report</title>
            <style>
              * {margin: 0; padding: 0; box-sizing: border-box; }
              body {font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #000; }
              .report-container {max - width: 1000px; margin: 0 auto; }
              .header {text - align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
              .header h1 {color: #1e40af; font-size: 32px; margin-bottom: 5px; }
              .header p {color: #666; font-size: 14px; line-height: 1.6; }
              .meta-info {display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
              .meta-item {display: flex; justify-content: space-between; padding: 8px 0; }
              .meta-label {font - weight: 600; color: #333; }
              .meta-value {color: #666; }
              .invoice-table {width: 100%; border-collapse: collapse; margin: 30px 0; }
              .invoice-table th {background: #1e40af; color: white; padding: 12px; text-align: left; font-size: 14px; }
              .invoice-table td {padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; color: #333; }
              .invoice-table tr:nth-child(even) {background: #f9fafb; }
              .invoice-table .text-right {text - align: right; }
              .invoice-table .text-center {text - align: center; }
              .badge-paid {display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #dcfce7; color: #166534; }
              .badge-unpaid {display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b; }
              .badge-pending {display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #fef3c7; color: #92400e; }
              .footer {text - align: center; margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee; color: #666; font-size: 12px; }
              .footer p {margin: 5px 0; }
              @media print {
                body {padding: 20px; }
              .no-print {display: none; }
            }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="header">
                <h1>GODIYA HOSPITAL</h1>
                <p>Pharmacy Invoice Report</p>
                <p>Birnin Kebbi, Kebbi State, Nigeria</p>
              </div>

              <div class="meta-info">
                <div>
                  <div class="meta-item">
                    <span class="meta-label">Report Date:</span>
                    <span class="meta-value">${new Date().toLocaleDateString()}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Report Time:</span>
                    <span class="meta-value">${new Date().toLocaleTimeString()}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Total Invoices:</span>
                    <span class="meta-value">${filteredInvoices.length}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Paid Invoices:</span>
                    <span class="meta-value">${filteredInvoices.filter(i => i.status === 'Paid').length}</span>
                  </div>
                </div>
                <div>
                  <div class="meta-item">
                    <span class="meta-label">Unpaid Invoices:</span>
                    <span class="meta-value">${filteredInvoices.filter(i => i.status === 'Unpaid').length}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Dispensed Invoices:</span>
                    <span class="meta-value">${filteredInvoices.filter(i => i.isDispensed).length}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Total Value:</span>
                    <span class="meta-value">₦${filteredInvoices.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Prepared By:</span>
                    <span class="meta-value">Pharmacy Department</span>
                  </div>
                </div>
              </div>

              <table class="invoice-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Invoice ID</th>
                    <th>File Number</th>
                    <th>Patient Name</th>
                    <th class="text-right">Amount</th>
                    <th class="text-center">Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredInvoices.map((invoice, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${invoice.invoiceId}</td>
                    <td>${invoice.fileNumber}</td>
                    <td><strong>${invoice.patientName}</strong></td>
                    <td class="text-right"><strong>₦${(invoice.amount || 0).toLocaleString()}</strong></td>
                    <td class="text-center">
                      <span class="badge-${invoice.status.toLowerCase()}">${invoice.status}</span>
                    </td>
                    <td>${new Date(invoice.date).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
                </tbody>
              </table>

              <div class="footer">
                <p><strong>GODIYA HOSPITAL - Pharmacy Department</strong></p>
                <p>This is a computer-generated report.</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow;
    if (frameDoc) {
      const doc = frameDoc.document;
      doc.open();
      doc.write(reportHTML);
      doc.close();

      setTimeout(() => {
        try {
          frameDoc.focus();
          frameDoc.print();
          setTimeout(() => document.body.removeChild(printFrame), 1000);
          toast.success('Report Printed', {
            description: 'Invoice report sent to printer',
          });
        } catch (error) {
          toast.error('Print Error', {
            description: 'Unable to print report. Please try again.',
          });
        }
      }, 500);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'Unpaid':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Unpaid
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Invoice Report</h1>
          <p className="text-muted-foreground">Invoice audit & history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button variant="outline" onClick={exportAsCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Invoices"
          value={totalInvoices}
          icon={Receipt}
          trend="neutral"
          trendValue="All records"
          color="primary"
        />
        <KPICard
          title="Paid"
          value={paidInvoices}
          icon={CheckCircle2}
          trend="up"
          trendValue="Payments completed"
          color="secondary"
        />
        <KPICard
          title="Dispensed"
          value={dispensedCount}
          icon={Pill}
          trend="up"
          trendValue="Fulfilled orders"
          color="success"
        />
        <KPICard
          title="Pending Dispensing"
          value={pendingDispensingCount}
          icon={Clock}
          trend="neutral"
          trendValue="Awaiting fulfillment"
          color="warning"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </CardTitle>
          <CardDescription>Search and filter invoice records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            <div className="lg:col-span-1">
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Invoice, file, name..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}

                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Status</Label>
              <Select value={statusFilter} onValueChange={(value: string) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>

                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dispensing</Label>
              <Select value={dispenseFilter} onValueChange={(value: string) => {
                setDispenseFilter(value);
                setCurrentPage(1);
              }}>

                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Dispensing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="Dispensed">Dispensed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}

                className="h-10"
              />
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}

                className="h-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-end mt-4">
            <Button variant="ghost" onClick={handleResetFilters} size="sm" className="text-muted-foreground hover:text-primary">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All Filters
            </Button>
          </div>
        </CardContent>

      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Invoice Records</CardTitle>
              <CardDescription>
                Showing {paginatedInvoices.length} of {filteredInvoices.length} invoices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice No.</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">File No.</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Patient Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {paginatedInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sm text-primary">{invoice.invoiceId}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-sm">{invoice.fileNumber}</p>
                          <Badge
                            variant="outline"
                            className={`text - xs mt - 1 ${invoice.patientType === 'IPD' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'} `}
                          >
                            {invoice.patientType}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sm">{invoice.patientName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-sm text-primary">₦{(invoice.amount || 0).toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-semibold">{invoice.date}</p>
                          <p className="text-xs text-muted-foreground">{invoice.time}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openViewModal(invoice)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Invoice</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePrintInvoice(invoice)}
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Print Invoice</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {paginatedInvoices.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground mb-2">No invoices found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {filteredInvoices.length} total records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Receipt className="w-6 h-6 text-primary" />
              Invoice Details
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete invoice information
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              {/* Patient & Invoice Info */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">File Number</Label>
                      <p className="font-semibold">{selectedInvoice.fileNumber}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Patient Name</Label>
                      <p className="font-semibold">{selectedInvoice.patientName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Age / Gender</Label>
                        <p className="font-semibold text-sm">{selectedInvoice.patientAge ?? 'N/A'}y • {selectedInvoice.patientGender}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Patient Type</Label>
                        <Badge
                          variant="outline"
                          className={selectedInvoice.patientType === 'IPD' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}
                        >
                          {selectedInvoice.patientType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="font-semibold text-sm">{selectedInvoice.patientPhone}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Invoice Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Invoice ID</Label>
                      <p className="font-semibold text-primary">{selectedInvoice.invoiceId}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <p className="font-semibold text-sm">{selectedInvoice.date}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Time</Label>
                        <p className="font-semibold text-sm">{selectedInvoice.time}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items List */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pill className="w-5 h-5 text-primary" />
                    Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">#</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Item Description</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Dosage</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Quantity</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Unit Price</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-3 text-sm">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-sm">{item.name}</p>
                            </td>
                            <td className="py-3 px-3 text-sm">{item.dosage}</td>
                            <td className="py-3 px-3 text-center">
                              <Badge variant="outline" className="text-xs">{item.quantity}</Badge>
                            </td>
                            <td className="py-3 px-3 text-right text-sm">₦{(item.price || 0).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right">
                              <p className="font-bold text-sm text-primary">₦{(item.subtotal || 0).toLocaleString()}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Total Summary */}
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-2xl font-bold">Total Amount:</span>
                    <span className="text-4xl font-bold text-primary">
                      ₦{(selectedInvoice.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            {selectedInvoice && (
              <Button
                variant="outline"
                onClick={() => handlePrintInvoice(selectedInvoice)}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
