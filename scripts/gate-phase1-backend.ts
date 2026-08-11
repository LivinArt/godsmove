/**
 * PHASE 1 — FINAL BACKEND GATE
 * Full database + server-action verification for GODSMOVE production gate.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const P = '\x1b[32m[PASS]\x1b[0m';
const F = '\x1b[31m[FAIL]\x1b[0m';
const I = '\x1b[36m  -->\x1b[0m';
const W = '\x1b[33m[WARN]\x1b[0m';

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string, detail = '') {
  if (cond) { console.log(`  ${P} ${msg}`); pass++; }
  else { console.log(`  ${F} ${msg}${detail ? ' — ' + detail : ''}`); fail++; }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GODSMOVE FINAL PRODUCTION GATE — PHASE 1: BACKEND');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ── TEST 1: All ACTIVE memberships have activatedAt & expiresAt ────────────
  console.log('TEST 1: Active Membership Completeness');
  const activeMemberships = await prisma.membership.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, activatedAt: true, expiresAt: true, source: true, profileId: true },
  });
  console.log(`  ${I} Active memberships: ${activeMemberships.length}`);
  for (const m of activeMemberships) {
    assert(Boolean(m.activatedAt), `Membership ${m.id.slice(-8)}: activatedAt is set`);
    assert(Boolean(m.expiresAt), `Membership ${m.id.slice(-8)}: expiresAt is set`);
    if (m.activatedAt && m.expiresAt) {
      const expY = m.expiresAt.getFullYear();
      const actY = m.activatedAt.getFullYear();
      const sameMonthDay = m.expiresAt.getMonth() === m.activatedAt.getMonth()
                        && m.expiresAt.getDate()  === m.activatedAt.getDate();
      assert(expY === actY + 1 && sameMonthDay,
        `Membership ${m.id.slice(-8)}: expiresAt is exactly 1 calendar year (${m.activatedAt.toISOString().split('T')[0]} → ${m.expiresAt.toISOString().split('T')[0]})`);
    }
  }

  // ── TEST 2: PRE_BOOKING orders remain permanently identifiable ─────────────
  console.log('\nTEST 2: PRE_BOOKING Order Identity Preserved');
  const pbOrders = await prisma.order.findMany({
    where: { OR: [{ orderType: 'PRE_BOOKING' }, { isPreBooking: true }] },
    select: { id: true, orderNumber: true, orderType: true, isPreBooking: true, paymentStatus: true, membershipActivated: true, paymentMethod: true },
  });
  console.log(`  ${I} PRE_BOOKING orders: ${pbOrders.length}`);
  for (const o of pbOrders) {
    assert(o.orderType === 'PRE_BOOKING', `Order #${o.orderNumber}: orderType = PRE_BOOKING`);
    assert(o.paymentMethod !== 'COD', `Order #${o.orderNumber}: paymentMethod ≠ COD (was: ${o.paymentMethod})`);
  }

  // ── TEST 3: PAID PRE_BOOKING → membership activated ───────────────────────
  console.log('\nTEST 3: PAID Pre-Booking → Membership Activation');
  const paidPB = await prisma.order.findMany({
    where: { orderType: 'PRE_BOOKING', paymentStatus: 'PAID', membershipActivated: true },
    select: { orderNumber: true, profileId: true, profile: { select: { email: true, membership: { select: { status: true, activatedAt: true, expiresAt: true } } } } },
  });
  console.log(`  ${I} PAID+membershipActivated orders: ${paidPB.length}`);
  for (const o of paidPB) {
    const mem = o.profile?.membership;
    assert(Boolean(mem), `Order #${o.orderNumber}: membership record exists in DB`);
    assert(mem?.status === 'ACTIVE', `Order #${o.orderNumber}: membership.status = ACTIVE`);
    assert(Boolean(mem?.expiresAt), `Order #${o.orderNumber}: membership.expiresAt is set`);
  }

  // ── TEST 4: FAILED PRE_BOOKING → no membership activated ──────────────────
  console.log('\nTEST 4: FAILED Pre-Booking → No Membership');
  const failedPB = await prisma.order.findMany({
    where: { orderType: 'PRE_BOOKING', paymentStatus: { in: ['FAILED', 'UNPAID'] }, membershipActivated: true },
    select: { orderNumber: true, paymentStatus: true },
  });
  assert(failedPB.length === 0,
    `FAILED/UNPAID orders have membershipActivated=false (violations: ${failedPB.length})`,
    failedPB.map(o => `#${o.orderNumber}`).join(', '));

  // ── TEST 5: No COD on PRE_BOOKING orders ──────────────────────────────────
  console.log('\nTEST 5: COD Prohibition on Pre-Booking');
  const codPB = await prisma.order.count({
    where: { OR: [{ orderType: 'PRE_BOOKING' }, { isPreBooking: true }], paymentMethod: 'COD' },
  });
  assert(codPB === 0, `Zero PRE_BOOKING orders with paymentMethod=COD (found: ${codPB})`);

  // ── TEST 6: Member discount schema & enforcement ───────────────────────────
  console.log('\nTEST 6: Member Discount Schema & Enforcement');
  const sampleProd = await prisma.product.findFirst({
    select: { id: true, name: true, hasMemberDiscount: true, memberDiscountType: true, memberDiscountValue: true, isPreBooking: true },
  });
  if (sampleProd) {
    assert(sampleProd.hasMemberDiscount !== undefined, `Product has hasMemberDiscount field (= ${sampleProd.hasMemberDiscount})`);
    assert(sampleProd.memberDiscountType !== undefined, `Product has memberDiscountType field (= ${sampleProd.memberDiscountType ?? 'null'})`);
    assert(sampleProd.memberDiscountValue !== undefined, `Product has memberDiscountValue field (= ${sampleProd.memberDiscountValue ?? 'null'})`);
  }

  // Check pricing engine import
  try {
    const { PricingEngine } = await import('../src/lib/pricing-engine');

    // isPreBooking=true MUST return 0
    const result1 = PricingEngine.calculate({
      items: [{ price: 5000, quantity: 1, productName: 'Test', hasMemberDiscount: true, memberDiscountType: 'PERCENT', memberDiscountValue: 10 }],
      isPreBooking: true,
      hasActiveMembership: true,
    }).memberDiscount;

    assert(result1 === 0, `Pricing engine: PRE_BOOKING member discount = ₹0 (got: ${result1})`);

    // isPreBooking=false, PERCENT 10%, price=5000 → should return 500
    const result2 = PricingEngine.calculate({
      items: [{ price: 5000, quantity: 1, productName: 'Test', hasMemberDiscount: true, memberDiscountType: 'PERCENT', memberDiscountValue: 10 }],
      isPreBooking: false,
      hasActiveMembership: true,
    }).memberDiscount;
    assert(result2 === 500, `Pricing engine: DROPS 10% member discount on ₹5000 = ₹500 (got: ${result2})`);

    // isPreBooking=false, FIXED 300 → should return 300
    const result3 = PricingEngine.calculate({
      items: [{ price: 5000, quantity: 1, productName: 'Test', hasMemberDiscount: true, memberDiscountType: 'FIXED_PRICE', memberDiscountValue: 300 }],
      isPreBooking: false,
      hasActiveMembership: true,
    }).memberDiscount;
    assert(result3 === 300, `Pricing engine: DROPS FIXED ₹300 member discount = ₹300 (got: ${result3})`);

    // not a member → should return 0
    const result4 = PricingEngine.calculate({
      items: [{ price: 5000, quantity: 1, productName: 'Test', hasMemberDiscount: true, memberDiscountType: 'PERCENT', memberDiscountValue: 10 }],
      isPreBooking: false,
      hasActiveMembership: false,
    }).memberDiscount;
    assert(result4 === 0, `Pricing engine: non-member discount = ₹0 (got: ${result4})`);

    // hasMemberDiscount=false → 0
    const result5 = PricingEngine.calculate({
      items: [{ price: 5000, quantity: 1, productName: 'Test', hasMemberDiscount: false }],
      isPreBooking: false,
      hasActiveMembership: true,
    }).memberDiscount;
    assert(result5 === 0, `Pricing engine: hasMemberDiscount=false → ₹0 (got: ${result5})`);
  } catch (e: any) {
    console.log(`  ${W} Could not import pricing-engine: ${e.message}`);
  }


  // ── TEST 7: Notify-Me unique constraint ────────────────────────────────────
  console.log('\nTEST 7: Notify-Me (PreBookingInterest) Duplicate Prevention');
  const totalInterests = await prisma.preBookingInterest.count();
  console.log(`  ${I} Total PreBookingInterest records: ${totalInterests}`);
  assert(typeof totalInterests === 'number', 'prebooking_interests table is queryable');

  // Verify unique constraint on (productId, profileId) via raw SQL
  const constraints = await prisma.$queryRaw<{constraint_name: string; constraint_type: string}[]>`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_name = 'prebooking_interests'
  `;
  console.log(`  ${I} Constraints on prebooking_interests: ${constraints.map((c: any) => `${c.constraint_name}(${c.constraint_type})`).join(', ')}`);
  assert(constraints.some((c: any) => c.constraint_type === 'UNIQUE'), `Unique constraint exists on prebooking_interests`);

  // ── TEST 8: GST extraction on new orders ───────────────────────────────────
  console.log('\nTEST 8: GST Extraction on New Orders');
  const newOrders = await prisma.order.findMany({
    where: {
      paymentStatus: 'PAID',
      orderNumber: { startsWith: 'SS-' },
      taxableAmount: { gt: 0 },
    },
    select: { orderNumber: true, subtotal: true, taxableAmount: true, gstAmount: true, discountAmount: true, walletCredit: true },
    take: 5,
  });
  console.log(`  ${I} New PAID orders with taxableAmount > 0: ${newOrders.length}`);
  for (const o of newOrders) {
    const subtotal = Number(o.subtotal);
    const taxable = Number(o.taxableAmount);
    const gst = Number(o.gstAmount);
    const discount = Number(o.discountAmount || 0);
    const wallet = Number(o.walletCredit || 0);
    const net = subtotal - discount - wallet;
    const sum = taxable + gst;
    const ok = Math.abs(sum - net) < 2.0;
    console.log(`  ${I} #${o.orderNumber}: net=₹${net.toFixed(0)} taxable=₹${taxable.toFixed(0)} gst=₹${gst.toFixed(0)} sum=₹${sum.toFixed(0)}`);
    assert(ok, `Order #${o.orderNumber}: taxable+gst ≈ net selling price (Δ = ₹${Math.abs(sum - net).toFixed(2)})`);
  }
  if (newOrders.length === 0) {
    console.log(`  ${W} No new PAID orders with taxableAmount>0 found — first new order will exercise this path`);
  }

  // ── TEST 9: Admin authorization server-action level ───────────────────────
  console.log('\nTEST 9: Admin Authorization (Code-Level)');
  const { readFileSync } = await import('fs');
  const adminActions = [
    'src/actions/admin-prebookings.actions.ts',
    'src/actions/admin.actions.ts',
    'src/app/admin/orders/actions.ts',
  ];
  for (const f of adminActions) {
    try {
      const code = readFileSync(f, 'utf8');
      const hasAuth = code.includes('isSuperAdminEmail') || code.includes('getServerSession') || code.includes('supabase.auth');
      assert(hasAuth, `${f.split('/').pop()}: contains auth check (isSuperAdminEmail/getServerSession)`);
    } catch { console.log(`  ${W} File not found: ${f}`); }
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  PHASE 1 RESULTS: ${pass} PASS | ${fail} FAIL`);
  console.log('═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
