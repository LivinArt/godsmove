import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function auditTargetProduct() {
  const { prisma } = await import('../src/lib/prisma');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DATABASE AUDIT: Premium Urban Tee, Drop Shoulder Tee, Drop1');
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
        },
      },
    },
  });

  if (!product) {
    console.error('Target product NOT FOUND in database!');
    process.exit(1);
  }

  console.log('--- PRODUCT RECORD ---');
  console.log(`ID:                     ${product.id}`);
  console.log(`Name:                   ${product.name}`);
  console.log(`Slug:                   ${product.slug}`);
  console.log(`Channel:                ${product.channel}`);
  console.log(`Status:                 ${product.status}`);
  console.log(`isPreBooking:           ${product.isPreBooking}`);
  console.log(`maxPreBooking:          ${product.maxPreBooking}`);
  console.log(`currentPreBookings:     ${product.currentPreBookings}`);
  console.log(`preBookingOpenDateTime: ${product.preBookingOpenDateTime}`);
  console.log(`launchDateTime:         ${product.launchDateTime}`);
  console.log('----------------------\n');

  // 2. Fetch Inventory Records for Variants
  console.log('--- VARIANTS & INVENTORY RECORDS ---');
  let totalPhysicalStock = 0;
  let totalSoldStock = 0;
  let totalReservedStock = 0;
  let totalIncomingStock = 0;

  for (const v of product.variants) {
    const inv = v.inventory;
    console.log(`Variant ID: ${v.id} | SKU: ${v.sku} | Size: ${v.size} | Color: ${v.color}`);
    if (inv) {
      console.log(`  Inventory ID:     ${inv.id}`);
      console.log(`  Total Stock:       ${inv.totalStock}`);
      console.log(`  Sold Stock:        ${inv.soldStock}`);
      console.log(`  Reserved Stock:    ${inv.reservedStock}`);
      console.log(`  Incoming Stock:    ${inv.incomingStock}`);
      totalPhysicalStock += inv.totalStock;
      totalSoldStock += inv.soldStock;
      totalReservedStock += inv.reservedStock;
      totalIncomingStock += inv.incomingStock;
    } else {
      console.log('  [No inventory record linked to variant]');
    }
  }
  console.log(`TOTAL PHYSICAL STOCK (Sum of totalStock): ${totalPhysicalStock}`);
  console.log(`TOTAL SOLD STOCK (Sum of soldStock):       ${totalSoldStock}`);
  console.log(`TOTAL RESERVED STOCK (Sum of reservedStock): ${totalReservedStock}`);
  console.log('-------------------------------------\n');

  // 3. Query All Orders associated with this product
  console.log('--- ORDERS ASSOCIATED WITH THIS PRODUCT ---');
  const variantIds = product.variants.map((v) => v.id);
  const allOrderItems = await prisma.orderItem.findMany({
    where: {
      variantId: { in: variantIds },
    },
    include: {
      order: true,
      variant: true,
    },
  });

  console.log(`Found ${allOrderItems.length} order item records for product variants.`);

  let canonicalPaidPreBookQty = 0;
  let canonicalUnpaidPreBookQty = 0;
  let canonicalNormalPaidOrderQty = 0;

  for (let i = 0; i < allOrderItems.length; i++) {
    const item = allOrderItems[i];
    const o = item.order;
    const isPb = Boolean(o.isPreBooking || o.orderType === 'PRE_BOOKING');
    const isPaid = o.paymentStatus === 'PAID';

    if (isPb && isPaid) {
      canonicalPaidPreBookQty += item.quantity;
    } else if (isPb && !isPaid) {
      canonicalUnpaidPreBookQty += item.quantity;
    } else if (!isPb && isPaid) {
      canonicalNormalPaidOrderQty += item.quantity;
    }

    console.log(`\nItem #${i + 1}: OrderID=${o.id} | OrderNumber=${o.orderNumber}`);
    console.log(`  orderType:     ${o.orderType} | isPreBooking: ${o.isPreBooking}`);
    console.log(`  paymentStatus: ${o.paymentStatus} | orderStatus: ${o.status}`);
    console.log(`  quantity:      ${item.quantity} | SKU: ${item.variant?.sku}`);
    console.log(`  createdAt:     ${o.createdAt.toISOString()}`);
  }

  console.log('\n--- CANONICAL PAID ORDER AGGREGATION ---');
  console.log(`A. CANONICAL PAID PRE-BOOKING QUANTITY: ${canonicalPaidPreBookQty}`);
  console.log(`B. CANONICAL UNPAID PRE-BOOKING QUANTITY: ${canonicalUnpaidPreBookQty}`);
  console.log(`C. CANONICAL NORMAL PAID ORDER QUANTITY: ${canonicalNormalPaidOrderQty}`);
  console.log(`D. Product.currentPreBookings IN DB:    ${product.currentPreBookings}`);
  console.log(`E. Product.maxPreBooking IN DB:         ${product.maxPreBooking}`);
  console.log(`F. Inventory.soldStock IN DB:           ${totalSoldStock}`);
  console.log(`G. Inventory.reservedStock IN DB:       ${totalReservedStock}`);
  console.log('----------------------------------------\n');

  await prisma.$disconnect();
}

auditTargetProduct().catch((err) => {
  console.error(err);
  process.exit(1);
});
