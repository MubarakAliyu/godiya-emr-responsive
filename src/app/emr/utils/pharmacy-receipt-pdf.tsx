import { HospitalSettings } from '../store/types';

export interface DrugItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PharmacyReceiptData {
  receiptId: string;
  prescriptionNo: string;
  patientName: string;
  patientId: string;
  fileNo: string;
  drugs: DrugItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentTime: string;
  pharmacistName: string;
  pharmacistId: string;
  cashierName: string;
  cashierId: string;
  isSubfile?: boolean;
  parentFileNumber?: string;
  hospitalSettings?: HospitalSettings;
}

export function generatePharmacyReceiptPDF(data: PharmacyReceiptData): void {
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
      <title>Pharmacy Receipt - ${data.receiptId}</title>
      <style>
        @page {
          margin: 0;
          size: 80mm 200mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Courier New', Courier, monospace;
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
        
        .info-label { flex: 0 0 40%; }
        .info-value { flex: 1; text-align: right; }

        .items-table {
          width: 100%;
          margin: 2mm 0;
          font-size: 10px;
        }
        
        .items-header {
          border-bottom: 1px solid black;
          padding-bottom: 1mm;
          margin-bottom: 1mm;
          display: flex;
          justify-content: space-between;
        }

        .item-row {
          margin-bottom: 1.5mm;
        }

        .item-name {
          font-weight: bold;
          margin-bottom: 0.5mm;
        }

        .item-details {
          display: flex;
          justify-content: space-between;
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

      <div class="centered bold receipt-title">PHARMACY RECEIPT</div>

      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${data.paymentDate} ${data.paymentTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Receipt:</span>
        <span class="info-value bold">${data.receiptId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">RX No:</span>
        <span class="info-value">${data.prescriptionNo}</span>
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

      ${data.isSubfile ? `
      <div class="info-row">
        <span class="info-label">Parent File:</span>
        <span class="info-value">${data.parentFileNumber}</span>
      </div>
      ` : ''}

      <div class="divider"></div>

      <div class="bold items-header">
        <span>ITEMS</span>
        <span>AMOUNT</span>
      </div>

      <div class="items-list">
        ${data.drugs.map(drug => `
          <div class="item-row">
            <div class="item-name">${drug.name}</div>
            <div class="item-details">
              <span>${drug.quantity} x ₦${(drug.unitPrice || 0).toLocaleString()}</span>
              <span class="bold">₦${(drug.subtotal || 0).toLocaleString()}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="double-divider"></div>

      <div class="info-row amount-section bold">
        <span>TOTAL PAID:</span>
        <span>₦${(data.totalAmount || 0).toLocaleString()}</span>
      </div>

      <div class="divider"></div>

      <div class="info-row">
        <span class="info-label">Method:</span>
        <span class="info-value bold">${data.paymentMethod.toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Pharmacist:</span>
        <span class="info-value">${data.pharmacistName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cashier:</span>
        <span class="info-value">${data.cashierName}</span>
      </div>

      <div class="double-divider"></div>

      <div class="centered footer">
        <div class="bold">THANK YOU FOR YOUR PATRONAGE</div>
        <div>Store medications in a cool, dry place.</div>
        <div>Keep out of reach of children.</div>
        <div class="barcode">*${data.receiptId}*</div>
        <div style="margin-top: 1mm;">${new Date().toLocaleString()}</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
