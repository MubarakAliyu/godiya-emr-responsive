import { HospitalSettings } from '../store/types';

export interface LabReceiptData {
  receiptId: string;
  invoiceNo: string;
  patientName: string;
  patientId: string;
  fileNo: string;
  testType: string;
  testDetails?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentTime: string;
  cashierName: string;
  cashierId: string;
  hospitalSettings?: HospitalSettings;
}

export function generateLabReceiptPDF(data: LabReceiptData): void {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow popups to print receipts');
    return;
  }

  const settings = data.hospitalSettings;
  const hospitalName = settings?.hospitalName || settings?.general?.hospitalName || 'GODIYA HOSPITAL';
  const hospitalAddress = settings?.profile?.address || settings?.hospitalAddress || 'Birnin Kebbi, Kebbi State';
  const hospitalPhone = settings?.profile?.phoneNumber || settings?.hospitalPhone || '+234 XXX XXX XXXX';
  const hospitalEmail = settings?.profile?.email || settings?.hospitalEmail || 'info@godiyahospital.ng';
  const regNo = settings?.profile?.registrationNumber || 'RC-123456';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lab Receipt - ${data.receiptId}</title>
      <style>
        @page {
          margin: 0;
          size: 80mm 200mm; /* Standard POS printer size */
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Courier New', Courier, monospace; /* Classic POS font */
        }
        
        body {
          width: 80mm;
          padding: 4mm;
          background: white;
          color: black;
          font-size: 11px;
          line-height: 1.2;
        }

        .centered { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed black; margin: 2mm 0; }
        .double-divider { border-top: 2px double black; margin: 2mm 0; }
        
        .hospital-header {
          margin-bottom: 2mm;
        }
        
        .hospital-name {
          font-size: 14px;
          margin-bottom: 1mm;
          text-transform: uppercase;
        }
        
        .hospital-info {
          font-size: 9px;
          margin-bottom: 1mm;
        }

        .receipt-title {
          font-size: 13px;
          margin: 2mm 0;
          text-decoration: underline;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5mm;
        }
        
        .info-label { flex: 0 0 35%; }
        .info-value { flex: 1; text-align: right; }

        .test-section {
          margin: 3mm 0;
        }

        .test-name {
          font-size: 12px;
          margin-bottom: 1mm;
        }

        .test-sub {
          font-size: 9px;
          font-style: italic;
          padding-left: 2mm;
        }

        .amount-section {
          margin: 3mm 0;
          font-size: 15px;
        }

        .footer {
          margin-top: 5mm;
          font-size: 9px;
        }

        .barcode {
          font-family: 'Libre Barcode 39', cursive;
          font-size: 30px;
          margin: 2mm 0;
        }

        @media print {
          body { width: 80mm; }
        }
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
    </head>
    <body>
      <div class="centered hospital-header">
        <div class="bold hospital-name">${hospitalName}</div>
        <div class="hospital-info">${hospitalAddress}</div>
        <div class="hospital-info">Phone: ${hospitalPhone}</div>
        <div class="hospital-info">Email: ${hospitalEmail}</div>
        <div class="hospital-info">Reg No: ${regNo}</div>
      </div>

      <div class="divider"></div>

      <div class="centered bold receipt-title">LABORATORY RECEIPT</div>

      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${data.paymentDate} ${data.paymentTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Receipt:</span>
        <span class="info-value bold">${data.receiptId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Invoice:</span>
        <span class="info-value">${data.invoiceNo}</span>
      </div>

      <div class="divider"></div>

      <div class="info-row">
        <span class="info-label">Patient:</span>
        <span class="info-value bold">${data.patientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">File No:</span>
        <span class="info-value">${data.fileNo}</span>
      </div>

      <div class="divider"></div>

      <div class="test-section">
        <div class="bold test-name">TEST: ${data.testType}</div>
        ${data.testDetails ? `<div class="test-sub">${data.testDetails}</div>` : ''}
      </div>

      <div class="double-divider"></div>

      <div class="info-row amount-section bold">
        <span>TOTAL PAID:</span>
        <span>₦${data.amount.toLocaleString()}</span>
      </div>

      <div class="divider"></div>

      <div class="info-row">
        <span class="info-label">Method:</span>
        <span class="info-value bold">${data.paymentMethod.toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cashier:</span>
        <span class="info-value">${data.cashierName}</span>
      </div>

      <div class="double-divider"></div>

      <div class="centered footer">
        <div class="bold">THANK YOU FOR YOUR PATRONAGE</div>
        <div>Please keep this receipt for record.</div>
        <div>Results available in 24-48hrs.</div>
        <div class="barcode">*${data.receiptId}*</div>
        <div style="margin-top: 1mm;">${new Date().toLocaleString()}</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          // Close window after printing if needed
          // window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
