/**
 * AccountingService — Enterprise ERP, Tally, Zoho Books Integration Layer
 * Compiles double-entry bookkeeping journal entries and ledger splits for orders.
 */

export interface JournalEntry {
  accountName: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  notes?: string;
}

export interface AccountingExportData {
  voucherId: string;
  voucherNumber: string;
  voucherType: 'SALES_VOUCHER' | 'RECEIPT_VOUCHER';
  date: string;
  customerName: string;
  customerEmail: string;
  companyGSTIN: string;
  narrative: string;
  entries: JournalEntry[];
  xmlPayload: string;  // Standard Tally XML format (Tally.ERP9 TDL compliant)
  jsonPayload: string; // Standard REST format for Zoho Books / Busy
}

export const AccountingService = {
  /**
   * Compiles double-entry bookkeeping ledger splits for any finalized order.
   */
  compileOrderLedger(order: any, companyState: string = 'HARYANA'): AccountingExportData {
    const subtotal = Number(order.subtotal);
    const shipping = Number(order.shippingCost);
    const discount = Number(order.discountAmount);
    const wallet = Number(order.walletCredit);
    const taxable = Number(order.taxableAmount ?? (subtotal - discount + shipping) / 1.12);
    const gst = Number(order.gstAmount ?? (subtotal - discount + shipping) - taxable);
    
    // CGST/SGST/IGST split
    const shippingAddress = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {});
    const customerState = (shippingAddress.state || 'Haryana').trim().toUpperCase();
    const isLocal = customerState === companyState.toUpperCase();

    const cgst = isLocal ? gst / 2 : 0;
    const sgst = isLocal ? gst / 2 : 0;
    const igst = isLocal ? 0 : gst;

    const gatewayAmount = Number(order.total); // Net collected via Razorpay/COD
    const roundOff = Number(order.roundOff ?? 0);

    const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
    const customerName = `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || order.email;

    const entries: JournalEntry[] = [];

    // --- DEBITS (Assets/Expenses/Liability Reduction) ---
    // 1. Bank/Cash/Gateway (Dr)
    if (gatewayAmount > 0) {
      entries.push({
        accountName: order.paymentMethod === 'COD' ? 'Cash-in-Hand' : 'Razorpay Settlement A/c',
        type: 'DEBIT',
        amount: gatewayAmount,
        currency: 'INR',
        notes: `Collected via ${order.paymentMethod}`,
      });
    }

    // 2. Wallet Liability Debited (Dr)
    if (wallet > 0) {
      entries.push({
        accountName: 'Customer Wallet Liability A/c',
        type: 'DEBIT',
        amount: wallet,
        currency: 'INR',
        notes: 'Redeemed GODSMOVE wallet credits',
      });
    }

    // 3. Trade Discounts Allowed (Dr)
    if (discount > 0) {
      entries.push({
        accountName: 'Discounts & Promotions A/c',
        type: 'DEBIT',
        amount: discount,
        currency: 'INR',
        notes: `Applied discount code`,
      });
    }

    // 4. Round-off adjustment Debit (if negative)
    if (roundOff < 0) {
      entries.push({
        accountName: 'Round Off Expense A/c',
        type: 'DEBIT',
        amount: Math.abs(roundOff),
        currency: 'INR',
      });
    }

    // --- CREDITS (Revenues/Liabilities Increased) ---
    // 5. Sales Revenue (Cr) - net of product discounts
    entries.push({
      accountName: 'Apparel Sales Revenue A/c',
      type: 'CREDIT',
      amount: taxable - (shipping > 0 ? shipping / 1.18 : 0), // Base apparel taxable value
      currency: 'INR',
    });

    // 6. Shipping Fee Revenue (Cr)
    if (shipping > 0) {
      entries.push({
        accountName: 'Shipping Fees Collected A/c',
        type: 'CREDIT',
        amount: shipping / 1.18, // base shipping taxable
        currency: 'INR',
      });
    }

    // 7. Output Taxes Payable (Cr)
    if (cgst > 0) {
      entries.push({ accountName: 'Output CGST @ 6% A/c', type: 'CREDIT', amount: cgst, currency: 'INR' });
      entries.push({ accountName: 'Output SGST @ 6% A/c', type: 'CREDIT', amount: sgst, currency: 'INR' });
    } else if (igst > 0) {
      entries.push({ accountName: 'Output IGST @ 12% A/c', type: 'CREDIT', amount: igst, currency: 'INR' });
    }

    // 8. Round-off adjustment Credit (if positive)
    if (roundOff > 0) {
      entries.push({
        accountName: 'Round Off Income A/c',
        type: 'CREDIT',
        amount: roundOff,
        currency: 'INR',
      });
    }

    // --- Format Tally.ERP9 TDL-Compliant XML ---
    const tallyXml = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice">
            <DATE>${dateStr.replace(/-/g, '')}</DATE>
            <VOUCHERNUMBER>${order.orderNumber}</VOUCHERNUMBER>
            <REFERENCE>${order.id}</REFERENCE>
            <PARTYLEDGERNAME>${entries.find(e => e.type === 'DEBIT')?.accountName || 'Cash'}</PARTYLEDGERNAME>
            <NARRATION>GST Sales Invoice Ref: ${order.orderNumber} for ${customerName}</NARRATION>
            ${entries.map(e => `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${e.accountName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${e.type === 'DEBIT' ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
              <AMOUNT>${e.type === 'DEBIT' ? -e.amount : e.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`).join('')}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();

    return {
      voucherId: order.id,
      voucherNumber: order.orderNumber,
      voucherType: 'SALES_VOUCHER',
      date: dateStr,
      customerName,
      customerEmail: order.email,
      companyGSTIN: '06AAAAA0000A1Z5', // Mock Haryana GSTIN
      narrative: `Invoice #${order.orderNumber} compiled for ${customerName} (${order.email})`,
      entries,
      xmlPayload: tallyXml,
      jsonPayload: JSON.stringify({
        invoice_number: order.orderNumber,
        date: dateStr,
        contact_name: customerName,
        email: order.email,
        line_items: order.items?.map((i: any) => ({
          name: i.productName,
          rate: Number(i.price),
          quantity: i.quantity,
          tax_name: 'GST 12%',
        })),
        journal_ledger: entries,
      }),
    };
  }
};
