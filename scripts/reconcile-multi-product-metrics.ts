import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function runMultiProductReconciliation() {
  const { getAdminInventory } = await import('../src/actions/admin-operations.actions');

  console.log('================================================================');
  console.log('  MULTI-PRODUCT DATABASE VS ADMIN METRICS RECONCILIATION');
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

  // Fetch inventory rows from DB directly
  const dbInventoryRows = await prisma.inventory.findMany({
    take: 10,
    include: {
      variant: {
        include: { product: true },
      },
    },
  });

  const adminInventoryRows = await getAdminInventory();

  for (const dbInv of dbInventoryRows) {
    const sku = dbInv.variant.sku;
    const p = dbInv.variant.product;
    console.log(`Reconciling Inventory Row for SKU: "${sku}" (${p.name} - Size ${dbInv.variant.size})`);

    const adminRow = adminInventoryRows.find((r) => r.id === dbInv.id);
    assert(adminRow !== undefined, `Inventory row ${dbInv.id} (${sku}) found in Admin Inventory output`);

    if (adminRow) {
      const expectedAvail = Math.max(0, dbInv.totalStock - dbInv.soldStock - dbInv.reservedStock);
      assert(adminRow.totalStock === dbInv.totalStock, `Total Stock match (DB: ${dbInv.totalStock}, Admin: ${adminRow.totalStock})`);
      assert(adminRow.soldStock === dbInv.soldStock, `Sold Stock match (DB: ${dbInv.soldStock}, Admin: ${adminRow.soldStock})`);
      assert(adminRow.availableStock === expectedAvail, `Available Stock match (DB: ${expectedAvail}, Admin: ${adminRow.availableStock})`);

      if (p.isPreBooking || p.maxPreBooking != null) {
        const dbAlloc = p.maxPreBooking || 0;
        const dbPaid = p.currentPreBookings || 0;
        const dbRemAlloc = Math.max(0, dbAlloc - dbPaid);
        const dbNormalAvail = Math.max(0, dbInv.totalStock - dbInv.soldStock - dbInv.reservedStock);

        assert(adminRow.preBookingAllocation === dbAlloc, `Pre-Booking Allocation match (DB: ${dbAlloc}, Admin: ${adminRow.preBookingAllocation})`);
        assert(adminRow.paidPreBookings === dbPaid, `Paid Pre-Bookings match (DB: ${dbPaid}, Admin: ${adminRow.paidPreBookings})`);
        assert(adminRow.remainingPreBookingAllocation === dbRemAlloc, `Remaining Allocation match (DB: ${dbRemAlloc}, Admin: ${adminRow.remainingPreBookingAllocation})`);
        assert(adminRow.normalLaunchAvailable === dbNormalAvail, `Normal Launch Available match (DB: ${dbNormalAvail}, Admin: ${adminRow.normalLaunchAvailable})`);
      }
    }
  }

  console.log('\n================================================================');
  console.log(`  RECONCILIATION COMPLETE: ${passed} PASS | ${failed} FAIL`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiProductReconciliation()
  .catch((err) => {
    console.error('Fatal reconciliation error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
