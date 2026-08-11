import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifyPreBookingLifecycleArchitecture() {
  const { prisma } = await import('../src/lib/prisma');
  const { isPreBookingActive, getProductLaunchState, getPurchaseMode } = await import('../src/lib/launch-engine-core');
  const { LaunchState, PurchaseMode } = await import('../src/types/launch');

  console.log('====================================================');
  console.log('GODSMOVE — PRE-BOOKING LIFECYCLE & COMMERCE QA');
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

  // 1. Test Past Launch Date Product (Expired Pre-Booking -> LIVE)
  const expiredProduct = {
    id: 'prod-expired-1',
    name: 'Premium Urban Tee, Drop Shoulder Tee, Drop1',
    isPreBooking: true,
    launchDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    preBookingOpenDateTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
    status: 'ACTIVE',
  };

  const expiredLaunchState = getProductLaunchState(expiredProduct);
  const expiredPurchaseMode = getPurchaseMode(expiredProduct);
  const expiredIsActive = isPreBookingActive(expiredProduct);

  assert(
    expiredLaunchState === LaunchState.LIVE,
    'TEST 1: Expired Pre-Booking Product evaluates LaunchState as LIVE',
    `Received: ${expiredLaunchState}`
  );
  assert(
    expiredPurchaseMode === PurchaseMode.BUY_NOW,
    'TEST 2: Expired Pre-Booking Product evaluates PurchaseMode as BUY_NOW',
    `Received: ${expiredPurchaseMode}`
  );
  assert(
    expiredIsActive === false,
    'TEST 3: Expired Pre-Booking Product evaluates isPreBookingActive as FALSE',
    `Received: ${expiredIsActive}`
  );

  // 2. Test Future Launch Date Product (Active Pre-Booking)
  const activePreBookProduct = {
    id: 'prod-active-1',
    name: 'Future Drop Hoodie',
    isPreBooking: true,
    launchDateTime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days in future
    preBookingOpenDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'ACTIVE',
  };

  const activeLaunchState = getProductLaunchState(activePreBookProduct);
  const activePurchaseMode = getPurchaseMode(activePreBookProduct);
  const activeIsActive = isPreBookingActive(activePreBookProduct);

  assert(
    activeLaunchState === LaunchState.PRE_BOOKING,
    'TEST 4: Future Pre-Booking Product evaluates LaunchState as PRE_BOOKING',
    `Received: ${activeLaunchState}`
  );
  assert(
    activePurchaseMode === PurchaseMode.PRE_BOOK,
    'TEST 5: Future Pre-Booking Product evaluates PurchaseMode as PRE_BOOK',
    `Received: ${activePurchaseMode}`
  );
  assert(
    activeIsActive === true,
    'TEST 6: Future Pre-Booking Product evaluates isPreBookingActive as TRUE',
    `Received: ${activeIsActive}`
  );

  // 3. Test Database Query for Target Product: "Premium Urban Tee, Drop Shoulder Tee, Drop1"
  const targetProduct = await prisma.product.findFirst({
    where: {
      slug: 'premium-urban-tee-drop-shoulder-tee-drop1',
    },
    include: {
      category: true,
      variants: { include: { inventory: true } },
    },
  });

  if (targetProduct) {
    const liveState = getProductLaunchState(targetProduct);
    const liveMode = getPurchaseMode(targetProduct);
    const liveActive = isPreBookingActive(targetProduct);

    console.log('\n--- TARGET DB PRODUCT AUDIT ---');
    console.log(`ID: ${targetProduct.id}`);
    console.log(`Name: ${targetProduct.name}`);
    console.log(`Slug: ${targetProduct.slug}`);
    console.log(`DB isPreBooking flag: ${targetProduct.isPreBooking}`);
    console.log(`DB launchDateTime: ${targetProduct.launchDateTime}`);
    console.log(`Calculated LaunchState: ${liveState}`);
    console.log(`Calculated PurchaseMode: ${liveMode}`);
    console.log(`Calculated isPreBookingActive: ${liveActive}`);

    assert(
      liveState === LaunchState.LIVE,
      'TEST 7: Target DB Product "Premium Urban Tee" evaluates as LIVE in database audit'
    );
    assert(
      liveActive === false,
      'TEST 8: Target DB Product "Premium Urban Tee" isPreBookingActive evaluates as FALSE'
    );
  } else {
    console.warn('[WARN] Target product slug "premium-urban-tee-drop-shoulder-tee-drop1" not found in local DB');
  }

  console.log('\n====================================================');
  console.log(`PRE-BOOKING LIFECYCLE QA: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyPreBookingLifecycleArchitecture();
