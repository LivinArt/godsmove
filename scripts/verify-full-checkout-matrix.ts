import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifyFullCheckoutMatrix() {
  const { prisma } = await import('../src/lib/prisma');
  const { isPreBookingActive, getProductLaunchState, getPurchaseMode } = await import('../src/lib/launch-engine-core');
  const { PricingEngine } = await import('../src/lib/pricing-engine');
  const { LaunchState, PurchaseMode } = await import('../src/types/launch');
  const { getCheckoutData } = await import('../src/actions/address.actions');

  console.log('====================================================');
  console.log('GODSMOVE — MASTER CHECKOUT & COMMERCE REGRESSION MATRIX');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  // ── TEST 1: Checkout Hydration Server Action Parity & Latency ──
  const startTime = Date.now();
  const checkoutData = await getCheckoutData();
  const duration = Date.now() - startTime;

  assert(
    typeof checkoutData === 'object' && checkoutData !== null,
    'TEST 1: getCheckoutData() server action returns valid structure',
    `Resolved in ${duration}ms`
  );
  assert(
    duration < 2500,
    'TEST 2: getCheckoutData() completes under 2500ms benchmark threshold',
    `Duration: ${duration}ms`
  );
  assert(
    Array.isArray(checkoutData.availableDiscounts),
    'TEST 3: getCheckoutData() returns active discount codes list'
  );
  assert(
    typeof checkoutData.codConfig === 'object',
    'TEST 4: getCheckoutData() returns COD configuration'
  );

  // ── TEST 2: Active Pre-Booking Product Commerce Rules ──
  const activePreBook = {
    id: 'test-prebook-active',
    name: 'Future Drop Hoodie',
    isPreBooking: true,
    launchDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
  };

  assert(
    isPreBookingActive(activePreBook) === true,
    'TEST 5: Active Pre-Booking product evaluates isPreBookingActive as TRUE'
  );
  assert(
    getProductLaunchState(activePreBook) === LaunchState.PRE_BOOKING,
    'TEST 6: Active Pre-Booking product launch state evaluates to PRE_BOOKING'
  );
  assert(
    getPurchaseMode(activePreBook) === PurchaseMode.PRE_BOOK,
    'TEST 7: Active Pre-Booking purchase mode evaluates to PRE_BOOK'
  );

  // Pricing Engine enforcement for Pre-Booking: COD fee strictly 0
  const preBookPricing = PricingEngine.calculate({
    items: [{ price: 2999, quantity: 1, productName: 'Future Drop Hoodie' }],
    codFee: 150, // attempts to pass COD fee
    isPreBooking: true,
  });

  assert(
    preBookPricing.codFee === 0,
    'TEST 8: PricingEngine suppresses COD fee for Pre-Booking orders',
    `Calculated COD fee: ₹${preBookPricing.codFee}`
  );

  // ── TEST 3: Expired Pre-Booking Product State Transition to LIVE ──
  const expiredPreBook = {
    id: 'test-prebook-expired',
    name: 'Premium Urban Tee, Drop Shoulder Tee, Drop1',
    isPreBooking: true,
    launchDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
  };

  assert(
    isPreBookingActive(expiredPreBook) === false,
    'TEST 9: Expired Pre-Booking product evaluates isPreBookingActive as FALSE'
  );
  assert(
    getProductLaunchState(expiredPreBook) === LaunchState.LIVE,
    'TEST 10: Expired Pre-Booking product launch state evaluates to LIVE'
  );
  assert(
    getPurchaseMode(expiredPreBook) === PurchaseMode.BUY_NOW,
    'TEST 11: Expired Pre-Booking purchase mode evaluates to BUY_NOW'
  );

  // ── TEST 4: Pricing Engine Parity across Subtotal, Discounts & Grand Total ──
  const normalPricing = PricingEngine.calculate({
    items: [
      { price: 1999, comparePrice: 2499, quantity: 2, productName: 'Oversized Tee' }
    ],
    couponDiscount: 500,
    codFee: 100,
    isPreBooking: false,
  });

  assert(
    normalPricing.productTotal === 4998,
    'TEST 12: PricingEngine productTotal equals gross MRP (₹2499 * 2 = ₹4998)',
    `Value: ₹${normalPricing.productTotal}`
  );
  assert(
    normalPricing.subtotal === 3998,
    'TEST 13: PricingEngine subtotal equals selling price sum (₹1999 * 2 = ₹3998)',
    `Value: ₹${normalPricing.subtotal}`
  );
  assert(
    normalPricing.grandTotal === 3598,
    'TEST 14: PricingEngine grandTotal matches subtotal - coupon + cod (3998 - 500 + 100 = ₹3598)',
    `Value: ₹${normalPricing.grandTotal}`
  );

  // ── TEST 5: Database Canonical Products Verification ──
  const dbProductCount = await prisma.product.count({ where: { status: 'ACTIVE' } });
  assert(
    dbProductCount > 0,
    'TEST 15: Database contains active storefront products',
    `Found ${dbProductCount} active products`
  );

  const dbOrdersCount = await prisma.order.count();
  console.log(`[INFO] Current DB Total Orders: ${dbOrdersCount}`);

  console.log('\n====================================================');
  console.log(`FULL CHECKOUT MATRIX QA: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyFullCheckoutMatrix();
