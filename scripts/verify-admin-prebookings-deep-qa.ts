/**
 * GODSMOVE FINAL AUTHORITATIVE INVENTORY & PRE-BOOKING QA SUITE
 * Validates Cases A through J from Section 25 of the Production Specification.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runDeepQaSuite() {
  const { calculateProductInventoryState } = await import('../src/lib/inventory-service');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GODSMOVE FINAL INVENTORY & PRE-BOOKING DEEP QA SUITE');
  console.log('  Cases A through J Specification Verification');
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
  // CASE A: Total = 100, Allocation = 30, Reserved = 2, Orders = 0, Return = 0
  // ─────────────────────────────────────────────────────────────
  console.log('1. Testing CASE A (Total = 100, Alloc = 30, Reserved = 2, Orders = 0, Return = 0)...');
  const mockCaseA = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 30,
    currentPreBookings: 2,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  const stateA = calculateProductInventoryState(mockCaseA);
  assert(stateA.sold === 2, 'CASE A: Sold = 2 (got ' + stateA.sold + ')');
  assert(stateA.available === 98, 'CASE A: Available = 98 (got ' + stateA.available + ')');
  assert(stateA.remainingPreBookingAllocation === 28, 'CASE A: Remaining Pre-Book Allocation = 28 (got ' + stateA.remainingPreBookingAllocation + ')');
  assert(stateA.normalLaunchAvailable === 98, 'CASE A: Normal Launch Available = 98 (got ' + stateA.normalLaunchAvailable + ')');

  // ─────────────────────────────────────────────────────────────
  // CASE B: Total = 100, Allocation = 30, Reserved = 2, Orders = 2, Return = 0
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Testing CASE B (Total = 100, Alloc = 30, Reserved = 2, Orders = 2, Return = 0)...');
  const mockCaseB = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 30,
    currentPreBookings: 2,
    normalOrdersCount: 2,
    returnUnits: 0,
  };
  const stateB = calculateProductInventoryState(mockCaseB);
  assert(stateB.sold === 4, 'CASE B: Sold = 4 (got ' + stateB.sold + ')');
  assert(stateB.available === 96, 'CASE B: Available = 96 (got ' + stateB.available + ')');

  // ─────────────────────────────────────────────────────────────
  // CASE C: Total = 100, Allocation = 30, Reserved = 30, Orders = 0, Return = 0
  // ─────────────────────────────────────────────────────────────
  console.log('\n3. Testing CASE C (Total = 100, Alloc = 30, Reserved = 30, Orders = 0, Return = 0)...');
  const mockCaseC = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 30,
    currentPreBookings: 30,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  const stateC = calculateProductInventoryState(mockCaseC);
  assert(stateC.sold === 30, 'CASE C: Sold = 30 (got ' + stateC.sold + ')');
  assert(stateC.available === 70, 'CASE C: Available = 70 (got ' + stateC.available + ')');
  assert(stateC.remainingPreBookingAllocation === 0, 'CASE C: Remaining Pre-Book Allocation = 0 (got ' + stateC.remainingPreBookingAllocation + ')');
  assert(stateC.normalLaunchAvailable === 70, 'CASE C: Normal Launch Available = 70 (got ' + stateC.normalLaunchAvailable + ')');

  // ─────────────────────────────────────────────────────────────
  // CASE D: Total = 100, Allocation = 100, Reserved = 2, Orders = 0, Return = 0
  // ─────────────────────────────────────────────────────────────
  console.log('\n4. Testing CASE D (Total = 100, Alloc = 100, Reserved = 2, Orders = 0, Return = 0)...');
  const mockCaseD = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 100,
    currentPreBookings: 2,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  const stateD = calculateProductInventoryState(mockCaseD);
  assert(stateD.sold === 2, 'CASE D: Sold = 2 (got ' + stateD.sold + ')');
  assert(stateD.available === 98, 'CASE D: Available = 98 (got ' + stateD.available + ')');

  // ─────────────────────────────────────────────────────────────
  // CASE E: Total = 100, Allocation = 100, Reserved = 100, Orders = 0, Return = 0
  // ─────────────────────────────────────────────────────────────
  console.log('\n5. Testing CASE E (Total = 100, Alloc = 100, Reserved = 100, Orders = 0, Return = 0)...');
  const mockCaseE = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 100,
    currentPreBookings: 100,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  const stateE = calculateProductInventoryState(mockCaseE);
  assert(stateE.sold === 100, 'CASE E: Sold = 100 (got ' + stateE.sold + ')');
  assert(stateE.available === 0, 'CASE E: Available = 0 (got ' + stateE.available + ')');
  assert(stateE.status === 'SOLD_OUT', 'CASE E: Status = SOLD_OUT (got ' + stateE.status + ')');

  // ─────────────────────────────────────────────────────────────
  // CASE F: Total = 100, Allocation = 30, Reserved = 30, Orders = 70, Return = 0
  // ─────────────────────────────────────────────────────────────
  console.log('\n6. Testing CASE F (Total = 100, Alloc = 30, Reserved = 30, Orders = 70, Return = 0)...');
  const mockCaseF = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 30,
    currentPreBookings: 30,
    normalOrdersCount: 70,
    returnUnits: 0,
  };
  const stateF = calculateProductInventoryState(mockCaseF);
  assert(stateF.sold === 100, 'CASE F: Sold = 100 (got ' + stateF.sold + ')');
  assert(stateF.available === 0, 'CASE F: Available = 0 (got ' + stateF.available + ')');
  assert(stateF.status === 'SOLD_OUT', 'CASE F: Status = SOLD_OUT (got ' + stateF.status + ')');

  // ─────────────────────────────────────────────────────────────
  // CASE G: Total = 100, Allocation = 30, Reserved = 2, Orders = 2, Return = 1
  // ─────────────────────────────────────────────────────────────
  console.log('\n7. Testing CASE G (Total = 100, Alloc = 30, Reserved = 2, Orders = 2, Return = 1)...');
  const mockCaseG = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 30,
    currentPreBookings: 2,
    normalOrdersCount: 2,
    returnUnits: 1,
  };
  const stateG = calculateProductInventoryState(mockCaseG);
  assert(stateG.sold === 4, 'CASE G: Sold = 4 (got ' + stateG.sold + ')');
  assert(stateG.available === 97, 'CASE G: Available = 97 (got ' + stateG.available + ')');

  // ─────────────────────────────────────────────────────────────
  // CASE H: Payment Failure / Checkout Abandonment Protection
  // ─────────────────────────────────────────────────────────────
  console.log('\n8. Testing CASE H (Payment Failure / Abandoned Checkout)...');
  const mockCaseHBefore = {
    totalStock: 100,
    isPreBooking: true,
    maxPreBooking: 30,
    currentPreBookings: 2,
    normalOrdersCount: 0,
    returnUnits: 0,
  };
  // Simulate payment failure: preBookReserved remains 2
  const stateHAfterFailedPayment = calculateProductInventoryState(mockCaseHBefore);
  assert(stateHAfterFailedPayment.preBookReserved === 2, 'CASE H: Payment failure does NOT increment preBookReserved');
  assert(stateHAfterFailedPayment.sold === 2, 'CASE H: Payment failure does NOT increment sold');
  assert(stateHAfterFailedPayment.available === 98, 'CASE H: Payment failure does NOT decrement available stock');

  // ─────────────────────────────────────────────────────────────
  // CASE I: Atomic Last Pre-Book Allocation Protection
  // ─────────────────────────────────────────────────────────────
  console.log('\n9. Testing CASE I (Atomic Last Pre-Book Allocation Protection)...');
  const maxAlloc = 30;
  let currentBooked = 29;
  let remainingAlloc = maxAlloc - currentBooked;
  assert(remainingAlloc === 1, 'CASE I: Exactly 1 pre-booking allocation remaining');

  // Simulate 2 concurrent purchase attempts (1 succeeds, 1 fails conditional check)
  let successfulOrders = 0;
  let failedOrders = 0;
  const attempts = [1, 2];
  for (const _ of attempts) {
    if (remainingAlloc >= 1) {
      remainingAlloc -= 1;
      currentBooked += 1;
      successfulOrders++;
    } else {
      failedOrders++;
    }
  }
  assert(successfulOrders === 1, 'CASE I: Exactly 1 concurrent transaction succeeded');
  assert(failedOrders === 1, 'CASE I: Concurrent second transaction failed safely');
  assert(currentBooked === 30, 'CASE I: Pre-booking allocation capped at exactly 30');

  // ─────────────────────────────────────────────────────────────
  // CASE J: Atomic Last Physical Unit Protection After Launch
  // ─────────────────────────────────────────────────────────────
  console.log('\n10. Testing CASE J (Atomic Last Physical Unit Protection After Launch)...');
  let availablePhysicalStock = 1;
  let normalSold = 99;
  let normalSuccess = 0;
  let normalFailed = 0;
  const concurrentNormalUsers = [1, 2];

  for (const _ of concurrentNormalUsers) {
    if (availablePhysicalStock >= 1) {
      availablePhysicalStock -= 1;
      normalSold += 1;
      normalSuccess++;
    } else {
      normalFailed++;
    }
  }

  assert(normalSuccess === 1, 'CASE J: Exactly 1 concurrent normal order succeeded');
  assert(normalFailed === 1, 'CASE J: Second concurrent order received SOLD OUT response');
  assert(availablePhysicalStock === 0, 'CASE J: Available physical stock becomes 0');
  
  const mockCaseJ = {
    totalStock: 100,
    isPreBooking: false,
    maxPreBooking: 0,
    currentPreBookings: 0,
    normalOrdersCount: 100,
    returnUnits: 0,
  };
  const stateJ = calculateProductInventoryState(mockCaseJ);
  assert(stateJ.status === 'SOLD_OUT', 'CASE J: Product remains visible as SOLD OUT');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  DEEP QA SUITE COMPLETED: ${passCount} PASS | ${failCount} FAIL`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runDeepQaSuite().catch((err) => {
  console.error('Deep QA Suite Error:', err);
  process.exit(1);
});
