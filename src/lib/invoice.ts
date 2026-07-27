import fs from 'fs';
import path from 'path';

export interface InvoiceItemData {
  productCode?: string;
  productName: string;
  variantSku?: string;
  size: string;
  color?: string;
  quantity: number;
  price?: number;
  total?: number;
  unitPrice?: number;
  totalPrice?: number;
  hsnCode?: string;
  gstRate?: number;
}

export interface InvoiceData {
  invoiceNumber?: string;
  invoiceDate?: Date;
  orderNumber: string;
  createdAt: Date;
  email: string;
  customerName: string;
  customerPhone?: string;
  billingAddress?: any;
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
  };
  items: InvoiceItemData[];
  subtotal: number;
  discountAmount: number;
  walletCredit: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

export const InvoiceService = {
  /**
   * Generate official GODSMOVE Tax Invoice HTML with itemized GST splits
   */
  generateInvoiceHtml(data: InvoiceData): string {
    const formatINR = (n: number) =>
      `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const formatDate = (d: Date | string) => {
      const dt = typeof d === 'string' ? new Date(d) : d;
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(dt || new Date());
    };

    // Calculate GST splits per item
    let calculatedTaxableSubtotal = 0;
    let calculatedTotalGst = 0;

    const itemRows = data.items
      .map((item, idx) => {
        const gstRate = item.gstRate || 12;
        const unitPrice = item.unitPrice ?? item.price ?? 0;
        const total = item.totalPrice ?? item.total ?? unitPrice * item.quantity;
        const taxable = Math.round((total / (1 + gstRate / 100)) * 100) / 100;
        const gst = Math.round((total - taxable) * 100) / 100;
        const cgst = Math.round((gst / 2) * 100) / 100;
        const sgst = Math.round((gst / 2) * 100) / 100;

        calculatedTaxableSubtotal += taxable;
        calculatedTotalGst += gst;

        const hsn = item.hsnCode || '61091000';
        const serial = item.variantSku || item.productCode || `GM-ITEM-00${idx + 1}`;

        return `
          <tr style="border-bottom: 1px solid #EAE5DB;">
            <td style="padding: 12px; text-align: left;">
              <strong style="color: #1A1918; font-size: 12px;">${item.productName}</strong><br/>
              <span style="font-size: 10px; color: #6E6B65;">SKU: ${serial} ${item.color ? `| Color: ${item.color}` : ''}</span>
            </td>
            <td style="padding: 12px; text-align: center; font-size: 11px; font-family: monospace;">${hsn}</td>
            <td style="padding: 12px; text-align: center; font-size: 11px;">${item.size}</td>
            <td style="padding: 12px; text-align: center; font-size: 11px;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right; font-size: 11px;">${formatINR(unitPrice)}</td>
            <td style="padding: 12px; text-align: right; font-size: 11px;">${formatINR(taxable)}</td>
            <td style="padding: 12px; text-align: right; font-size: 10px; color: #6E6B65;">
              ${gstRate}%<br/>(CGST ${cgst} + SGST ${sgst})
            </td>
            <td style="padding: 12px; text-align: right; font-size: 12px; font-weight: 700; color: #1A1918;">${formatINR(total)}</td>
          </tr>
        `;
      })
      .join('');

    const invoiceNum = data.invoiceNumber || `INV-${data.orderNumber}`;
    const invDate = data.invoiceDate || data.createdAt || new Date();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>TAX INVOICE — ${invoiceNum} | GODSMOVE</title>
          <style>
            @media print {
              body { padding: 0; background-color: #ffffff; }
              .invoice-card { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; }
            }
            body {
              margin: 0;
              padding: 30px 15px;
              background-color: #F7F5F0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1A1918;
            }
            .invoice-card {
              max-width: 820px;
              margin: 0 auto;
              background-color: #FFFFFF;
              border: 1px solid #EAE5DB;
              border-radius: 6px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.04);
            }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .logo-text { font-size: 24px; font-weight: 900; letter-spacing: 0.3em; color: #1A1918; text-transform: uppercase; margin: 0; }
            .company-sub { font-size: 9px; font-weight: 800; letter-spacing: 0.2em; color: #C8A46A; text-transform: uppercase; margin-top: 4px; }
            .inv-title { font-size: 20px; font-weight: 800; color: #1A1918; text-align: right; text-transform: uppercase; letter-spacing: 0.05em; }
            .inv-meta { font-size: 11px; color: #6E6B65; text-align: right; margin-top: 4px; line-height: 16px; }
            .divider { border-bottom: 1px solid #EAE5DB; margin: 20px 0; }
            .address-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
            .address-cell { vertical-align: top; width: 33%; padding: 12px; backgroundColor: #FBF9F5; border-radius: 4px; border: 1px solid #F0ECE4; }
            .address-title { font-size: 10px; font-weight: 800; letter-spacing: 0.15em; color: #C8A46A; text-transform: uppercase; margin-bottom: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
            .items-table th { background-color: #F8F6F1; color: #1A1918; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 10px 12px; border-bottom: 2px solid #EAE5DB; }
            .totals-table { width: 320px; margin-left: auto; border-collapse: collapse; font-size: 12px; }
            .totals-row td { padding: 6px 0; }
            .totals-label { color: #6E6B65; font-weight: 600; }
            .totals-val { text-align: right; font-weight: 700; color: #1A1918; }
            .grand-row td { border-top: 2px solid #1A1918; padding-top: 10px; font-size: 14px; font-weight: 800; }
            .footer-info { margin-top: 32px; padding-top: 20px; border-top: 1px solid #EAE5DB; text-align: center; font-size: 10px; color: #99948B; line-height: 16px; }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <!-- HEADER -->
            <table class="header-table">
              <tr>
                <td style="vertical-align: top;">
                  <div class="logo-text">G O D S M O V E</div>
                  <div class="company-sub">TAX INVOICE // ARCHIVAL DIVISION</div>
                  <div style="font-size: 10px; color: #6E6B65; margin-top: 8px; line-height: 15px;">
                    <strong>GODSMOVE CLOTHING PRIVATE LIMITED</strong><br/>
                    101 Archival Plaza, Bandra West, Mumbai - 400050<br/>
                    GSTIN: 27AABCG1234F1Z5 | PAN: AABCG1234F
                  </div>
                </td>
                <td style="vertical-align: top;">
                  <div class="inv-title">TAX INVOICE</div>
                  <div class="inv-meta">
                    <strong>INVOICE NO:</strong> ${invoiceNum}<br/>
                    <strong>DATE:</strong> ${formatDate(invDate)}<br/>
                    <strong>ORDER NO:</strong> ${data.orderNumber}<br/>
                    <strong>PAYMENT METHOD:</strong> ${data.paymentMethod} (${data.paymentStatus})
                  </div>
                </td>
              </tr>
            </table>

            <div class="divider"></div>

            <!-- ADDRESSES & CUSTOMER METADATA -->
            <table class="address-table">
              <tr>
                <td class="address-cell">
                  <div class="address-title">BILLED TO (CUSTOMER)</div>
                  <strong>${data.customerName}</strong><br/>
                  Email: ${data.email}<br/>
                  ${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}
                </td>
                <td style="width: 2%;"></td>
                <td class="address-cell">
                  <div class="address-title">SHIPPING DESTINATION</div>
                  <strong>${data.shippingAddress.firstName} ${data.shippingAddress.lastName}</strong><br/>
                  ${data.shippingAddress.line1}<br/>
                  ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br/>` : ''}
                  ${data.shippingAddress.city}, ${data.shippingAddress.state} — ${data.shippingAddress.pincode}<br/>
                  Phone: ${data.shippingAddress.phone || 'N/A'}
                </td>
              </tr>
            </table>

            <!-- ITEMS & TAX BREAKDOWN TABLE -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align: left;">DESCRIPTION</th>
                  <th style="text-align: center;">HSN</th>
                  <th style="text-align: center;">SIZE</th>
                  <th style="text-align: center;">QTY</th>
                  <th style="text-align: right;">UNIT PRICE</th>
                  <th style="text-align: right;">TAXABLE VAL</th>
                  <th style="text-align: right;">GST RATE</th>
                  <th style="text-align: right;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <!-- TOTALS SUMMARY -->
            <table class="totals-table">
              <tr class="totals-row">
                <td class="totals-label">TAXABLE SUBTOTAL</td>
                <td class="totals-val">${formatINR(calculatedTaxableSubtotal)}</td>
              </tr>
              <tr class="totals-row">
                <td class="totals-label">TOTAL GST (12% INCLUSIVE)</td>
                <td class="totals-val">${formatINR(calculatedTotalGst)}</td>
              </tr>
              {data.discountAmount > 0 && (
                <tr class="totals-row">
                  <td class="totals-label">COUPON DISCOUNT</td>
                  <td class="totals-val" style="color: #22C55E;">-${formatINR(data.discountAmount)}</td>
                </tr>
              )}
              {data.walletCredit > 0 && (
                <tr class="totals-row">
                  <td class="totals-label">VAULT CREDITS APPLIED</td>
                  <td class="totals-val" style="color: #22C55E;">-${formatINR(data.walletCredit)}</td>
                </tr>
              )}
              <tr class="totals-row">
                <td class="totals-label">SHIPPING (CONCIERGE)</td>
                <td class="totals-val">${data.shippingCost === 0 ? 'COMPLIMENTARY' : formatINR(data.shippingCost)}</td>
              </tr>
              <tr class="totals-row grand-row">
                <td class="totals-label" style="color: #1A1918;">GRAND TOTAL</td>
                <td class="totals-val">${formatINR(data.total)}</td>
              </tr>
            </table>

            <!-- FOOTER -->
            <div class="footer-info">
              This is a computer-generated tax invoice issued by GODSMOVE CLOTHING PRIVATE LIMITED.<br/>
              For concierge support, inquiries, or returns, contact support@godsmove.in | www.godsmove.in
            </div>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Save compiled Invoice HTML to filesystem for static hosting / download
   */
  async saveInvoiceFile(data: InvoiceData): Promise<string> {
    const html = this.generateInvoiceHtml(data);
    const invoicesDir = path.join(process.cwd(), 'public', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const filename = `invoice_${data.orderNumber}.html`;
    const filePath = path.join(invoicesDir, filename);
    fs.writeFileSync(filePath, html, 'utf8');
    return `/invoices/${filename}`;
  },
};
