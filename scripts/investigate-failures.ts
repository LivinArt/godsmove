import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('\n=== INVESTIGATING REAL ISSUES ===\n');

  // 1. Check prebooking_interests indexes (not just constraints)
  console.log('1. prebooking_interests index check:');
  const indexes = await prisma.$queryRaw<any[]>`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename='prebooking_interests'
  `;
  for (const idx of indexes) {
    console.log(`   ${idx.indexname}: ${idx.indexdef}`);
  }

  // 2. Check schema for @@unique directive
  console.log('\n2. Checking if @@unique constraint is actually a unique INDEX (vs UNIQUE constraint):');
  const uniqueIdx = indexes.filter((i: any) => i.indexdef?.includes('UNIQUE'));
  console.log(`   Unique indexes found: ${uniqueIdx.length}`);
  for (const ui of uniqueIdx) {
    console.log(`   ${ui.indexname}: ${ui.indexdef}`);
  }

  // 3. Investigate GST Δ on orders with walletCredit
  console.log('\n3. GST Δ Investigation — orders with wallet credits:');
  const problemOrders = await prisma.order.findMany({
    where: {
      paymentStatus: 'PAID',
      orderNumber: { startsWith: 'SS-' },
      taxableAmount: { gt: 0 },
    },
    select: {
      orderNumber: true,
      subtotal: true,
      taxableAmount: true,
      gstAmount: true,
      discountAmount: true,
      walletCredit: true,
      total: true,
      codFee: true,
      shippingCost: true,
    },
    take: 10,
  });
  for (const o of problemOrders) {
    const subtotal = Number(o.subtotal);
    const taxable = Number(o.taxableAmount);
    const gst = Number(o.gstAmount);
    const discount = Number(o.discountAmount || 0);
    const wallet = Number(o.walletCredit || 0);
    const cod = Number(o.codFee || 0);
    const ship = Number(o.shippingCost || 0);
    // taxableAmount+gstAmount should = subtotal - discountAmount (not wallet credit, which is separate)
    const netSelling = subtotal - discount;
    const sum = taxable + gst;
    const delta = Math.abs(sum - netSelling);
    console.log(`   #${o.orderNumber}: subtotal=${subtotal} discount=${discount} wallet=${wallet} net=${netSelling.toFixed(0)} taxable=${taxable.toFixed(0)} gst=${gst.toFixed(0)} sum=${sum.toFixed(0)} Δ=${delta.toFixed(2)}`);
  }

  // 4. Find invoice route
  console.log('\n4. Finding invoice route:');
  const { execSync } = require('child_process');
  try {
    const result = execSync('dir /s /b src\\app\\*invoice* 2>nul || echo "not found"', { cwd: process.cwd() }).toString();
    console.log('   ' + result.trim().split('\n').join('\n   '));
  } catch {
    console.log('   Could not find via dir command');
  }

  // 5. Test pricing engine actual exports
  console.log('\n5. Pricing engine exports:');
  try {
    const pe = await import('../src/lib/pricing-engine');
    console.log('   Exports:', Object.keys(pe).join(', '));
    
    // Test the actual function signature
    const peAny = pe as any;
    if (peAny.calculateOrderPricing || peAny.calculateOrder) {
      const fn = peAny.calculateOrderPricing || peAny.calculateOrder;

      // Simulate pre-booking with member — member discount should be 0
      const preBookItem = {
        price: 5000,
        quantity: 1,
        isPreBooking: true,
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
      };
      const result = fn({ items: [preBookItem as any], isActiveMember: true } as any);
      console.log(`   PRE_BOOKING member discount result: memberDiscount=${result?.memberDiscount ?? 'N/A'}`);
      
      // Normal drops with member
      const dropsItem = {
        price: 5000,
        quantity: 1,
        isPreBooking: false,
        hasMemberDiscount: true,
        memberDiscountType: 'PERCENT',
        memberDiscountValue: 10,
      };
      const result2 = fn({ items: [dropsItem as any], isActiveMember: true } as any);
      console.log(`   DROPS member 10% discount: memberDiscount=${result2?.memberDiscount ?? 'N/A'} (expected: 500)`);
    }
  } catch (e: any) {
    console.log('   Error:', e.message?.substring(0, 200));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });
