import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Dynamically import prisma AFTER dotenv is configured
async function runAudit() {
  const { prisma } = await import('../src/lib/prisma');

  console.log('============================================================');
  console.log('GODSMOVE — ADMIN PRE-BOOKINGS & DATABASE DEEP AUDIT');
  console.log('============================================================\n');

  // 1. Audit All Pre-Booking Configured Products
  const preBookingProducts = await prisma.product.findMany({
    where: {
      OR: [
        { isPreBooking: true },
        { maxPreBooking: { not: null } },
        { preBookingOpenDateTime: { not: null } },
      ],
    },
    include: {
      category: true,
      variants: {
        include: {
          inventory: true,
        },
      },
      _count: {
        select: {
          interests: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📦 FOUND ${preBookingProducts.length} PRE-BOOKING CONFIGURED PRODUCTS IN DB:\n`);
  for (const p of preBookingProducts) {
    const totalInventory = p.variants.reduce((acc, v) => acc + (v.inventory?.totalStock || 0), 0);
    const soldInventory = p.variants.reduce((acc, v) => acc + (v.inventory?.soldStock || 0), 0);
    const reservedInventory = p.variants.reduce((acc, v) => acc + (v.inventory?.reservedStock || 0), 0);
    const availableInventory = Math.max(0, totalInventory - soldInventory - reservedInventory);

    console.log(`  - Product ID: ${p.id}`);
    console.log(`    Name: "${p.name}" (Slug: ${p.slug})`);
    console.log(`    Channel: ${p.channel}`);
    console.log(`    isPreBooking Flag: ${p.isPreBooking}`);
    console.log(`    Launch DateTime: ${p.launchDateTime ? p.launchDateTime.toISOString() : 'None'}`);
    console.log(`    Pre-Booking Open Date: ${p.preBookingOpenDateTime ? p.preBookingOpenDateTime.toISOString() : 'None'}`);
    console.log(`    Pre-Booking Allocation: maxPreBooking=${p.maxPreBooking ?? 'N/A'}, currentPreBookings=${p.currentPreBookings ?? 0}`);
    console.log(`    Inventory: totalStock=${totalInventory}, soldStock=${soldInventory}, reservedStock=${reservedInventory}, available=${availableInventory}`);
    console.log(`    Notify-Me Interest Count: ${p._count.interests}`);
    console.log('------------------------------------------------------------');
  }

  // 2. Audit All Orders Marked as PRE_BOOKING
  const preBookingOrders = await prisma.order.findMany({
    where: {
      OR: [
        { orderType: 'PRE_BOOKING' },
        { isPreBooking: true },
      ],
    },
    include: {
      profile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n📋 FOUND ${preBookingOrders.length} PRE-BOOKING ORDERS IN DB:\n`);

  const paidOrders = preBookingOrders.filter(o => o.paymentStatus === 'PAID');
  const unpaidOrders = preBookingOrders.filter(o => o.paymentStatus !== 'PAID');

  console.log(`  - Total Pre-Booking Order Records: ${preBookingOrders.length}`);
  console.log(`  - PAID Pre-Booking Orders: ${paidOrders.length}`);
  console.log(`  - UNPAID / PENDING / FAILED Pre-Booking Orders: ${unpaidOrders.length}\n`);

  if (unpaidOrders.length > 0) {
    console.log('  ⚠️ AUDITING EXISTING PRE_BOOKING + UNPAID RECORDS:');
    for (const o of unpaidOrders) {
      console.log(`    Order ID: ${o.id} | Order #${o.orderNumber}`);
      console.log(`      Created At: ${o.createdAt.toISOString()}`);
      console.log(`      Customer: ${o.email} (Profile ID: ${o.profileId || 'Guest'})`);
      console.log(`      Total Amount: ₹${o.total}`);
      console.log(`      Payment Method: ${o.paymentMethod}`);
      console.log(`      Payment Status: ${o.paymentStatus} | Order Status: ${o.status}`);
      console.log(`      Items: ${o.items.map(i => `${i.productName} (${i.size}) x${i.quantity}`).join(', ')}`);
      console.log(`      Membership Activated: ${o.membershipActivated}`);
      console.log('    --------------------------------------------------------');
    }
  }

  // 3. Reconcile Admin Metrics Calculation
  const totalReservedVolume = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalUnitsRingFenced = paidOrders.reduce((sum, o) => {
    return sum + o.items.reduce((iSum, item) => iSum + (item.quantity || 1), 0);
  }, 0);
  const totalInterestCount = preBookingProducts.reduce((sum, p) => sum + p._count.interests, 0);

  console.log('\n============================================================');
  console.log('DATABASE TRUTH METRIC RECONCILIATION SUMMARY');
  console.log('============================================================');
  console.log(`  1. Total Active Pre-Booking Releases: ${preBookingProducts.filter(p => p.isPreBooking).length}`);
  console.log(`  2. Total PAID Pre-Booking Orders: ${paidOrders.length}`);
  console.log(`  3. Total Reserved Revenue Volume: ₹${totalReservedVolume.toLocaleString('en-IN')}`);
  console.log(`  4. Total Units Ring-Fenced: ${totalUnitsRingFenced}`);
  console.log(`  5. Total Demand Interest (Notify-Me): ${totalInterestCount}`);
  console.log(`  6. True Conversion Rate: ${totalInterestCount > 0 ? ((paidOrders.length / totalInterestCount) * 100).toFixed(1) + '%' : 'N/A'}`);
  console.log('============================================================\n');

  await prisma.$disconnect();
}

runAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
