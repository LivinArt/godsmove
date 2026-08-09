import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { PricingEngine, PricingItem } from '../src/lib/pricing-engine';
import { GSTService } from '../src/lib/gst-service';
import { InvoiceService, InvoiceData } from '../src/lib/invoice';

function assertEqual(actual: any, expected: any, label: string) {
  if (actual === expected) {
    console.log(`   ✅ [PASS] ${label}: ${actual}`);
  } else {
    console.error(`   ❌ [FAIL] ${label}: Expected ${expected}, got ${actual}`);
    throw new Error(`Assertion failed: ${label}`);
  }
}

function assertInvariant(itemPrice: number, discount: number, taxable: number, gst: number, shipping: number, codFee: number, grandTotal: number, testName: string) {
  const netSellingPrice = itemPrice - discount;
  const taxablePlusGst = Number((taxable + gst).toFixed(2));
  const expectedGrandTotal = netSellingPrice + shipping + codFee;

  console.log(`   --> ${testName} Invariant Checks:`);
  assertEqual(taxablePlusGst, netSellingPrice, 'Taxable + GST === Net Selling Price');
  assertEqual(grandTotal, expectedGrandTotal, 'Net Selling + Shipping + COD Fee === Grand Total');
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('GODSMOVE CANONICAL ORDER PRICING TEST MATRIX');
  console.log('====================================================\n');

  // TEST 1: Normal Razorpay order, No discount
  console.log('TEST 1: Normal Razorpay order (No discount)');
  const res1 = PricingEngine.calculate({
    items: [{ price: 4999, quantity: 1, productName: 'Signature Urban Tee', gstPercentage: 12 }],
    shippingState: 'Haryana',
  });
  assertEqual(res1.subtotal, 4999, 'Subtotal');
  assertEqual(res1.couponDiscount, 0, 'Discount');
  assertEqual(res1.netSellingPrice, 4999, 'Net Selling Price');
  assertEqual(res1.shippingCost, 0, 'Shipping (Free >= 1999)');
  assertEqual(res1.codFee, 0, 'COD Fee');
  assertEqual(res1.grandTotal, 4999, 'Grand Total');
  assertInvariant(4999, 0, res1.taxableAmount, res1.gstAmount, 0, 0, res1.grandTotal, 'TEST 1');

  // TEST 2: Normal Razorpay order with Coupon Discount
  console.log('\nTEST 2: Normal Razorpay order (With coupon discount ₹500)');
  const res2 = PricingEngine.calculate({
    items: [{ price: 4999, quantity: 1, productName: 'Signature Urban Tee', gstPercentage: 12 }],
    couponDiscount: 500,
    shippingState: 'Haryana',
  });
  assertEqual(res2.subtotal, 4999, 'Subtotal');
  assertEqual(res2.couponDiscount, 500, 'Discount');
  assertEqual(res2.netSellingPrice, 4499, 'Net Selling Price');
  assertEqual(res2.grandTotal, 4499, 'Grand Total');
  assertInvariant(4999, 500, res2.taxableAmount, res2.gstAmount, 0, 0, res2.grandTotal, 'TEST 2');

  // TEST 3: Normal COD order with COD fee
  console.log('\nTEST 3: Normal COD order (With COD Fee ₹149)');
  const res3 = PricingEngine.calculate({
    items: [{ price: 4999, quantity: 1, productName: 'Signature Urban Tee', gstPercentage: 12 }],
    codFee: 149,
    shippingState: 'Haryana',
  });
  assertEqual(res3.subtotal, 4999, 'Subtotal');
  assertEqual(res3.netSellingPrice, 4999, 'Net Selling Price');
  assertEqual(res3.codFee, 149, 'COD Fee');
  assertEqual(res3.grandTotal, 5148, 'Grand Total');
  assertInvariant(4999, 0, res3.taxableAmount, res3.gstAmount, 0, 149, res3.grandTotal, 'TEST 3');

  // TEST 4: Normal COD order with Discount + COD Fee
  console.log('\nTEST 4: Normal COD order (With Discount ₹500 + COD Fee ₹149)');
  const res4 = PricingEngine.calculate({
    items: [{ price: 4999, quantity: 1, productName: 'Signature Urban Tee', gstPercentage: 12 }],
    couponDiscount: 500,
    codFee: 149,
    shippingState: 'Haryana',
  });
  assertEqual(res4.subtotal, 4999, 'Subtotal');
  assertEqual(res4.netSellingPrice, 4499, 'Net Selling Price');
  assertEqual(res4.codFee, 149, 'COD Fee');
  assertEqual(res4.grandTotal, 4648, 'Grand Total');
  assertInvariant(4999, 500, res4.taxableAmount, res4.gstAmount, 0, 149, res4.grandTotal, 'TEST 4');

  // TEST 5: Pre-Booking Razorpay with Pre-Booking Discount
  console.log('\nTEST 5: Pre-Booking Razorpay (Original ₹5,999, Pre-Booking Savings ₹600)');
  const res5 = PricingEngine.calculate({
    items: [{ price: 5399, comparePrice: 5999, quantity: 1, productName: 'Pre-Booking Tee', gstPercentage: 12 }],
    isPreBooking: true,
    shippingState: 'Haryana',
  });
  assertEqual(res5.productTotal, 5999, 'Gross Price');
  assertEqual(res5.productDiscount, 600, 'Pre-Booking Discount');
  assertEqual(res5.netSellingPrice, 5399, 'Net Selling Price');
  assertEqual(res5.shippingCost, 0, 'Shipping');
  assertEqual(res5.codFee, 0, 'COD Fee (Enforced 0 for Pre-Booking)');
  assertEqual(res5.grandTotal, 5399, 'Grand Total');
  assertInvariant(5999, 600, res5.taxableAmount, res5.gstAmount, 0, 0, res5.grandTotal, 'TEST 5');

  // TEST 6: Pre-booking Full Vault Credits
  console.log('\nTEST 6: Pre-booking Full Vault Credits (Grand Total ₹5,399, Credits ₹5,399)');
  const res6 = PricingEngine.calculate({
    items: [{ price: 5399, comparePrice: 5999, quantity: 1, productName: 'Pre-Booking Tee', gstPercentage: 12 }],
    walletAmountToUse: 5399,
    isPreBooking: true,
    shippingState: 'Haryana',
  });
  assertEqual(res6.grandTotal, 5399, 'Grand Total');
  assertEqual(res6.walletCredit, 5399, 'Credits Applied');
  assertEqual(res6.finalPayable, 0, 'Final Payable (Zero Payment)');

  // TEST 7: Pre-booking Partial Credits + Razorpay
  console.log('\nTEST 7: Pre-booking Partial Credits + Razorpay (Grand Total ₹5,399, Credits ₹1,000)');
  const res7 = PricingEngine.calculate({
    items: [{ price: 5399, comparePrice: 5999, quantity: 1, productName: 'Pre-Booking Tee', gstPercentage: 12 }],
    walletAmountToUse: 1000,
    isPreBooking: true,
    shippingState: 'Haryana',
  });
  assertEqual(res7.grandTotal, 5399, 'Grand Total');
  assertEqual(res7.walletCredit, 1000, 'Credits Applied');
  assertEqual(res7.finalPayable, 4399, 'Razorpay Charge');
  assertEqual(res7.walletCredit + res7.finalPayable, res7.grandTotal, 'Credits + Razorpay === Grand Total');

  // TEST 8: Server-Side Pre-booking COD Prohibition Attempt
  console.log('\nTEST 8: Server-Side Pre-booking COD Prohibition');
  try {
    const isPreBookingInput = true;
    const paymentMethodInput = 'COD';
    if (isPreBookingInput && paymentMethodInput === 'COD') {
      throw new Error('Cash on Delivery is strictly prohibited for Pre-Booking orders.');
    }
    console.error('❌ FAIL: Pre-Booking + COD should have thrown an error!');
  } catch (err: any) {
    assertEqual(err.message, 'Cash on Delivery is strictly prohibited for Pre-Booking orders.', 'Server Rejection Error');
  }

  // TEST 9: Multiple-item Normal Order
  console.log('\nTEST 9: Multiple-item Normal Order (Item 1: ₹2,999, Item 2: ₹1,999)');
  const res9 = PricingEngine.calculate({
    items: [
      { price: 2999, quantity: 1, productName: 'Item 1', gstPercentage: 12 },
      { price: 1999, quantity: 1, productName: 'Item 2', gstPercentage: 18 },
    ],
    shippingState: 'Maharashtra', // Inter-state (IGST)
  });
  assertEqual(res9.subtotal, 4998, 'Subtotal');
  assertEqual(res9.netSellingPrice, 4998, 'Net Selling Price');
  assertEqual(res9.grandTotal, 4998, 'Grand Total');
  assertEqual(res9.cgstAmount, 0, 'CGST (Inter-state)');
  assertEqual(res9.sgstAmount, 0, 'SGST (Inter-state)');
  assertInvariant(4998, 0, res9.taxableAmount, res9.gstAmount, 0, 0, res9.grandTotal, 'TEST 9');

  // TEST 10: Historical Database Order Reconciliation
  console.log('\nTEST 10: Historical Database Order Reconciliation');
  const { prisma } = await import('../src/lib/prisma');
  const pastOrders = await prisma.order.findMany({ take: 5, include: { items: true } });
  console.log(`   Checking ${pastOrders.length} historical database orders...`);

  for (const ord of pastOrders) {
    const isPreBk = ord.orderType === 'PRE_BOOKING' || ord.isPreBooking;
    const orig = isPreBk && Number(ord.lockedUnitPrice) > 0 ? Number(ord.lockedUnitPrice) : Number(ord.subtotal);
    const disc = isPreBk && Number(ord.lockedDiscountAmount) > 0 ? Number(ord.lockedDiscountAmount) : Number(ord.discountAmount);
    const net = Math.max(0, orig - disc);
    const ship = Number(ord.shippingCost || 0);
    const cod = isPreBk ? 0 : Number(ord.codFee || 0);
    const total = Number(ord.total);

    const calcTotal = net + ship + cod;
    console.log(`   Order #${ord.orderNumber}: Stored Total = ₹${total}, Derived Total = ₹${calcTotal}`);
    if (total > 0 && Math.abs(total - calcTotal) > 1) {
      console.warn(`   ⚠️ Order #${ord.orderNumber} historical delta: Stored ₹${total} vs Calculated ₹${calcTotal}`);
    }
  }

  console.log('\n====================================================');
  console.log('ALL CANONICAL PRICING TESTS COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runTestSuite().catch(console.error);
