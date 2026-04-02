import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign, FileText, TrendingUp, Clock, Receipt, Calendar,
  Search, Filter, RotateCcw, Printer, Download, Eye,
  ChevronLeft, ChevronRight, RefreshCcw
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Card, CardContent } from '@/app/components/ui/card';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { format, isToday, parseISO, isWithinInterval } from 'date-fns';
import type { Invoice } from '@/app/emr/store/types';
import { ViewDetailsModal } from './components/view-details-modal';
import { ViewReceiptModal } from './components/view-receipt-modal';
import { RefundModal } from './components/refund-modal';

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

export function FinancePage() {
  const { invoices, patients } = useEMRStore();

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        searchTerm === '' ||
        invoice.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPaymentType =
        paymentTypeFilter === 'all' || invoice.invoiceType === paymentTypeFilter;

      const matchesStatus =
        statusFilter === 'all' || invoice.paymentStatus === statusFilter;

      // Date filtering
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const invoiceDate = parseISO(invoice.dateCreated);
        const today = new Date();
        
        if (dateFilter === 'today') {
          matchesDate = isToday(invoiceDate);
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = isWithinInterval(invoiceDate, { start: weekAgo, end: today });
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = isWithinInterval(invoiceDate, { start: monthAgo, end: today });
        }
      }

      return matchesSearch && matchesPaymentType && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, paymentTypeFilter, statusFilter, dateFilter]);

  // Calculate KPIs
  const totalRecords = filteredInvoices.length;
  const totalIncome = filteredInvoices
    .filter((i) => i.paymentStatus === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const todaysIncome = filteredInvoices
    .filter((i) => i.paymentStatus === 'Paid' && isToday(parseISO(i.dateCreated)))
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const pendingPayments = filteredInvoices
    .filter((i) => i.paymentStatus === 'Unpaid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const refunds = filteredInvoices
    .filter((i) => i.paymentStatus === 'Partial')
    .reduce((sum, inv) => sum + inv.amount * 0.1, 0); // Mock refund calculation

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setPaymentTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    toast.success('Filters reset');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Patient Name', 'File No', 'Description', 'Amount', 'Date', 'Processed By', 'Status'];
    const rows = filteredInvoices.map(invoice => {
      const patient = patients.find(p => p.id === invoice.patientId);
      return [
        invoice.receiptId,
        invoice.patientName,
        patient?.id || 'N/A',
        invoice.invoiceType,
        invoice.amount,
        format(parseISO(invoice.dateCreated), 'MMM dd, yyyy'),
        'Super Admin', // Mock - would come from actual data
        invoice.paymentStatus
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  // Print Report
  const handlePrintReport = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  // View Details
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };

  // View Receipt
  const handleViewReceipt = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsReceiptModalOpen(true);
  };

  // Print Receipt
  const handlePrintReceipt = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsReceiptModalOpen(true);
    setTimeout(() => {
      window.print();
    }, 100);
    toast.success('Receipt ready to print');
  };

  // Refund
  const handleRefund = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsRefundModalOpen(true);
  };

  // Get payment status badge
  const getStatusBadge = (status: string) => {
    if (status === 'Paid') {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
    } else if (status === 'Partial') {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Partial</Badge>;
    } else {
      return <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200">Unpaid</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary" />
            Finance & Income Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Track hospital revenue, receipts and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintReport} className="gap-2">
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          icon={FileText}
          label="Total Records"
          value={totalRecords}
          color="bg-blue-50 text-blue-600"
          delay={0}
        />
        <KPICard
          icon={TrendingUp}
          label="Total Income"
          value={`₦${totalIncome.toLocaleString()}`}
          color="bg-green-50 text-green-600"
          delay={0.05}
        />
        <KPICard
          icon={DollarSign}
          label="Today's Income"
          value={`₦${todaysIncome.toLocaleString()}`}
          color="bg-emerald-50 text-emerald-600"
          delay={0.1}
        />
        <KPICard
          icon={Clock}
          label="Pending Payments"
          value={`₦${pendingPayments.toLocaleString()}`}
          color="bg-orange-50 text-orange-600"
          delay={0.15}
        />
        <KPICard
          icon={RefreshCcw}
          label="Refunds"
          value={`₦${refunds.toLocaleString()}`}
          color="bg-red-50 text-red-600"
          delay={0.2}
        />
        <KPICard
          icon={Calendar}
          label="Report Date"
          value={dateFilter === 'all' ? 'All Time' : dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : 'This Month'}
          color="bg-purple-50 text-purple-600"
          delay={0.25}
        />
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-xl p-6 border border-border shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search receipts, patients..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Range */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Type */}
          <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Consultation">Consultation</SelectItem>
              <SelectItem value="Lab">Laboratory</SelectItem>
              <SelectItem value="Pharmacy">Pharmacy</SelectItem>
              <SelectItem value="Admission">Admission</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset */}
          <Button variant="outline" onClick={handleResetFilters} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Filters
          </Button>
        </div>
      </motion.div>

      {/* Finance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-xl border border-border shadow-sm overflow-hidden"
      >
        {currentInvoices.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-sm">ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Receipt No</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Description</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Patient</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm hidden md:table-cell">Processed By</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Amount (₦)</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.map((invoice, index) => {
                    const patient = patients.find(p => p.id === invoice.patientId);
                    return (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm text-muted-foreground">
                          {startIndex + index + 1}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono font-semibold text-sm">
                            {invoice.receiptId}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <Badge variant="outline">{invoice.invoiceType}</Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-sm">{invoice.patientName}</p>
                            <p className="text-xs text-muted-foreground">{patient?.id || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          {format(parseISO(invoice.dateCreated), 'MMM dd, yyyy')}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(invoice.dateCreated), 'hh:mm a')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm hidden md:table-cell">
                          Super Admin
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-sm">
                            ₦{invoice.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(invoice.paymentStatus)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(invoice)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(invoice)}
                              title="View Receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintReceipt(invoice)}
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefund(invoice)}
                              title="Process Refund"
                              disabled={invoice.paymentStatus === 'Unpaid'}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}–{Math.min(endIndex, filteredInvoices.length)} of{' '}
                {filteredInvoices.length} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No income records for selected period
            </p>
            <Button variant="outline" onClick={handleResetFilters} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </Button>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      {selectedInvoice && (
        <>
          <ViewDetailsModal
            invoice={selectedInvoice}
            patient={patients.find(p => p.id === selectedInvoice.patientId)}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedInvoice(null);
            }}
          />
          <ViewReceiptModal
            invoice={selectedInvoice}
            patient={patients.find(p => p.id === selectedInvoice.patientId)}
            isOpen={isReceiptModalOpen}
            onClose={() => {
              setIsReceiptModalOpen(false);
              setSelectedInvoice(null);
            }}
          />
          <RefundModal
            invoice={selectedInvoice}
            isOpen={isRefundModalOpen}
            onClose={() => {
              setIsRefundModalOpen(false);
              setSelectedInvoice(null);
            }}
          />
        </>
      )}
    </div>
  );
}