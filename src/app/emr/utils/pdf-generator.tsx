// PDF Generator Utility for Cashier Module
// Generates professional PDF receipts and reports

export interface ReceiptData {
  receiptId: string;
  invoiceId: string;
  patientName: string;
  patientId: string;
  fileNo: string;
  paymentType: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentTime: string;
  cashierName: string;
  cashierId: string;
}

export interface DailyReportData {
  date: string;
  totalRevenue: number;
  totalTransactions: number;
  cashPayments: number;
  cardPayments: number;
  transferPayments: number;
  filePayments: number;
  consultationPayments: number;
  labPayments: number;
  pharmacyPayments: number;
  transactions: {
    id: string;
    time: string;
    patientName: string;
    type: string;
    amount: number;
    method: string;
  }[];
}

// Generate Payment Receipt PDF
export function generatePaymentReceiptPDF(data: ReceiptData): void {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print receipts');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${data.receiptId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          background: white;
        }
        
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #1e40af;
          padding: 40px;
          background: white;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .hospital-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        
        .hospital-details {
          font-size: 14px;
          color: #666;
          margin-bottom: 15px;
        }
        
        .receipt-title {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
          margin-top: 15px;
        }
        
        .receipt-id {
          font-size: 16px;
          color: #666;
          margin-top: 5px;
        }
        
        .details-section {
          margin: 30px 0;
        }
        
        .details-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .details-label {
          font-weight: 600;
          color: #374151;
          flex: 1;
        }
        
        .details-value {
          color: #111827;
          flex: 2;
          text-align: right;
        }
        
        .amount-section {
          background: #f3f4f6;
          padding: 25px;
          border-radius: 8px;
          margin: 30px 0;
        }
        
        .amount-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .amount-label {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
        }
        
        .amount-value {
          font-size: 36px;
          font-weight: bold;
          color: #1e40af;
        }
        
        .payment-info {
          margin: 30px 0;
          padding: 20px;
          background: #eff6ff;
          border-left: 4px solid #1e40af;
        }
        
        .payment-info-title {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #666;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #000;
          width: 200px;
          margin: 50px auto 10px;
        }
        
        .signature-label {
          font-size: 14px;
          color: #666;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          color: rgba(30, 64, 175, 0.05);
          font-weight: bold;
          z-index: -1;
          user-select: none;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .receipt {
            border: none;
          }
          
          @page {
            margin: 20mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="watermark">GODIYA HOSPITAL</div>
      
      <div class="receipt">
        <div class="header">
          <div class="hospital-name">GODIYA HOSPITAL</div>
          <div class="hospital-details">
            Birnin Kebbi, Kebbi State, Nigeria<br>
            Phone: +234 XXX XXX XXXX | Email: info@godiyahospital.ng
          </div>
          <div class="receipt-title">PAYMENT RECEIPT</div>
          <div class="receipt-id">${data.receiptId}</div>
        </div>
        
        <div class="details-section">
          <div class="details-row">
            <div class="details-label">Date & Time:</div>
            <div class="details-value">${data.paymentDate} at ${data.paymentTime}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Patient Name:</div>
            <div class="details-value">${data.patientName}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Patient ID:</div>
            <div class="details-value">${data.patientId}</div>
          </div>
          <div class="details-row">
            <div class="details-label">File Number:</div>
            <div class="details-value">${data.fileNo}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Invoice ID:</div>
            <div class="details-value">${data.invoiceId}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Payment Type:</div>
            <div class="details-value">${data.paymentType}</div>
          </div>
        </div>
        
        <div class="amount-section">
          <div class="amount-row">
            <div class="amount-label">Total Amount Paid:</div>
            <div class="amount-value">₦${data.amount.toLocaleString()}</div>
          </div>
        </div>
        
        <div class="payment-info">
          <div class="payment-info-title">Payment Information</div>
          <div class="details-row" style="border: none;">
            <div class="details-label">Payment Method:</div>
            <div class="details-value">${data.paymentMethod}</div>
          </div>
          <div class="details-row" style="border: none;">
            <div class="details-label">Processed By:</div>
            <div class="details-value">${data.cashierName} (${data.cashierId})</div>
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Cashier Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Patient Signature</div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Thank you for choosing Godiya Hospital</strong></p>
          <p style="margin-top: 10px; font-size: 12px;">
            This is a computer-generated receipt and is valid without signature.<br>
            For inquiries, please contact our billing department.
          </p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

// Generate Daily Report PDF
export function generateDailyReportPDF(data: DailyReportData): void {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print reports');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Daily Financial Report - ${data.date}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          background: white;
        }
        
        .report {
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .hospital-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        
        .report-title {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
          margin-top: 15px;
        }
        
        .report-date {
          font-size: 16px;
          color: #666;
          margin-top: 5px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        
        .summary-card {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #1e40af;
        }
        
        .summary-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
        }
        
        .breakdown-section {
          margin: 30px 0;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: #f9fafb;
          border-radius: 4px;
        }
        
        .breakdown-label {
          color: #374151;
        }
        
        .breakdown-value {
          font-weight: 600;
          color: #111827;
        }
        
        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .transactions-table th {
          background: #1e40af;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        
        .transactions-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .transactions-table tr:hover {
          background: #f9fafb;
        }
        
        .total-row {
          background: #eff6ff;
          font-weight: bold;
          border-top: 2px solid #1e40af;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          @page {
            margin: 20mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="report">
        <div class="header">
          <div class="hospital-name">GODIYA HOSPITAL</div>
          <div class="report-title">DAILY FINANCIAL REPORT</div>
          <div class="report-date">${data.date}</div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Revenue</div>
            <div class="summary-value">₦${data.totalRevenue.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Transactions</div>
            <div class="summary-value">${data.totalTransactions}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Average Transaction</div>
            <div class="summary-value">₦${Math.round(data.totalRevenue / Math.max(data.totalTransactions, 1)).toLocaleString()}</div>
          </div>
        </div>
        
        <div class="breakdown-section">
          <div class="section-title">Payment Method Breakdown</div>
          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span class="breakdown-label">Cash Payments</span>
              <span class="breakdown-value">₦${data.cashPayments.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Card Payments</span>
              <span class="breakdown-value">₦${data.cardPayments.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Bank Transfers</span>
              <span class="breakdown-value">₦${data.transferPayments.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div class="breakdown-section">
          <div class="section-title">Service Type Breakdown</div>
          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span class="breakdown-label">File Registrations</span>
              <span class="breakdown-value">₦${data.filePayments.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Consultations</span>
              <span class="breakdown-value">₦${data.consultationPayments.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Laboratory</span>
              <span class="breakdown-value">₦${data.labPayments.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Pharmacy</span>
              <span class="breakdown-value">₦${data.pharmacyPayments.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div class="breakdown-section">
          <div class="section-title">Transaction Details</div>
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient Name</th>
                <th>Service Type</th>
                <th>Payment Method</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.transactions.map(tx => `
                <tr>
                  <td>${tx.time}</td>
                  <td>${tx.patientName}</td>
                  <td>${tx.type}</td>
                  <td>${tx.method}</td>
                  <td style="text-align: right;">₦${tx.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">TOTAL:</td>
                <td style="text-align: right;">₦${data.totalRevenue.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p><strong>Godiya Hospital - Financial Department</strong></p>
          <p style="margin-top: 10px;">
            This is a computer-generated report. Generated on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}
