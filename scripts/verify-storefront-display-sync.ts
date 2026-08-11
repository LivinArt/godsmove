/**
 * GODSMOVE STOREFRONT INVENTORY DISPLAY SYNC QA SUITE
 * Validates Section 19 Storefront Display Matrix (Tests 1 through 7).
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runStorefrontDisplaySuite() {
  const { getStorefrontInventoryDisplay } = await import('../src/lib/inventory-service');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GODSMOVE STOREFRONT INVENTORY DISPLAY SYNC SUITE');
  console.log('  Section 19 Test Matrix Verification');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failCount++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 1 — ACTIVE PRE-BOOKING (Total = 100, Alloc = 30, Paid = 2)
  // ─────────────────────────────────────────────────────────────
  console.log('1. Testing TEST 1 (Active Pre-Booking: Total = 100, Alloc = 30, Paid = 2)...');
  const mockTest1 = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 30,
    currentPreBookings: 2,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  const disp1 = getStorefrontInventoryDisplay(mockTest1);
  assert(disp1.isPreBookingActive === true, 'TEST 1: isPreBookingActive is true');
  assert(disp1.numerator === 2, 'TEST 1: Numerator is 2 (got ' + disp1.numerator + ')');
  assert(disp1.denominator === 30, 'TEST 1: Denominator is 30 (got ' + disp1.denominator + ')');
  assert(disp1.remaining === 28, 'TEST 1: Remaining Allocation is 28 (got ' + disp1.remaining + ')');
  assert(disp1.formattedText === '2 / 30 PRE-BOOKED', 'TEST 1: Formatted Text is "2 / 30 PRE-BOOKED" (got "' + disp1.formattedText + '")');

  // ─────────────────────────────────────────────────────────────
  // TEST 2 — ACTIVE PRE-BOOKING FULL (Total = 100, Alloc = 30, Paid = 30)
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Testing TEST 2 (Active Pre-Booking Full: Total = 100, Alloc = 30, Paid = 30)...');
  const mockTest2 = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 30,
    currentPreBookings: 30,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  const disp2 = getStorefrontInventoryDisplay(mockTest2);
  assert(disp2.isPreBookingActive === true, 'TEST 2: isPreBookingActive is true');
  assert(disp2.numerator === 30, 'TEST 2: Numerator is 30');
  assert(disp2.denominator === 30, 'TEST 2: Denominator is 30 (not 100)');
  assert(disp2.remaining === 0, 'TEST 2: Remaining Allocation is 0');
  assert(disp2.isAllocationFull === true, 'TEST 2: isAllocationFull is true');
  assert(disp2.formattedText === '30 / 30 PRE-BOOKED', 'TEST 2: Formatted Text is "30 / 30 PRE-BOOKED"');

  // ─────────────────────────────────────────────────────────────
  // TEST 3 — PRE-BOOKING ENDED (Total = 100, Alloc = 30, Paid = 2, Normal = 5)
  // ─────────────────────────────────────────────────────────────
  console.log('\n3. Testing TEST 3 (Pre-Booking Ended: Total = 100, Alloc = 30, Paid = 2, Normal = 5)...');
  const mockTest3 = {
    totalStock: 100,
    isPreBooking: false, // Pre-booking has ended/launched
    maxPreBooking: 30,
    currentPreBookings: 2,
    normalOrdersCount: 5,
    returnUnits: 0,
  };
  const disp3 = getStorefrontInventoryDisplay(mockTest3);
  assert(disp3.isPreBookingActive === false, 'TEST 3: isPreBookingActive is false');
  assert(disp3.numerator === 7, 'TEST 3: Numerator is 7 (Pre-book 2 + Normal 5, got ' + disp3.numerator + ')');
  assert(disp3.denominator === 100, 'TEST 3: Denominator is 100 (total physical inventory)');
  assert(disp3.remaining === 93, 'TEST 3: Remaining physical inventory is 93');
  assert(disp3.formattedText === '7 / 100 SOLD', 'TEST 3: Formatted Text is "7 / 100 SOLD"');

  // ─────────────────────────────────────────────────────────────
  // TEST 4 — NORMAL EXCLUSIVE RACK (Total = 100, Normal = 12)
  // ─────────────────────────────────────────────────────────────
  console.log('\n4. Testing TEST 4 (Normal Exclusive Rack: Total = 100, Normal = 12)...');
  const mockTest4 = {
    totalStock: 100,
    isPreBooking: false,
    maxPreBooking: 0,
    currentPreBookings: 0,
    normalOrdersCount: 12,
    returnUnits: 0,
  };
  const disp4 = getStorefrontInventoryDisplay(mockTest4);
  assert(disp4.isPreBookingActive === false, 'TEST 4: isPreBookingActive is false');
  assert(disp4.numerator === 12, 'TEST 4: Numerator is 12');
  assert(disp4.denominator === 100, 'TEST 4: Denominator is 100');
  assert(disp4.formattedText === '12 / 100 SOLD', 'TEST 4: Formatted Text is "12 / 100 SOLD"');

  // ─────────────────────────────────────────────────────────────
  // TEST 5 — NORMAL DROPS (Total = 100, Normal = 8)
  // ─────────────────────────────────────────────────────────────
  console.log('\n5. Testing TEST 5 (Normal Drops: Total = 100, Normal = 8)...');
  const mockTest5 = {
    totalStock: 100,
    isPreBooking: false,
    maxPreBooking: 0,
    currentPreBookings: 0,
    normalOrdersCount: 8,
    returnUnits: 0,
  };
  const disp5 = getStorefrontInventoryDisplay(mockTest5);
  assert(disp5.isPreBookingActive === false, 'TEST 5: isPreBookingActive is false');
  assert(disp5.numerator === 8, 'TEST 5: Numerator is 8');
  assert(disp5.denominator === 100, 'TEST 5: Denominator is 100');
  assert(disp5.formattedText === '8 / 100 SOLD', 'TEST 5: Formatted Text is "8 / 100 SOLD"');

  // ─────────────────────────────────────────────────────────────
  // TEST 6 — PRE-BOOKING ALLOCATION = TOTAL (Total = 100, Alloc = 100, Paid = 2)
  // ─────────────────────────────────────────────────────────────
  console.log('\n6. Testing TEST 6 (Pre-Booking Alloc = Total: Total = 100, Alloc = 100, Paid = 2)...');
  const mockTest6Pre = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 100,
    currentPreBookings: 2,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  const disp6Pre = getStorefrontInventoryDisplay(mockTest6Pre);
  assert(disp6Pre.formattedText === '2 / 100 PRE-BOOKED', 'TEST 6 (Active Pre-Booking): Formatted Text is "2 / 100 PRE-BOOKED"');

  const mockTest6Post = {
    ...mockTest6Pre,
    isPreBooking: false,
  };
  const disp6Post = getStorefrontInventoryDisplay(mockTest6Post);
  assert(disp6Post.formattedText === '2 / 100 SOLD', 'TEST 6 (Post Launch): Formatted Text is "2 / 100 SOLD"');

  // ─────────────────────────────────────────────────────────────
  // TEST 7 — SOLD OUT (Total = 100, Alloc = 100, Paid = 100)
  // ─────────────────────────────────────────────────────────────
  console.log('\n7. Testing TEST 7 (Sold Out: Total = 100, Alloc = 100, Paid = 100)...');
  const mockTest7Pre = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 100,
    currentPreBookings: 100,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  const disp7Pre = getStorefrontInventoryDisplay(mockTest7Pre);
  assert(disp7Pre.formattedText === '100 / 100 PRE-BOOKED', 'TEST 7 (Active Pre-Booking): Formatted Text is "100 / 100 PRE-BOOKED"');

  const mockTest7Post = {
    ...mockTest7Pre,
    isPreBooking: false,
  };
  const disp7Post = getStorefrontInventoryDisplay(mockTest7Post);
  assert(disp7Post.formattedText === '100 / 100 SOLD', 'TEST 7 (Post Launch): Formatted Text is "100 / 100 SOLD"');
  assert(disp7Post.isSoldOut === true, 'TEST 7 (Post Launch): isSoldOut is true');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  STOREFRONT SUITE COMPLETED: ${passCount} PASS | ${failCount} FAIL`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runStorefrontDisplaySuite().catch((err) => {
  console.error('Storefront Display Suite Error:', err);
  process.exit(1);
});
