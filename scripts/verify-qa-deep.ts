/**
 * GODSMOVE Deep QA Verification Script
 * Tests: Membership Expiry, Member Discount, Pre-Booking Exclusion, Notify-Me duplicates
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Load env
import { config } from 'dotenv';
config({ path: '.env.local' });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const PASS = '\x1b[32m✅ [PASS]\x1b[0m';
const FAIL = '\x1b[31m❌ [FAIL]\x1b[0m';
const INFO = '\x1b[36m   -->\x1b[0m';

let totalPass = 0;
let totalFail = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`   ${PASS} ${label}`);
    totalPass++;
  } else {
    console.log(`   ${FAIL} ${label}`);
    totalFail++;
  }
}

async function main() {
  console.log('\n====================================================');
  console.log('GODSMOVE DEEP QA VERIFICATION SCRIPT');
  console.log('====================================================\n');

  // TEST 1: Calendar-Aware 1-Year Membership Expiry
  console.log('TEST 1: Calendar-Aware 1-Year Membership Expiry');
  const memberships = await prisma.membership.findMany({
    where: { expiresAt: { not: null } },
    select: { id: true, activatedAt: true, expiresAt: true },
    take: 10,
  });
  console.log(`   ${INFO} Found ${memberships.length} memberships with expiresAt set`);
  for (const m of memberships) {
    const expectedYear = m.activatedAt.getFullYear() + 1;
    const actualYear = m.expiresAt!.getFullYear();
    const sameMonth = m.activatedAt.getMonth() === m.expiresAt!.getMonth();
    const sameDay = m.activatedAt.getDate() === m.expiresAt!.getDate();
    const isCalendarYear = actualYear === expectedYear && sameMonth && sameDay;
    const act = m.activatedAt.toISOString().split('T')[0];
    const exp = m.expiresAt!.toISOString().split('T')[0];
    assert(isCalendarYear, `Membership ${m.id.slice(-6)}: activated ${act} → expires ${exp} (calendar year: ${isCalendarYear})`);
  }
  if (memberships.length === 0) {
    console.log(`   ${INFO} No memberships with expiresAt — new ones will use calendar-year logic in order.actions.ts`);
  }

  // TEST 2: Member Discount Schema Fields
  console.log('\nTEST 2: Member Discount Fields on Products (Schema)');
  const sampleProduct = await prisma.product.findFirst({
    select: { id: true, name: true, hasMemberDiscount: true, memberDiscountType: true, memberDiscountValue: true, isPreBooking: true },
  });
  if (sampleProduct) {
    console.log(`   ${INFO} Sample: "${sampleProduct.name}" isPreBooking=${sampleProduct.isPreBooking} hasMemberDiscount=${sampleProduct.hasMemberDiscount}`);
    assert(typeof sampleProduct.hasMemberDiscount === 'boolean', 'hasMemberDiscount field is boolean');
    assert(sampleProduct.memberDiscountType === null || typeof sampleProduct.memberDiscountType === 'string', 'memberDiscountType field exists');
    assert(sampleProduct.memberDiscountValue === null || typeof sampleProduct.memberDiscountValue === 'number', 'memberDiscountValue field exists');
  } else {
    console.log(`   ${INFO} No products found`);
  }

  // TEST 3: PreBookingInterest table queryable
  console.log('\nTEST 3: PreBookingInterest Table');
  const interestCount = await prisma.preBookingInterest.count();
  console.log(`   ${INFO} prebooking_interests rows: ${interestCount}`);
  assert(typeof interestCount === 'number', 'prebooking_interests table exists and is queryable');

  // TEST 4: Unique constraint on PreBookingInterest
  console.log('\nTEST 4: PreBookingInterest Unique Constraint');
  const rawConstraints = await prisma.$queryRaw<{constraint_name: string}[]>`
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'prebooking_interests' 
    AND constraint_type = 'UNIQUE'
  `;
  assert(rawConstraints.length > 0, `Unique constraint exists on prebooking_interests (${rawConstraints.map((r: any) => r.constraint_name).join(', ')})`);

  // TEST 5: Pre-Booking orders in DB
  console.log('\nTEST 5: Pre-Booking Orders Audit');
  const preBookingOrders = await prisma.order.findMany({
    where: { OR: [{ orderType: 'PRE_BOOKING' }, { isPreBooking: true }] },
    select: { orderNumber: true, orderType: true, isPreBooking: true, paymentStatus: true, membershipActivated: true, paymentMethod: true },
  });
  console.log(`   ${INFO} Found ${preBookingOrders.length} Pre-Booking orders`);
  for (const o of preBookingOrders) {
    console.log(`   ${INFO} #${o.orderNumber}: type=${o.orderType} paid=${o.paymentStatus} membershipActivated=${o.membershipActivated} method=${o.paymentMethod}`);
    assert(o.paymentMethod !== 'COD', `Order #${o.orderNumber}: paymentMethod is NOT COD`);
  }

  // TEST 6: Membership activation matches PAID orders
  console.log('\nTEST 6: Membership Activation for PAID Pre-Booking Orders');
  const paidPreBookings = await prisma.order.findMany({
    where: { OR: [{ orderType: 'PRE_BOOKING' }, { isPreBooking: true }], paymentStatus: 'PAID', membershipActivated: true },
    select: { orderNumber: true, profile: { select: { email: true, membership: { select: { status: true, activatedAt: true, expiresAt: true } } } } },
  });
  console.log(`   ${INFO} PAID + membershipActivated=true orders: ${paidPreBookings.length}`);
  for (const o of paidPreBookings) {
    const hasMem = Boolean(o.profile?.membership);
    console.log(`   ${INFO} #${o.orderNumber} (${o.profile?.email}): membership in DB=${hasMem} status=${o.profile?.membership?.status ?? 'N/A'}`);
    assert(hasMem, `Order #${o.orderNumber}: membershipActivated=true → membership record exists`);
  }

  // TEST 7: GST extraction consistency on PAID orders
  console.log('\nTEST 7: GST Extraction Consistency');
  const sampleOrders = await prisma.order.findMany({
    where: { paymentStatus: 'PAID' },
    select: { orderNumber: true, subtotal: true, taxableAmount: true, gstAmount: true, discountAmount: true, walletCredit: true, codFee: true, shippingCost: true },
    take: 5,
  });
  for (const o of sampleOrders) {
    const subtotal = Number(o.subtotal);
    const taxable = Number(o.taxableAmount);
    const gst = Number(o.gstAmount);
    const discount = Number(o.discountAmount || 0);
    const wallet = Number(o.walletCredit || 0);
    const netSelling = subtotal - discount - wallet;
    const taxableGstSum = Math.abs(taxable + gst - netSelling) < 1.5; // allow ₹1.50 rounding tolerance
    console.log(`   ${INFO} #${o.orderNumber}: subtotal=₹${subtotal} taxable=₹${taxable.toFixed(2)} gst=₹${gst.toFixed(2)} net=₹${netSelling.toFixed(2)}`);
    assert(taxableGstSum, `Order #${o.orderNumber}: taxable+gst ≈ net selling price (within ₹1.50 rounding tolerance)`);
  }

  // SUMMARY
  console.log('\n====================================================');
  console.log(`DEEP QA RESULTS: ${totalPass} PASSED | ${totalFail} FAILED`);
  if (totalFail === 0) {
    console.log('ALL DATABASE & SCHEMA TESTS PASSED');
  } else {
    console.log('SOME TESTS FAILED — SEE ABOVE FOR DETAILS');
  }
  console.log('====================================================\n');

  await prisma.$disconnect();
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
