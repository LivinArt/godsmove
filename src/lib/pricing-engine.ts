/**
 * PricingEngine — Centralized Commerce Pricing & Tax Calculator
 * Canonical source of truth for Checkout, Admin CRM Order Details, Invoices, and Order Creation.
 * Compliant with Indian invoicing standards (GST splits, GST-inclusive prices, discount transparency).
 */

import { GSTService, GstSplit } from './gst-service';

export interface PricingItem {
  price: number;                // selling price per unit (GST-inclusive)
  comparePrice?: number | null;   // retail price / MRP per unit (GST-inclusive)
  quantity: number;
  productName: string;
  gstPercentage?: number | null;  // configured GST percentage (e.g. 12 or 18)
}

export interface PricingResult {
  productTotal: number;         // gross catalog retail value (MRP sum)
  productDiscount: number;      // markdown discount (productTotal - subtotal)
  subtotal: number;             // selling price before coupon / pre-booking savings
  couponCode: string | null;
  couponDiscount: number;       // total discount applied (coupon or prebooking offer)
  netSellingPrice: number;      // net selling price (subtotal - couponDiscount)
  walletCredit: number;         // vault credits applied (<= grandTotal)
  shippingCost: number;         // concierge shipping charges
  codFee: number;               // Cash on Delivery handling fee
  taxableAmount: number;        // taxable base extracted from netSellingPrice
  gstAmount: number;            // GST amount extracted from netSellingPrice
  cgstAmount: number;           // Central GST
  sgstAmount: number;           // State GST
  igstAmount: number;           // Integrated GST
  grandTotal: number;           // Grand Total (netSellingPrice + shippingCost + codFee)
  roundOff: number;             // round off adjustment
  finalPayable: number;         // Final payable amount (grandTotal - walletCredit)
  items: {
    productName: string;
    quantity: number;
    price: number;              // selling price
    total: number;              // selling line total
    taxableAmount: number;
    gstAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstRate: number;
  }[];
}

export const PricingEngine = {
  calculate({
    items,
    couponCode = null,
    couponDiscount = 0,
    walletAmountToUse = 0,
    shippingState = 'Haryana',
    codFee = 0,
    isPreBooking = false,
  }: {
    items: PricingItem[];
    couponCode?: string | null;
    couponDiscount?: number;
    walletAmountToUse?: number;
    shippingState?: string;
    codFee?: number;
    isPreBooking?: boolean;
  }): PricingResult {
    // Enforcement: Pre-Booking orders NEVER allow COD fee
    const effectiveCodFee = isPreBooking ? 0 : codFee;

    // 1. Catalog calculations
    let productTotal = 0;
    let subtotal = 0;

    items.forEach((item) => {
      const itemMrp = item.comparePrice && item.comparePrice > item.price ? item.comparePrice : item.price;
      productTotal += itemMrp * item.quantity;
      subtotal += item.price * item.quantity;
    });

    const productDiscount = Math.max(0, productTotal - subtotal);

    // Ensure coupon discount does not exceed subtotal
    const actualCouponDiscount = Math.min(couponDiscount, subtotal);
    const netSellingPrice = Math.max(0, subtotal - actualCouponDiscount);

    // 2. Concierge Shipping calculation (free shipping on net orders >= 1999 or 0 subtotal)
    const shippingCost = netSellingPrice >= 1999 || subtotal === 0 ? 0 : 149;

    // 3. Grand Total (Net Selling Price + Shipping + COD Fee)
    const rawGrandTotal = netSellingPrice + shippingCost + effectiveCodFee;
    const grandTotal = Math.max(0, Math.round(rawGrandTotal));

    // 4. Wallet Credit application (cannot exceed grandTotal)
    const actualWalletCredit = Math.min(walletAmountToUse, grandTotal);

    // 5. Final Payable after Credits
    const rawPayable = grandTotal - actualWalletCredit;
    const finalPayable = Math.max(0, Math.round(rawPayable));
    const roundOff = Number((finalPayable - rawPayable).toFixed(2));

    // 6. GST-Inclusive Tax Extraction (from Net Selling Price)
    let totalTaxableAmount = 0;
    let totalGstAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const itemsBreakdown = items.map((item) => {
      const lineSubtotal = item.price * item.quantity;
      
      // Pro-rate discount across items based on subtotal share
      const share = subtotal > 0 ? lineSubtotal / subtotal : 0;
      const itemProDiscount = actualCouponDiscount * share;
      const itemNetLineValue = Math.max(0, lineSubtotal - itemProDiscount);

      const split = GSTService.calculateInclusiveItemGst(
        itemNetLineValue,
        item.quantity,
        shippingState,
        item.gstPercentage
      );

      totalTaxableAmount += split.taxableAmount;
      totalGstAmount += split.gstAmount;
      totalCgst += split.cgst;
      totalSgst += split.sgst;
      totalIgst += split.igst;

      return {
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: lineSubtotal,
        taxableAmount: Number(split.taxableAmount.toFixed(2)),
        gstAmount: Number(split.gstAmount.toFixed(2)),
        cgst: Number(split.cgst.toFixed(2)),
        sgst: Number(split.sgst.toFixed(2)),
        igst: Number(split.igst.toFixed(2)),
        gstRate: Math.round(split.rate * 100),
      };
    });

    // Pro-rate taxable shipping if shippingCost > 0
    if (shippingCost > 0) {
      const shipSplit = GSTService.calculateInclusiveShippingGst(shippingCost, shippingState);
      totalTaxableAmount += shipSplit.taxableAmount;
      totalGstAmount += shipSplit.gstAmount;
      totalCgst += shipSplit.cgst;
      totalSgst += shipSplit.sgst;
      totalIgst += shipSplit.igst;
    }

    // Ensure deterministic precision rounding
    const roundedTaxable = Number(totalTaxableAmount.toFixed(2));
    const roundedGst = Number((netSellingPrice - roundedTaxable).toFixed(2));

    return {
      productTotal,
      productDiscount,
      subtotal,
      couponCode,
      couponDiscount: actualCouponDiscount,
      netSellingPrice,
      walletCredit: actualWalletCredit,
      shippingCost,
      codFee: effectiveCodFee,
      taxableAmount: roundedTaxable,
      gstAmount: roundedGst,
      cgstAmount: Number(totalCgst.toFixed(2)),
      sgstAmount: Number(totalSgst.toFixed(2)),
      igstAmount: Number(totalIgst.toFixed(2)),
      grandTotal,
      roundOff,
      finalPayable,
      items: itemsBreakdown,
    };
  }
};
