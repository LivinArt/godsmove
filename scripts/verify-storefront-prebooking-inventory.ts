import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runStorefrontPrebookingInventoryVerification() {
  const { prisma } = await import('../src/lib/prisma');
  const { getStorefrontInventoryDisplay, calculateProductInventoryState } = await import('../src/lib/inventory-service');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GODSMOVE STOREFRONT PRE-BOOKING INVENTORY RECONCILIATION');
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
      variants: {
        include: {
          inventory: true,
          orderItems: {
            include: {
              order: true,
            },
          },
        },
      },
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

  const canonicalPaidPreBookReserved = paidOrderItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate canonical inventory state
  const invState = calculateProductInventoryState(product);
  const disp = getStorefrontInventoryDisplay(product);

  const expectedStorefrontText = `${canonicalPaidPreBookReserved} / ${invState.preBookAllocation} PRE-BOOKED`;
  const actualStorefrontText = disp.formattedText;
  const isMatch = disp.numerator === canonicalPaidPreBookReserved && disp.denominator === invState.preBookAllocation;

  console.log('TARGET PRODUCT:');
  console.log(product.name);
  console.log('');
  console.log('TOTAL PHYSICAL INVENTORY:');
  console.log(invState.totalInventory);
  console.log('');
  console.log('PRE-BOOKING ALLOCATION:');
  console.log(invState.preBookAllocation);
  console.log('');
  console.log('PAID PRE-BOOK RESERVED:');
  console.log(canonicalPaidPreBookReserved);
  console.log('');
  console.log('CURRENT PRE-BOOKINGS COUNTER:');
  console.log(product.currentPreBookings);
  console.log('');
  console.log('NORMAL ORDERS:');
  console.log(invState.normalOrders);
  console.log('');
  console.log('SOLD:');
  console.log(invState.sold);
  console.log('');
  console.log('RETURN:');
  console.log(invState.returnUnits);
  console.log('');
  console.log('AVAILABLE:');
  console.log(invState.available);
  console.log('');
  console.log('EXPECTED STOREFRONT:');
  console.log(expectedStorefrontText);
  console.log('');
  console.log('ACTUAL STOREFRONT SOURCE:');
  console.log(actualStorefrontText);
  console.log('');
  console.log('MATCH:');
  console.log(isMatch ? 'PASS' : 'FAIL');
  console.log('═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();

  if (!isMatch) {
    process.exit(1);
  }
}

runStorefrontPrebookingInventoryVerification().catch((err) => {
  console.error('Verification Error:', err);
  process.exit(1);
});
