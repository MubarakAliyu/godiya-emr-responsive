// CSV Export Utility for Cashier Module
// Exports data to CSV format for Excel/Sheets

export interface CSVExportData {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}

// Generic CSV Export Function
export function exportToCSV(data: CSVExportData): void {
  try {
    // Create CSV content
    let csvContent = '';
    
    // Add headers
    csvContent += data.headers.join(',') + '\n';
    
    // Add rows
    data.rows.forEach(row => {
      const formattedRow = row.map(cell => {
        // Handle cells that contain commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csvContent += formattedRow.join(',') + '\n';
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Failed to export CSV. Please try again.');
  }
}

// Export File Payments to CSV
export function exportFilePaymentsToCSV(payments: any[]): void {
  const csvData: CSVExportData = {
    headers: [
      'Receipt ID',
      'Patient Name',
      'File Number',
      'File Type',
      'Amount',
      'Payment Status',
      'Payment Method',
      'Date Created',
      'Date Paid'
    ],
    rows: payments.map(payment => [
      payment.receiptId || 'N/A',
      payment.patientName,
      payment.fileNo,
      payment.fileType,
      `₦${payment.amount.toLocaleString()}`,
      payment.paymentStatus,
      payment.paymentMethod || 'N/A',
      new Date(payment.dateCreated).toLocaleDateString(),
      payment.datePaid ? new Date(payment.datePaid).toLocaleDateString() : 'N/A'
    ]),
    filename: 'File_Payments_Report'
  };
  
  exportToCSV(csvData);
}

// Export Consultation Payments to CSV
export function exportConsultationPaymentsToCSV(consultations: any[]): void {
  const csvData: CSVExportData = {
    headers: [
      'Appointment ID',
      'Patient Name',
      'File Number',
      'Doctor',
      'Department',
      'Consultation Fee',
      'Payment Status',
      'Payment Method',
      'Appointment Date',
      'Payment Date'
    ],
    rows: consultations.map(consultation => [
      consultation.appointmentId,
      consultation.patientName,
      consultation.fileNo,
      consultation.doctorName,
      consultation.department,
      `₦${consultation.consultationFee.toLocaleString()}`,
      consultation.paymentStatus,
      consultation.paymentMethod || 'N/A',
      new Date(consultation.appointmentDate).toLocaleDateString(),
      consultation.paymentDate ? new Date(consultation.paymentDate).toLocaleDateString() : 'N/A'
    ]),
    filename: 'Consultation_Payments_Report'
  };
  
  exportToCSV(csvData);
}

// Export Laboratory Payments to CSV
export function exportLaboratoryPaymentsToCSV(invoices: any[]): void {
  const csvData: CSVExportData = {
    headers: [
      'Invoice No',
      'Patient Name',
      'File Number',
      'Test Type',
      'Test Details',
      'Amount',
      'Payment Status',
      'Payment Method',
      'Invoice Date',
      'Payment Date'
    ],
    rows: invoices.map(invoice => [
      invoice.invoiceNo,
      invoice.patientName,
      invoice.patientId,
      invoice.testType,
      invoice.testDetails || 'N/A',
      `₦${invoice.amount.toLocaleString()}`,
      invoice.status,
      invoice.paymentMethod || 'N/A',
      new Date(invoice.date).toLocaleDateString(),
      invoice.paymentDate || 'N/A'
    ]),
    filename: 'Laboratory_Payments_Report'
  };
  
  exportToCSV(csvData);
}

// Export Pharmacy Payments to CSV
export function exportPharmacyPaymentsToCSV(prescriptions: any[]): void {
  const csvData: CSVExportData = {
    headers: [
      'Prescription No',
      'Patient Name',
      'File Number',
      'Medications',
      'Total Quantity',
      'Amount',
      'Payment Status',
      'Payment Method',
      'Pharmacist',
      'Prescription Date',
      'Payment Date'
    ],
    rows: prescriptions.map(prescription => {
      const drugNames = prescription.drugs.map((d: any) => d.name).join('; ');
      const totalQty = prescription.drugs.reduce((sum: number, d: any) => sum + d.quantity, 0);
      return [
        prescription.prescriptionNo,
        prescription.patientName,
        prescription.patientId,
        drugNames,
        totalQty,
        `₦${prescription.amount.toLocaleString()}`,
        prescription.status,
        prescription.paymentMethod || 'N/A',
        prescription.pharmacist,
        new Date(prescription.date).toLocaleDateString(),
        prescription.paymentDate || 'N/A'
      ];
    }),
    filename: 'Pharmacy_Payments_Report'
  };
  
  exportToCSV(csvData);
}

// Export Daily Report to CSV
export function exportDailyReportToCSV(data: {
  date: string;
  transactions: {
    id: string;
    time: string;
    patientName: string;
    type: string;
    amount: number;
    method: string;
  }[];
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    cashPayments: number;
    cardPayments: number;
    transferPayments: number;
  };
}): void {
  const csvData: CSVExportData = {
    headers: [
      'Transaction ID',
      'Time',
      'Patient Name',
      'Service Type',
      'Payment Method',
      'Amount (₦)'
    ],
    rows: [
      // Summary rows
      ['DAILY SUMMARY', data.date, '', '', '', ''],
      ['Total Revenue', '', '', '', '', data.summary.totalRevenue.toLocaleString()],
      ['Total Transactions', '', '', '', '', data.summary.totalTransactions],
      ['Cash Payments', '', '', '', '', data.summary.cashPayments.toLocaleString()],
      ['Card Payments', '', '', '', '', data.summary.cardPayments.toLocaleString()],
      ['Bank Transfers', '', '', '', '', data.summary.transferPayments.toLocaleString()],
      ['', '', '', '', '', ''],
      ['TRANSACTION DETAILS', '', '', '', '', ''],
      ['Transaction ID', 'Time', 'Patient Name', 'Service Type', 'Payment Method', 'Amount (₦)'],
      // Transaction rows
      ...data.transactions.map(tx => [
        tx.id,
        tx.time,
        tx.patientName,
        tx.type,
        tx.method,
        tx.amount.toLocaleString()
      ])
    ],
    filename: `Daily_Financial_Report_${data.date}`
  };
  
  exportToCSV(csvData);
}

// Export Pending Payments to CSV
export function exportPendingPaymentsToCSV(payments: any[]): void {
  const csvData: CSVExportData = {
    headers: [
      'Patient Name',
      'File Number',
      'Payment Type',
      'Amount',
      'Status',
      'Date Created',
      'Days Pending'
    ],
    rows: payments.map(payment => {
      const daysPending = Math.floor(
        (new Date().getTime() - new Date(payment.dateCreated).getTime()) / (1000 * 60 * 60 * 24)
      );
      return [
        payment.patientName,
        payment.fileNo,
        payment.paymentType,
        `₦${payment.amount.toLocaleString()}`,
        payment.status,
        new Date(payment.dateCreated).toLocaleDateString(),
        daysPending
      ];
    }),
    filename: 'Pending_Payments_Report'
  };
  
  exportToCSV(csvData);
}

// Export Monthly Summary to CSV
export function exportMonthlySummaryToCSV(data: {
  month: string;
  year: number;
  totalRevenue: number;
  totalTransactions: number;
  byPaymentMethod: {
    cash: number;
    card: number;
    transfer: number;
  };
  byServiceType: {
    fileRegistration: number;
    consultation: number;
    laboratory: number;
    pharmacy: number;
  };
  dailyBreakdown: {
    date: string;
    revenue: number;
    transactions: number;
  }[];
}): void {
  const csvData: CSVExportData = {
    headers: ['Date', 'Revenue (₦)', 'Transactions'],
    rows: [
      // Summary header
      ['MONTHLY FINANCIAL SUMMARY', `${data.month} ${data.year}`, ''],
      ['', '', ''],
      ['Total Revenue', data.totalRevenue.toLocaleString(), ''],
      ['Total Transactions', data.totalTransactions, ''],
      ['', '', ''],
      ['PAYMENT METHOD BREAKDOWN', '', ''],
      ['Cash', data.byPaymentMethod.cash.toLocaleString(), ''],
      ['Card', data.byPaymentMethod.card.toLocaleString(), ''],
      ['Transfer', data.byPaymentMethod.transfer.toLocaleString(), ''],
      ['', '', ''],
      ['SERVICE TYPE BREAKDOWN', '', ''],
      ['File Registration', data.byServiceType.fileRegistration.toLocaleString(), ''],
      ['Consultation', data.byServiceType.consultation.toLocaleString(), ''],
      ['Laboratory', data.byServiceType.laboratory.toLocaleString(), ''],
      ['Pharmacy', data.byServiceType.pharmacy.toLocaleString(), ''],
      ['', '', ''],
      ['DAILY BREAKDOWN', '', ''],
      ['Date', 'Revenue (₦)', 'Transactions'],
      ...data.dailyBreakdown.map(day => [
        day.date,
        day.revenue.toLocaleString(),
        day.transactions
      ])
    ],
    filename: `Monthly_Summary_${data.month}_${data.year}`
  };
  
  exportToCSV(csvData);
}