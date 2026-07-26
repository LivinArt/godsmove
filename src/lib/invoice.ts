import fs from 'fs';
import path from 'path';

export interface InvoiceData {
  orderNumber: string;
  createdAt: Date;
  email: string;
  customerName: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: {
    productCode?: string;
    productName: string;
    size: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  discountAmount: number;
  walletCredit: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

export const InvoiceService = {
  // Generate a premium invoice HTML template
  generateInvoiceHtml(data: InvoiceData): string {
    const formatINR = (n: number) =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(n);

    const formatDate = (d: Date) =>
      new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);

    const itemsRows = data.items
      .map(
        (i) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; text-align: left;">
          <strong>${i.productName}</strong><br/>
          <span style="font-size: 10px; color: #555; font-family: monospace;">Serial: ${i.productCode || 'GM-ART-SERIAL'}</span>
        </td>
        <td style="text-align: center; padding: 12px 0;">${i.size}</td>
        <td style="text-align: center; padding: 12px 0;">${i.quantity}</td>
        <td style="text-align: right; padding: 12px 0;">${formatINR(i.price)}</td>
        <td style="text-align: right; padding: 12px 0; font-weight: 600;">${formatINR(i.total)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - GODSMOVE</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
              color: #000000;
              font-family: "Courier New", Courier, monospace;
              font-size: 12px;
              line-height: 1.5;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              padding: 30px;
              border: 1px solid #000;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 20px;
              font-weight: 700;
              letter-spacing: 0.25em;
              text-transform: uppercase;
            }
            .subtitle {
              font-size: 9px;
              color: #666;
              margin-top: 5px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            .details-col strong {
              display: block;
              margin-bottom: 6px;
              text-transform: uppercase;
              font-size: 11px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th {
              border-bottom: 1px solid #000;
              padding-bottom: 8px;
              text-transform: uppercase;
              font-size: 11px;
            }
            .totals-box {
              width: 250px;
              margin-left: auto;
              margin-bottom: 40px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .totals-row.grand {
              border-top: 1px solid #000;
              font-weight: 700;
              font-size: 14px;
              padding-top: 8px;
              margin-top: 4px;
            }
            .footer {
              border-top: 1px solid #000;
              padding-top: 20px;
              text-align: center;
              font-size: 9px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="logo">GODSMOVE</div>
                <div class="subtitle">Decisive Creators E-commerce Portal</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 18px; font-weight: bold; text-transform: uppercase;">INVOICE</div>
                <div style="margin-top: 5px;">Invoice #: ${data.orderNumber}</div>
                <div>Date: ${formatDate(data.createdAt)}</div>
              </div>
            </div>

            <div class="details-grid">
              <div class="details-col">
                <strong>Billed To:</strong>
                <div>${data.customerName}</div>
                <div>Email: ${data.email}</div>
              </div>
              <div class="details-col">
                <strong>Shipped To:</strong>
                <div>${data.shippingAddress.firstName} ${data.shippingAddress.lastName}</div>
                <div>${data.shippingAddress.line1}</div>
                ${data.shippingAddress.line2 ? `<div>${data.shippingAddress.line2}</div>` : ''}
                ${data.shippingAddress.landmark ? `<div>Landmark: ${data.shippingAddress.landmark}</div>` : ''}
                <div>${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}</div>
                <div>Phone: ${data.shippingAddress.phone}</div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align: left;">Item Description</th>
                  <th style="text-align: center; width: 60px;">Size</th>
                  <th style="text-align: center; width: 60px;">Qty</th>
                  <th style="text-align: right; width: 100px;">Price</th>
                  <th style="text-align: right; width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>${formatINR(data.subtotal)}</span>
              </div>
              ${data.discountAmount > 0 ? `<div class="totals-row"><span>Discount:</span><span>-${formatINR(data.discountAmount)}</span></div>` : ''}
              ${data.walletCredit > 0 ? `<div class="totals-row"><span>Credits Applied:</span><span>-${formatINR(data.walletCredit)}</span></div>` : ''}
              <div class="totals-row">
                <span>Shipping:</span>
                <span>${data.shippingCost === 0 ? 'FREE' : formatINR(data.shippingCost)}</span>
              </div>
              
              <!-- GST breakdown splits (MRP Inclusive Tax Calculation) -->
              ${(() => {
                const netOrderTotal = Math.max(0, Number(data.subtotal) - Number(data.discountAmount) - Number(data.walletCredit) + Number(data.shippingCost));
                const taxableVal = Number((netOrderTotal / 1.12).toFixed(2));
                const gstIncluded = Number((netOrderTotal - taxableVal).toFixed(2));
                const halfGst = Number((gstIncluded / 2).toFixed(2));
                const isIntraState = data.shippingAddress.state.trim().toUpperCase() === 'HARYANA';

                return `
                  <div class="totals-row" style="border-top: 1px dashed #ccc; padding-top: 8px; margin-top: 8px; font-size: 10px; color: #555;">
                    <span>Taxable Value (Excl. GST):</span>
                    <span>${formatINR(taxableVal)}</span>
                  </div>
                  ${isIntraState ? `
                  <div class="totals-row" style="font-size: 10px; color: #555;">
                    <span>CGST (6%):</span>
                    <span>${formatINR(halfGst)}</span>
                  </div>
                  <div class="totals-row" style="font-size: 10px; color: #555;">
                    <span>SGST (6%):</span>
                    <span>${formatINR(halfGst)}</span>
                  </div>
                  ` : `
                  <div class="totals-row" style="font-size: 10px; color: #555;">
                    <span>IGST (12%):</span>
                    <span>${formatINR(gstIncluded)}</span>
                  </div>
                  `}
                `;
              })()}
              
              <div class="totals-row grand">
                <span>Grand Total (Incl. GST):</span>
                <span>${formatINR(data.total)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Payment via \${data.paymentMethod} (\${data.paymentStatus})</p>
              <p>&copy; \${new Date().getFullYear()} GODSMOVE. Thank you for your custom.</p>
            </div>

            <!-- Printable Package Insert -->
            <div style="margin-top: 80px; border-top: 1px dashed #000; padding-top: 80px; page-break-before: always; text-align: center;">
              <div style="max-width: 420px; margin: auto; border: 1px solid #000; padding: 48px; background-color: #ffffff; display: inline-block; text-align: center;">
                <div style="font-size: 14px; font-weight: bold; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 24px; color: #000000;">GODSMOVE</div>
                <p style="font-size: 11px; color: #000000; line-height: 2; letter-spacing: 0.06em; margin: 0 0 24px 0;">
                  Thank you for choosing GODSMOVE.<br>
                  Designed with intention.<br>
                  Crafted to stay with you.
                </p>
                <div style="font-size: 8px; color: #888; letter-spacing: 0.1em; text-transform: uppercase; border-top: 1px solid #eaeaea; padding-top: 20px;">
                  STUDIO ARCHIVE RELEASE &middot; NO: \${data.orderNumber}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  // Save generated invoice HTML template as file for UAT inspection and profile downloads
  async saveInvoiceFile(data: InvoiceData): Promise<string> {
    try {
      const artifactDir = process.env.CONVERSATION_ID 
        ? path.join('C:\\Users\\hp\\.gemini\\antigravity-ide\\brain', process.env.CONVERSATION_ID) 
        : 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\3fbd69ae-198e-46d9-94aa-7283285b81d9';
      const invoicesDir = path.join(artifactDir, 'logs', 'invoices');
      fs.mkdirSync(invoicesDir, { recursive: true });

      const safeFilename = `\${data.orderNumber}.html`;
      const fullPath = path.join(invoicesDir, safeFilename);

      const html = this.generateInvoiceHtml(data);
      fs.writeFileSync(fullPath, html, 'utf8');
      console.log(`[INVOICING] Premium invoice saved successfully: \${fullPath}`);
      return fullPath;
    } catch (err) {
      console.error('Failed to save invoice file:', err);
      return '';
    }
  },
};
