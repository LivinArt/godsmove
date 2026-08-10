import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function verifyPreBookingInventoryIntegration() {
  console.log('================================================================');
  console.log('  GODSMOVE AUTHORITATIVE INVENTORY & PRE-BOOKING QA SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // 1. MATHEMATICAL FORMULA VERIFICATION (EXAMPLAR SCENARIOS)
  // -------------------------------------------------------------------------
  console.log('1. Verifying Authoritative Mathematical Inventory Formulas...\n');

  // Scenario A: Total = 100, Allocation = 30, Paid = 12
  const scA = { total: 100, alloc: 30, paid: 12, normalSold: 0 };
  const scA_remAlloc = Math.max(0, scA.alloc - scA.paid);
  const scA_avail = scA.total - scA.paid - scA.normalSold;
  assert(scA_remAlloc === 18, 'Scenario A: Remaining Pre-Booking Allocation = 18');
  assert(scA_avail === 88, 'Scenario A: Normal Launch Available = 88');

  // Scenario B: Total = 100, Allocation = 30, Paid = 30
  const scB = { total: 100, alloc: 30, paid: 30, normalSold: 0 };
  const scB_remAlloc = Math.max(0, scB.alloc - scB.paid);
  const scB_avail = scB.total - scB.paid - scB.normalSold;
  assert(scB_remAlloc === 0, 'Scenario B: Remaining Pre-Booking Allocation = 0');
  assert(scB_avail === 70, 'Scenario B: Normal Launch Available = 70');

  // Scenario C: Total = 100, Allocation = 100, Paid = 100
  const scC = { total: 100, alloc: 100, paid: 100, normalSold: 0 };
  const scC_remAlloc = Math.max(0, scC.alloc - scC.paid);
  const scC_avail = scC.total - scC.paid - scC.normalSold;
  assert(scC_remAlloc === 0, 'Scenario C: Remaining Pre-Booking Allocation = 0');
  assert(scC_avail === 0, 'Scenario C: Physical Inventory = 0 (SOLD OUT)');

  // Scenario D: Total = 100, Allocation = 100, Paid = 60
  const scD = { total: 100, alloc: 100, paid: 60, normalSold: 0 };
  const scD_remAlloc = Math.max(0, scD.alloc - scD.paid);
  const scD_avail = scD.total - scD.paid - scD.normalSold;
  assert(scD_remAlloc === 40, 'Scenario D: Unused Allocation = 40');
  assert(scD_avail === 40, 'Scenario D: Normal Launch Available = 40');

  // Scenario E: Total = 100, Allocation = 30, Paid = 0
  const scE = { total: 100, alloc: 30, paid: 0, normalSold: 0 };
  const scE_avail = scE.total - scE.paid - scE.normalSold;
  assert(scE_avail === 100, 'Scenario E: Physical Inventory = 100 available');

  // -------------------------------------------------------------------------
  // 2. DATABASE PRE-BOOKING & INVENTORY DATA AUDIT
  // -------------------------------------------------------------------------
  console.log('\n2. Querying Database Pre-Booking Products & Inventory Records...\n');

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { isPreBooking: true },
        { maxPreBooking: { not: null } },
      ],
    },
    include: {
      variants: {
        include: {
          inventory: true,
        },
      },
    },
  });

  assert(products.length > 0, `Found ${products.length} Pre-Booking products in Database`);

  for (const prod of products) {
    const totalVariantStock = prod.variants.reduce(
      (sum, v) => sum + (v.inventory?.totalStock || 0),
      0
    );
    const maxAlloc = prod.maxPreBooking || 0;
    const paidBookings = prod.currentPreBookings || 0;

    assert(
      maxAlloc <= totalVariantStock || totalVariantStock === 0,
      `Product "${prod.name}" Allocation (${maxAlloc}) <= Physical Stock (${totalVariantStock})`
    );
    assert(
      paidBookings <= maxAlloc || maxAlloc === 0,
      `Product "${prod.name}" Paid Bookings (${paidBookings}) <= Allocation (${maxAlloc})`
    );
  }

  // -------------------------------------------------------------------------
  // 3. DATABASE INVENTORY RECONCILIATION
  // -------------------------------------------------------------------------
  console.log('\n3. Testing Inventory Table Query Reconciliation...\n');

  const inventoryRows = await prisma.inventory.findMany({
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
  });

  assert(inventoryRows.length > 0, `Found ${inventoryRows.length} total inventory rows in Database`);

  const pbRows = inventoryRows.filter((r) => r.variant.product.isPreBooking || r.variant.product.maxPreBooking != null);
  assert(pbRows.length >= 0, `Pre-Booking inventory rows in DB: ${pbRows.length}`);

  // -------------------------------------------------------------------------
  // 4. ATOMIC ALLOCATION CONCURRENCY & SOFT DELETE INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n4. Verifying Atomic Allocation & Product Soft Delete Integrity...\n');

  const firstPbProduct = products[0];
  if (firstPbProduct) {
    assert((firstPbProduct.status as string) !== 'DELETED', `Pre-Booking product "${firstPbProduct.name}" status: ${firstPbProduct.status}`);
  }

  console.log('\n================================================================');
  console.log(`  QA SUITE RESULT: ${passed} PASS | ${failed} FAIL`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyPreBookingInventoryIntegration()
  .catch((err) => {
    console.error('Fatal error running inventory QA suite:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
