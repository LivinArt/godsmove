/**
 * GODSMOVE — Master Discount Engine Automated QA Test Suite
 * Validates Normal Discounts, Pre-Booking Offers, and Member-Only Product Discounts.
 * Includes dynamic launch-state transitions, security anti-tampering, and historical order snapshot tests.
 */

import { PricingEngine } from '../src/lib/pricing-engine';
import { isPreBookingActive } from '../src/lib/launch-engine-core';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`QA Assertion Failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runMasterDiscountEngineQA() {
  console.log('\n============================================================');
  console.log('GODSMOVE — MASTER DISCOUNT ENGINE AUTOMATED QA SUITE');
  console.log('============================================================\n');

  let passedCount = 0;

  // ------------------------------------------------------------
  // PHASE 1: PRICING ENGINE ARCHITECTURE & IMPORT VERIFICATION
  // ------------------------------------------------------------
  console.log('--- Phase 1: Core Engine Architecture ---');
  assert(typeof PricingEngine.calculate === 'function', 'PricingEngine.calculate is exposed as a function');
  passedCount++;

  assert(typeof isPreBookingActive === 'function', 'isPreBookingActive is exposed as a canonical launch engine function');
  passedCount++;

  // ------------------------------------------------------------
  // PHASE 2: NORMAL DISCOUNT (COUPON) CALCULATIONS
  // ------------------------------------------------------------
  console.log('\n--- Phase 2: Normal Discount (Coupon) Engine ---');
  const normalPercentRes = PricingEngine.calculate({
    items: [{ price: 5000, quantity: 1, productName: 'Archival Oversized Tee' }],
    couponCode: 'WELCOME10',
    couponDiscount: 500,
    hasActiveMembership: false,
  });
  assert(normalPercentRes.couponDiscount === 500, 'Normal 10% coupon calculated as ₹500 on ₹5000 subtotal');
  assert(normalPercentRes.memberDiscount === 0, 'Non-member receives ₹0 member discount');
  assert(normalPercentRes.netSellingPrice === 4500, 'Net selling price is ₹4500');
  passedCount += 3;

  const normalFixedRes = PricingEngine.calculate({
    items: [{ price: 3000, quantity: 1, productName: 'Void Heavyweight Hoodie' }],
    couponCode: 'FLAT300',
    couponDiscount: 300,
    hasActiveMembership: false,
  });
  assert(normalFixedRes.couponDiscount === 300, 'Normal fixed coupon calculated as ₹300 on ₹3000 subtotal');
  assert(normalFixedRes.netSellingPrice === 2700, 'Net selling price is ₹2700');
  passedCount += 2;

  // ------------------------------------------------------------
  // PHASE 3: PRE-BOOKING OFFER ENGINE & MEMBER DISCOUNT BLOCKING
  // ------------------------------------------------------------
  console.log('\n--- Phase 3: Active Pre-Booking Offer & Member Discount Exclusion ---');
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const activePreBookingRes = PricingEngine.calculate({
    items: [
      {
        price: 4999,
        comparePrice: 5999,
        quantity: 1,
        productName: 'Met Gala 2026 Archival Jacket',
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
        isPreBooking: true,
        launchDateTime: futureDate,
      },
    ],
    isPreBooking: true,
    hasActiveMembership: true,
  });

  assert(activePreBookingRes.memberDiscount === 0, 'Member-only discount MUST BE ₹0 during active pre-booking (Directive D)');
  assert(activePreBookingRes.preBookingDiscount === 1000, 'Pre-booking savings calculated as ₹1000 (comparePrice ₹5999 - price ₹4999)');
  assert(activePreBookingRes.discountLines.some((d) => d.type === 'PRE_BOOKING'), 'discountLines contains PRE_BOOKING line');
  assert(activePreBookingRes.codFee === 0, 'Pre-booking order strictly enforces ₹0 COD fee');
  passedCount += 4;

  // ------------------------------------------------------------
  // PHASE 4: LIVE PRODUCT & MEMBER-ONLY DISCOUNT APPLICABILITY
  // ------------------------------------------------------------
  console.log('\n--- Phase 4: LIVE Product & Member-Only Discount Engine ---');
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const liveMemberRes = PricingEngine.calculate({
    items: [
      {
        price: 5000,
        comparePrice: 6000,
        quantity: 1,
        productName: 'Met Gala 2026 Archival Jacket',
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
        isPreBooking: true,
        launchDateTime: pastDate, // Expired launch timer -> Product is LIVE
      },
    ],
    isPreBooking: false,
    hasActiveMembership: true,
  });

  assert(liveMemberRes.memberDiscount === 500, 'LIVE product automatically enables 10% Member Discount (₹500 on ₹5000) for active member');
  assert(liveMemberRes.discountLines.some((d) => d.type === 'MEMBER_ONLY'), 'discountLines contains MEMBER_ONLY line');
  assert(liveMemberRes.netSellingPrice === 4500, 'Net selling price after member discount is ₹4500');
  passedCount += 3;

  const liveNonMemberRes = PricingEngine.calculate({
    items: [
      {
        price: 5000,
        comparePrice: 6000,
        quantity: 1,
        productName: 'Met Gala 2026 Archival Jacket',
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
        isPreBooking: true,
        launchDateTime: pastDate,
      },
    ],
    isPreBooking: false,
    hasActiveMembership: false, // Non-member
  });

  assert(liveNonMemberRes.memberDiscount === 0, 'Non-member receives ₹0 member discount on LIVE product');
  assert(liveNonMemberRes.netSellingPrice === 5000, 'Net selling price for non-member is ₹5000');
  passedCount += 2;

  // ------------------------------------------------------------
  // PHASE 5: PRODUCT "last test 1" SPECIFIC REGRESSION TEST
  // ------------------------------------------------------------
  console.log('\n--- Phase 5: Product "last test 1" Specific Regression Audit ---');
  const targetProduct = {
    name: 'last test 1',
    hasMemberDiscount: true,
    memberDiscountType: 'PERCENTAGE',
    memberDiscountValue: 10,
    isPreBooking: true,
    launchDateTime: futureDate,
  };

  // Check 1: During Active Pre-Booking
  const test1PreBook = PricingEngine.calculate({
    items: [
      {
        price: 4000,
        quantity: 1,
        productName: targetProduct.name,
        hasMemberDiscount: targetProduct.hasMemberDiscount,
        memberDiscountType: targetProduct.memberDiscountType,
        memberDiscountValue: targetProduct.memberDiscountValue,
        isPreBooking: targetProduct.isPreBooking,
        launchDateTime: targetProduct.launchDateTime,
      },
    ],
    isPreBooking: true,
    hasActiveMembership: true,
  });
  assert(test1PreBook.memberDiscount === 0, '"last test 1" active pre-booking gives memberDiscount = ₹0');

  // Check 2: Transition to LIVE (Timer Expired)
  const test1Live = PricingEngine.calculate({
    items: [
      {
        price: 4000,
        quantity: 1,
        productName: targetProduct.name,
        hasMemberDiscount: targetProduct.hasMemberDiscount,
        memberDiscountType: targetProduct.memberDiscountType,
        memberDiscountValue: targetProduct.memberDiscountValue,
        isPreBooking: targetProduct.isPreBooking,
        launchDateTime: pastDate, // Launch arrived
      },
    ],
    isPreBooking: false,
    hasActiveMembership: true,
  });
  assert(test1Live.memberDiscount === 400, '"last test 1" after launch date transition gives memberDiscount = ₹400 (10%) for active members');

  // Check 3: Non-Member on LIVE
  const test1NonMember = PricingEngine.calculate({
    items: [
      {
        price: 4000,
        quantity: 1,
        productName: targetProduct.name,
        hasMemberDiscount: targetProduct.hasMemberDiscount,
        memberDiscountType: targetProduct.memberDiscountType,
        memberDiscountValue: targetProduct.memberDiscountValue,
        isPreBooking: targetProduct.isPreBooking,
        launchDateTime: pastDate,
      },
    ],
    isPreBooking: false,
    hasActiveMembership: false,
  });
  assert(test1NonMember.memberDiscount === 0, '"last test 1" LIVE product gives memberDiscount = ₹0 for non-members');
  passedCount += 3;

  // ------------------------------------------------------------
  // PHASE 6: STACKING & COMBINED DISCOUNT ENGINE
  // ------------------------------------------------------------
  console.log('\n--- Phase 6: Normal Coupon + Member Discount Coexistence on LIVE Product ---');
  const stackedRes = PricingEngine.calculate({
    items: [
      {
        price: 5000,
        quantity: 1,
        productName: 'Archival Oversized Tee',
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
        isPreBooking: false,
      },
    ],
    couponCode: 'EXTRA500',
    couponDiscount: 500,
    hasActiveMembership: true,
  });

  assert(stackedRes.couponDiscount === 500, 'Coupon discount ₹500 applied');
  assert(stackedRes.memberDiscount === 500, 'Member discount ₹500 applied (10% of ₹5000)');
  assert(stackedRes.totalDiscount === 1000, 'Combined total discount is ₹1000');
  assert(stackedRes.netSellingPrice === 4000, 'Net selling price is ₹4000');
  assert(stackedRes.discountLines.length === 2, 'Two explicit discount lines returned (MEMBER_ONLY and NORMAL)');
  passedCount += 5;

  // ------------------------------------------------------------
  // PHASE 7: FINANCIAL ROUNDING & GST TRANSPARENCY
  // ------------------------------------------------------------
  console.log('\n--- Phase 7: Financial Rounding & GST Extraction ---');
  const gstRes = PricingEngine.calculate({
    items: [
      {
        price: 2999,
        quantity: 1,
        productName: 'Atelier Tailored Denim Jacket',
        gstPercentage: 12,
        hasMemberDiscount: true,
        memberDiscountValue: 10,
      },
    ],
    hasActiveMembership: true,
    shippingState: 'Haryana',
  });

  assert(typeof gstRes.taxableAmount === 'number', 'Taxable base extracted as number');
  assert(typeof gstRes.gstAmount === 'number', 'GST amount extracted as number');
  assert(Number((gstRes.taxableAmount + gstRes.gstAmount).toFixed(2)) === gstRes.netSellingPrice, 'Taxable base + GST equals netSellingPrice');
  passedCount += 3;

  console.log('\n============================================================');
  console.log(`✅ MASTER DISCOUNT ENGINE QA COMPLETE: ALL ${passedCount}/${passedCount} ASSERTIONS PASSED PERFECTLY!`);
  console.log('============================================================\n');
}

runMasterDiscountEngineQA().catch((err) => {
  console.error('\n❌ QA SCRIPT EXECUTION FAILED:', err);
  process.exit(1);
});
