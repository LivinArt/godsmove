import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function reconcileTargetProductPreBookings() {
  const { prisma } = await import('../src/lib/prisma');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GODSMOVE PRE-BOOKING DATABASE RECONCILIATION');
  console.log('  Target Product: Premium Urban Tee, Drop Shoulder Tee, Drop1');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Fetch Target Product
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: 'premium-urban-tee-drop-shoulder-tee-drop1' },
        { name: { contains: 'Premium Urban Tee', mode: 'insensitive' } },
      ],
    },
    include: {
      variants: true,
    },
  });

  if (!product) {
    console.error('Target product NOT FOUND in database!');
    process.exit(1);
  }

  // 2. Compute true canonical paid pre-bookings count from database orders
  const variantIds = product.variants.map((v) => v.id);
  const paidOrderItems = await prisma.orderItem.findMany({
    where: {
      variantId: { in: variantIds },
      order: {
        paymentStatus: 'PAID',
        OR: [
          { isPreBooking: true },
          { orderType: 'PRE_BOOKING' },
        ],
      },
    },
  });

  const canonicalPaidCount = paidOrderItems.reduce((sum, item) => sum + item.quantity, 0);

  console.log(`BEFORE RECONCILIATION:`);
  console.log(`  Product DB currentPreBookings: ${product.currentPreBookings}`);
  console.log(`  Canonical Paid Order Count:    ${canonicalPaidCount}`);

  if (product.currentPreBookings !== canonicalPaidCount) {
    console.log(`\nReconciling Product ${product.name} (${product.id}): ${product.currentPreBookings} -> ${canonicalPaidCount}...`);
    await prisma.product.update({
      where: { id: product.id },
      data: { currentPreBookings: canonicalPaidCount },
    });
    console.log(`✓ RECONCILIATION COMPLETE: Product currentPreBookings updated to ${canonicalPaidCount}`);
  } else {
    console.log(`✓ NO RECONCILIATION NEEDED: Counter is already synchronized at ${canonicalPaidCount}`);
  }

  // Verify updated state
  const updatedProduct = await prisma.product.findUnique({
    where: { id: product.id },
    select: { id: true, name: true, currentPreBookings: true, maxPreBooking: true },
  });

  console.log('\n--- VERIFIED UPDATED PRODUCT RECORD ---');
  console.log(`  Name: ${updatedProduct?.name}`);
  console.log(`  currentPreBookings: ${updatedProduct?.currentPreBookings}`);
  console.log(`  maxPreBooking:      ${updatedProduct?.maxPreBooking}`);
  console.log('----------------------------------------\n');

  await prisma.$disconnect();
}

reconcileTargetProductPreBookings().catch((err) => {
  console.error('Reconciliation error:', err);
  process.exit(1);
});
