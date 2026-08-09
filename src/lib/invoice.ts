import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

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
  orderId?: string;
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
  codFee?: number;
  taxableAmount?: number;
  gstAmount?: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string | null;
  isPreBooking?: boolean;
  orderType?: string;
  lockedUnitPrice?: number | null;
  lockedDiscountAmount?: number | null;
}

export const InvoiceService = {
  /**
   * Secure private storage directory (OUTSIDE public web root)
   */
  getStorageDir(): string {
    const storageDir = path.join(process.cwd(), 'storage', 'invoices');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    return storageDir;
  },

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

    const isPreBooking = data.orderType === 'PRE_BOOKING' || Boolean(data.isPreBooking);

    // Canonical calculations from stored order snapshot
    const grossItemValue = isPreBooking && Number(data.lockedUnitPrice) > 0
      ? Number(data.lockedUnitPrice)
      : Number(data.subtotal || 0);

    const discountValue = isPreBooking && Number(data.lockedDiscountAmount) > 0
      ? Number(data.lockedDiscountAmount)
      : Number(data.discountAmount || 0);

    const netSellingPrice = Math.max(0, grossItemValue - discountValue);

    const shippingCost = Number(data.shippingCost || 0);
    const codFee = isPreBooking ? 0 : Number(data.codFee || 0);

    const storedTaxable = Number(data.taxableAmount || 0);
    const taxableValue = storedTaxable > 0 ? storedTaxable : Math.round((netSellingPrice / 1.12) * 100) / 100;

    const storedGst = Number(data.gstAmount || 0);
    const gstValue = storedGst > 0 ? storedGst : Number((netSellingPrice - taxableValue).toFixed(2));

    const grandTotal = Number(data.total || 0) > 0 ? Number(data.total) : (netSellingPrice + shippingCost + codFee);
    const creditsApplied = Number(data.walletCredit || 0);
    const finalPayable = Math.max(0, grandTotal - creditsApplied);

    const isLocalState = (data.shippingAddress.state || 'Haryana').trim().toUpperCase() === 'HARYANA';

    let calculatedTaxableSubtotal = 0;
    let calculatedTotalGst = 0;

    const itemRows = data.items
      .map((item, idx) => {
        const gstRate = item.gstRate || 12;
        const unitPrice = item.unitPrice ?? item.price ?? 0;
        const lineTotal = item.totalPrice ?? item.total ?? unitPrice * item.quantity;
        
        // Extract taxable & GST for line item
        const lineTaxable = Math.round((lineTotal / (1 + gstRate / 100)) * 100) / 100;
        const lineGst = Math.round((lineTotal - lineTaxable) * 100) / 100;
        const cgst = Math.round((lineGst / 2) * 100) / 100;
        const sgst = Math.round((lineGst / 2) * 100) / 100;

        calculatedTaxableSubtotal += lineTaxable;
        calculatedTotalGst += lineGst;

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
            <td style="padding: 12px; text-align: right; font-size: 11px;">${formatINR(lineTaxable)}</td>
            <td style="padding: 12px; text-align: right; font-size: 10px; color: #6E6B65;">
              ${gstRate}%<br/>${isLocalState ? `(CGST ${formatINR(cgst)} + SGST ${formatINR(sgst)})` : `(IGST ${formatINR(lineGst)})`}
            </td>
            <td style="padding: 12px; text-align: right; font-size: 12px; font-weight: 700; color: #1A1918;">${formatINR(lineTotal)}</td>
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
            .address-cell { vertical-align: top; width: 48%; padding: 12px; background-color: #FBF9F5; border-radius: 4px; border: 1px solid #F0ECE4; }
            .address-title { font-size: 10px; font-weight: 800; letter-spacing: 0.15em; color: #C8A46A; text-transform: uppercase; margin-bottom: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
            .items-table th { background-color: #F8F6F1; color: #1A1918; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 10px 12px; border-bottom: 2px solid #EAE5DB; }
            .totals-table { width: 340px; margin-left: auto; border-collapse: collapse; font-size: 12px; }
            .totals-row td { padding: 6px 0; }
            .totals-label { color: #6E6B65; font-weight: 600; }
            .totals-val { text-align: right; font-weight: 700; color: #1A1918; }
            .grand-row td { border-top: 2px solid #1A1918; padding-top: 10px; font-size: 14px; font-weight: 800; }
            .footer-info { margin-top: 32px; padding-top: 20px; border-top: 1px solid #EAE5DB; text-align: center; font-size: 10px; color: #99948B; line-height: 16px; }
            .badge-tag { display: inline-block; padding: 3px 8px; font-size: 9px; font-weight: 800; letter-spacing: 0.1em; border-radius: 3px; text-transform: uppercase; margin-top: 6px; }
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
                  ${isPreBooking ? `<div class="badge-tag" style="background-color: rgba(200, 164, 106, 0.15); color: #B08D57; border: 1px solid #C8A46A;">PRE-BOOKING ALLOCATION • PRE-ORDER</div>` : ''}
                </td>
                <td style="vertical-align: top;">
                  <div class="inv-title">TAX INVOICE</div>
                  <div class="inv-meta">
                    <strong>INVOICE NO:</strong> ${invoiceNum}<br/>
                    <strong>DATE:</strong> ${formatDate(invDate)}<br/>
                    <strong>ORDER NO:</strong> ${data.orderNumber}<br/>
                    <strong>PAYMENT METHOD:</strong> ${data.paymentMethod} (${data.paymentStatus})
                    ${data.transactionId ? `<br/><strong>TXN ID:</strong> ${data.transactionId}` : ''}
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
                <td style="width: 4%;"></td>
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
                <td class="totals-label">GROSS ITEM VALUE</td>
                <td class="totals-val">${formatINR(grossItemValue)}</td>
              </tr>
              ${discountValue > 0 ? `
              <tr class="totals-row">
                <td class="totals-label">${isPreBooking ? 'PRE-BOOKING SAVINGS' : 'DISCOUNT'}</td>
                <td class="totals-val" style="color: #B08D57;">-${formatINR(discountValue)}</td>
              </tr>
              ` : ''}
              <tr class="totals-row" style="font-weight: 700;">
                <td class="totals-label" style="color: #1A1918;">NET SELLING PRICE</td>
                <td class="totals-val">${formatINR(netSellingPrice)}</td>
              </tr>
              <tr class="totals-row" style="border-top: 1px dashed #EAE5DB; border-bottom: 1px dashed #EAE5DB;">
                <td class="totals-label">TAXABLE VALUE (BASE)</td>
                <td class="totals-val">${formatINR(taxableValue)}</td>
              </tr>
              <tr class="totals-row" style="border-bottom: 1px dashed #EAE5DB;">
                <td class="totals-label">GST (INCLUDED IN PRICE)</td>
                <td class="totals-val">${formatINR(gstValue)}</td>
              </tr>
              <tr class="totals-row">
                <td class="totals-label">SHIPPING (CONCIERGE)</td>
                <td class="totals-val">${shippingCost === 0 ? 'COMPLIMENTARY' : formatINR(shippingCost)}</td>
              </tr>
              ${isPreBooking ? `
              <tr class="totals-row">
                <td class="totals-label">GODSMOVE MEMBERSHIP</td>
                <td class="totals-val" style="color: #16A34A;">COMPLIMENTARY (₹0)</td>
              </tr>
              ` : ''}
              ${codFee > 0 ? `
              <tr class="totals-row">
                <td class="totals-label">COD HANDLING FEE</td>
                <td class="totals-val" style="color: #B08D57;">+${formatINR(codFee)}</td>
              </tr>
              ` : ''}
              <tr class="totals-row grand-row">
                <td class="totals-label" style="color: #1A1918;">GRAND TOTAL</td>
                <td class="totals-val">${formatINR(grandTotal)}</td>
              </tr>
              ${creditsApplied > 0 ? `
              <tr class="totals-row">
                <td class="totals-label">CREDITS APPLIED</td>
                <td class="totals-val" style="color: #16A34A;">-${formatINR(creditsApplied)}</td>
              </tr>
              <tr class="totals-row" style="font-weight: 700; color: #1A1918;">
                <td class="totals-label">FINAL PAYABLE</td>
                <td class="totals-val">${formatINR(finalPayable)}</td>
              </tr>
              ` : ''}
            </table>

            <!-- FOOTER -->
            <div class="footer-info">
              This is an official computer-generated tax invoice issued by GODSMOVE CLOTHING PRIVATE LIMITED.<br/>
              For concierge support, inquiries, or returns, contact support@godsmove.in | www.godsmove.in
            </div>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Generate a valid PDF binary buffer from Tax Invoice Data
   */
  generateInvoicePdfBuffer(data: InvoiceData, htmlContent: string): Buffer {
    const invoiceNum = data.invoiceNumber || `INV-${data.orderNumber}`;
    const dateStr = new Date(data.createdAt || new Date()).toISOString().split('T')[0];
    
    const header = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
    const pageObj = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
    const fontObj = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
    
    const textLines = [
      `GODSMOVE CLOTHING PRIVATE LIMITED - TAX INVOICE`,
      `================================================`,
      `Invoice Number: ${invoiceNum}`,
      `Date: ${dateStr}`,
      `Order Number: ${data.orderNumber}`,
      `Customer: ${data.customerName} (${data.email})`,
      `Payment Method: ${data.paymentMethod} (${data.paymentStatus})`,
      `------------------------------------------------`,
      `Grand Total: INR ${data.total}`,
      `------------------------------------------------`,
      `Official Computer Generated Tax Invoice.`
    ];
    
    const contentStream = textLines.map((line, i) => `BT /F1 12 Tf 40 ${720 - (i * 20)} Td (${line}) Tj ET`).join('\n');
    const streamObj = `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
    
    const pdfContent = header + pageObj + fontObj + streamObj + `xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000318 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${(header + pageObj + fontObj + streamObj).length}\n%%EOF`;
    
    return Buffer.from(pdfContent, 'binary');
  },

  /**
   * Helper: Generate and store PDF invoice from DB Order object
   */
  async generateAndStoreInvoice(order: any) {
    const invoiceNum = `INV-${order.orderNumber}`;
    const pdfPath = path.join(this.getStorageDir(), `${invoiceNum}.pdf`);

    const customerName = order.shippingAddress
      ? `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim()
      : 'Valued Customer';

    const shippingAddress = typeof order.shippingAddress === 'string'
      ? JSON.parse(order.shippingAddress)
      : order.shippingAddress || {};

    const invoiceData: InvoiceData = {
      invoiceNumber: invoiceNum,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      email: order.email,
      customerName,
      shippingAddress,
      items: (order.items || []).map((it: any) => ({
        productName: it.productName,
        size: it.size,
        color: it.color,
        quantity: it.quantity,
        price: Number(it.price || 0),
        total: Number(it.total || 0),
        variantSku: it.variantSku,
      })),
      subtotal: Number(order.subtotal || 0),
      discountAmount: Number(order.discountAmount || 0),
      walletCredit: Number(order.walletCredit || 0),
      shippingCost: Number(order.shippingCost || 0),
      codFee: Number(order.codFee || 0),
      taxableAmount: Number(order.taxableAmount || 0),
      gstAmount: Number(order.gstAmount || 0),
      total: Number(order.total || 0),
      paymentMethod: order.paymentMethod || 'RAZORPAY',
      paymentStatus: order.paymentStatus || 'PAID',
      transactionId: order.razorpayPaymentId || order.razorpayOrderId || null,
      isPreBooking: Boolean(order.isPreBooking || order.orderType === 'PRE_BOOKING'),
      orderType: order.orderType || 'REGULAR',
      lockedUnitPrice: order.lockedUnitPrice ? Number(order.lockedUnitPrice) : null,
      lockedDiscountAmount: order.lockedDiscountAmount ? Number(order.lockedDiscountAmount) : null,
    };

    const htmlContent = this.generateInvoiceHtml(invoiceData);
    const pdfBuffer = this.generateInvoicePdfBuffer(invoiceData, htmlContent);

    const htmlPath = path.join(this.getStorageDir(), `${invoiceNum}.html`);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    fs.writeFileSync(pdfPath, pdfBuffer);

    return {
      invoiceNumber: invoiceNum,
      pdfPath,
      htmlPath,
      pdfBuffer,
      htmlContent,
    };
  },

  /**
   * Update payment status on order invoice record
   */
  async updatePaymentStatus(orderId: string, paymentStatus: string, razorpayPaymentId?: string, paymentMethod?: string) {
    const updateData: any = {
      paymentStatus,
    };
    if (razorpayPaymentId) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    return prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
  }
};
