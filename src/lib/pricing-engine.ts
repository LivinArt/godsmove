/**
 * PricingEngine — Centralized Commerce Pricing & Tax Calculator
 * Compliant with Indian invoicing standards (GST splits, round-off, catalog discounts).
 */

import { GSTService, GstSplit } from './gst-service';

export interface PricingItem {
  price: number;              // actual selling price (inclusive of tax)
  comparePrice?: number | null; // retail price (MRP, inclusive of tax)
  quantity: number;
  productName: string;
}

export interface PricingResult {
  productTotal: number;       // total catalog retail value (MRP)
  productDiscount: number;    // total catalog markdown discount
  subtotal: number;           // total selling price before coupon
  couponCode: string | null;
  couponDiscount: number;     // discount from applied coupon
  walletCredit: number;       // credits applied
  shippingCost: number;       // shipping charges
  taxableAmount: number;      // taxable base (excluding GST)
  gstAmount: number;          // total GST amount
  cgstAmount: number;         // Central GST
  sgstAmount: number;         // State GST
  igstAmount: number;         // Integrated GST
  roundOff: number;           // round off adjustment
  finalPayable: number;       // final rounded payable amount
  items: {
    productName: string;
    quantity: number;
    price: number;            // selling price
    total: number;            // selling total
    taxableAmount: number;
    gstAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
  }[];
}

export const PricingEngine = {
  calculate({
    items,
    couponCode = null,
    couponDiscount = 0,
    walletAmountToUse = 0,
    shippingState = 'Haryana',
  }: {
    items: PricingItem[];
    couponCode?: string | null;
    couponDiscount?: number;
    walletAmountToUse?: number;
    shippingState?: string;
  }): PricingResult {
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
    const afterCoupon = subtotal - actualCouponDiscount;

    // 2. Shipping calculation (free shipping on orders >= 1999 after coupon discount)
    const shippingCost = afterCoupon >= 1999 || subtotal === 0 ? 0 : 149;

    // 3. Wallet Credit limit checking (cannot exceed subtotal - couponDiscount)
    const actualWalletCredit = Math.min(walletAmountToUse, afterCoupon);
    
    // Net amount inclusive of tax (before wallet application, but after coupon + shipping)
    const netBase = afterCoupon + shippingCost;

    // 4. Tax Calculation (GST calculated on value after coupon discount, inclusive)
    let totalTaxableAmount = 0;
    let totalGstAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const itemsBreakdown = items.map((item) => {
      const lineSubtotal = item.price * item.quantity;
      
      // Pro-rate the coupon discount across items based on their share of subtotal
      const share = subtotal > 0 ? lineSubtotal / subtotal : 0;
      const itemProCoupon = actualCouponDiscount * share;
      const itemNetLineValue = Math.max(0, lineSubtotal - itemProCoupon);

      const split = GSTService.calculateInclusiveItemGst(itemNetLineValue, item.quantity, shippingState);

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
        taxableAmount: split.taxableAmount,
        gstAmount: split.gstAmount,
        cgst: split.cgst,
        sgst: split.sgst,
        igst: split.igst,
      };
    });

    // Calculate GST on shipping if shippingCost > 0
    if (shippingCost > 0) {
      const shipSplit = GSTService.calculateInclusiveShippingGst(shippingCost, shippingState);
      totalTaxableAmount += shipSplit.taxableAmount;
      totalGstAmount += shipSplit.gstAmount;
      totalCgst += shipSplit.cgst;
      totalSgst += shipSplit.sgst;
      totalIgst += shipSplit.igst;
    }

    // 5. Final Payable and Round Off
    const rawPayable = netBase - actualWalletCredit;
    const finalPayable = Math.round(rawPayable);
    const roundOff = Number((finalPayable - rawPayable).toFixed(2));

    return {
      productTotal,
      productDiscount,
      subtotal,
      couponCode,
      couponDiscount: actualCouponDiscount,
      walletCredit: actualWalletCredit,
      shippingCost,
      taxableAmount: Number(totalTaxableAmount.toFixed(2)),
      gstAmount: Number(totalGstAmount.toFixed(2)),
      cgstAmount: Number(totalCgst.toFixed(2)),
      sgstAmount: Number(totalSgst.toFixed(2)),
      igstAmount: Number(totalIgst.toFixed(2)),
      roundOff,
      finalPayable,
      items: itemsBreakdown,
    };
  }
};
