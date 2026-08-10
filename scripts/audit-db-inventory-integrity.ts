import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function runDatabaseAudit() {
  console.log('================================================================');
  console.log('  GODSMOVE DATABASE INTEGRITY & UNPAID PRE-BOOKING AUDIT');
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

  // 1. Check for negative inventory
  const negativeStockRows = await prisma.inventory.findMany({
    where: {
      OR: [
        { totalStock: { lt: 0 } },
        { reservedStock: { lt: 0 } },
        { soldStock: { lt: 0 } },
      ],
    },
    include: {
      variant: {
        include: { product: true },
      },
    },
  });

  if (negativeStockRows.length > 0) {
    console.log(`  🔍 Negative Inventory Rows Found (${negativeStockRows.length}):`);
    for (const row of negativeStockRows) {
      console.log(`     - SKU ${row.variant.sku} (${row.variant.product.name}): total=${row.totalStock}, reserved=${row.reservedStock}, sold=${row.soldStock}`);
    }
  }
  assert(negativeStockRows.length === 0, `Negative inventory count: ${negativeStockRows.length}`);

  // 2. Check for allocation > total stock
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: { inventory: true },
      },
    },
  });

  let overAllocatedProducts = 0;
  let overBookedProducts = 0;

  for (const p of products) {
    const totalPhysical = p.variants.reduce((sum, v) => sum + (v.inventory?.totalStock || 0), 0);
    const maxAlloc = p.maxPreBooking || 0;
    const currentBooked = p.currentPreBookings || 0;

    if (maxAlloc > totalPhysical && totalPhysical > 0) {
      overAllocatedProducts++;
    }
    if (currentBooked > maxAlloc && maxAlloc > 0) {
      overBookedProducts++;
    }
  }

  assert(overAllocatedProducts === 0, `Products with maxPreBooking > totalStock: ${overAllocatedProducts}`);
  assert(overBookedProducts === 0, `Products with currentPreBookings > maxPreBooking: ${overBookedProducts}`);

  // 3. Unpaid Pre-Bookings Audit
  const unpaidPreBookingOrders = await prisma.order.findMany({
    where: {
      OR: [
        { isPreBooking: true },
        { orderType: 'PRE_BOOKING' },
      ],
      paymentStatus: { not: 'PAID' },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      email: true,
    },
  });

  console.log(`\n3. Unpaid Pre-Booking Orders Audit: Found ${unpaidPreBookingOrders.length} unpaid orders.`);
  
  let invalidConfirmedUnpaid = 0;
  for (const o of unpaidPreBookingOrders) {
    console.log(`   Order #${o.orderNumber}: status="${o.status}", paymentStatus="${o.paymentStatus}", email="${o.email}"`);
    if (o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED') {
      invalidConfirmedUnpaid++;
    }
  }

  assert(
    invalidConfirmedUnpaid === 0,
    `Unpaid Pre-Bookings marked CONFIRMED or in fulfillment: ${invalidConfirmedUnpaid}`
  );

  console.log('\n================================================================');
  console.log(`  AUDIT COMPLETED: ${passed} PASS | ${failed} FAIL`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDatabaseAudit()
  .catch((err) => {
    console.error('Fatal error running DB audit:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
