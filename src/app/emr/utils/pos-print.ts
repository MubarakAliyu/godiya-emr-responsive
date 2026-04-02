import { HospitalSettings } from '../store/types';

export interface PrintSection {
  title?: string;
  items: Array<{ label: string; value: string }>;
}

export interface PrintData {
  title: string;
  sections: PrintSection[];
  footer?: string;
  isPaid?: boolean; // if false, shows a prominent NOT PAID stamp
}

export const printPOSSlip = (settings: HospitalSettings, data: PrintData) => {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            width: 72mm; 
            margin: 0 auto; 
            padding: 5mm; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            line-height: 1.2;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .logo { max-width: 40mm; height: auto; margin-bottom: 5px; }
          .hospital-name { font-weight: bold; font-size: 14px; text-transform: uppercase; margin: 2px 0; }
          .info { font-size: 10px; margin: 1px 0; }
          .doc-title { font-weight: bold; font-size: 13px; text-align: center; margin: 8px 0 4px; letter-spacing: 1px; }
          .not-paid-stamp {
            border: 2px solid #c00;
            color: #c00;
            text-align: center;
            font-weight: bold;
            font-size: 15px;
            letter-spacing: 2px;
            padding: 4px 0;
            margin: 6px 0;
            transform: rotate(-2deg);
          }
          .section-title { font-weight: bold; font-size: 11px; margin-top: 10px; border-bottom: 1px solid #000; display: inline-block; }
          .section-divider { border-top: 1px dashed #000; margin: 10px 0; }
          .content { margin-bottom: 5px; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .label { font-weight: bold; }
          .value { text-align: right; flex: 1; margin-left: 10px; word-break: break-all; }
          .value-unpaid { text-align: right; flex: 1; margin-left: 10px; word-break: break-all; color: #c00; font-weight: bold; }
          .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 5px; font-size: 10px; }
          .footer-note { font-size: 10px; font-weight: bold; color: #c00; margin-bottom: 4px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.hospitalLogo ? `<img src="${settings.hospitalLogo}" class="logo" alt="Logo">` : ''}
          <div class="hospital-name">${settings.hospitalName}</div>
          <div class="info">${settings.hospitalAddress}</div>
          <div class="info">${settings.hospitalPhone}</div>
          ${settings.hospitalEmail ? `<div class="info">${settings.hospitalEmail}</div>` : ''}
        </div>
        
        <div class="doc-title">${data.title.toUpperCase()}</div>
        
        ${data.isPaid === false ? `<div class="not-paid-stamp">&#9888; NOT PAID &mdash; INVOICE ONLY</div>` : ''}
        
        ${data.sections.map((section, idx) => `
          ${idx > 0 ? '<div class="section-divider"></div>' : ''}
          ${section.title ? `<div class="section-title">${section.title.toUpperCase()}</div>` : ''}
          <div class="content">
            ${section.items.map(item => `
              <div class="row">
                <span class="label">${item.label}:</span>
                <span class="${item.value.includes('NOT PAID') ? 'value-unpaid' : 'value'}">${item.value}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
        
        <div class="footer">
          ${data.isPaid === false ? `<div class="footer-note">&#9888; PAYMENT REQUIRED AT CASHIER</div>` : ''}
          <div>${data.footer || 'Thank you for choosing Godiya Hospital'}</div>
          <div style="margin-top: 5px;">Printed on: ${new Date().toLocaleString()}</div>
        </div>
        
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
