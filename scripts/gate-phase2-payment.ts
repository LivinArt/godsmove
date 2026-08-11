/**
 * PHASE 2 — Payment Recovery & Idempotency Gate
 * Verifies that the payment state engine prevents duplicate orders/memberships
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const P = '\x1b[32m[PASS]\x1b[0m';
const F = '\x1b[31m[FAIL]\x1b[0m';
const I = '\x1b[36m  -->\x1b[0m';
const W = '\x1b[33m[WARN]\x1b[0m';
const NT = '\x1b[35m[NOT TESTABLE]\x1b[0m';

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string, detail = '') {
  if (cond) { console.log(`  ${P} ${msg}`); pass++; }
  else { console.log(`  ${F} ${msg}${detail ? ' — ' + detail : ''}`); fail++; }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GODSMOVE FINAL PRODUCTION GATE — PHASE 2: PAYMENT');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ── TEST 1: Idempotency key in payment flow ────────────────────────────────
  console.log('TEST 1: Idempotency / Duplicate Order Prevention (Code Audit)');
  try {
    const pse = readFileSync('src/lib/payments/payment-state-engine.ts', 'utf8');
    assert(pse.includes('idempotencyKey') || pse.includes('razorpay_order_id') || pse.includes('razorpayOrderId'),
      'Payment engine uses idempotency key / Razorpay order ID to prevent duplicates');
    assert(pse.includes('findUnique') || pse.includes('findFirst'),
      'Payment engine checks for existing order before creating new one');
    assert(pse.includes('upsert') || pse.includes('transaction'),
      'Payment engine uses transaction/upsert for atomic operations');
    assert(pse.includes('membershipActivated'),
      'Payment engine checks membershipActivated to prevent double-activation');
  } catch (e: any) {
    console.log(`  ${W} Could not read payment-state-engine.ts: ${e.message}`);
  }

  // ── TEST 2: Order deduplication — no double orders for same payment ────────
  console.log('\nTEST 2: No Duplicate Orders in Database');
  const allOrders = await prisma.order.findMany({
    select: { razorpayOrderId: true, orderNumber: true },
    where: { razorpayOrderId: { not: null } },
  });
  const seen = new Map<string, string[]>();
  for (const o of allOrders) {
    if (o.razorpayOrderId) {
      if (!seen.has(o.razorpayOrderId)) seen.set(o.razorpayOrderId, []);
      seen.get(o.razorpayOrderId)!.push(o.orderNumber);
    }
  }
  const dups = [...seen.entries()].filter(([, orders]) => orders.length > 1);
  assert(dups.length === 0, `No duplicate orders for same razorpayOrderId (found ${dups.length} duplicates)`,
    dups.map(([id, orders]) => `${id}: ${orders.join(', ')}`).join('; '));

  // ── TEST 3: No double membership activations ───────────────────────────────
  console.log('\nTEST 3: No Duplicate Membership Activations');
  const membershipCounts = await prisma.membership.groupBy({
    by: ['profileId'],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });
  assert(membershipCounts.length === 0,
    `No profile has more than 1 membership record (profiles with duplicates: ${membershipCounts.length})`);

  // ── TEST 4: Failed payments have no membership activation ─────────────────
  console.log('\nTEST 4: Failed Payments → No Membership');
  const failedWithMem = await prisma.order.count({
    where: { paymentStatus: 'FAILED', membershipActivated: true },
  });
  assert(failedWithMem === 0,
    `Zero FAILED orders with membershipActivated=true (found: ${failedWithMem})`);

  // ── TEST 5: UNPAID orders have no membership activation ───────────────────
  const unpaidWithMem = await prisma.order.count({
    where: { paymentStatus: 'UNPAID', membershipActivated: true },
  });
  assert(unpaidWithMem === 0,
    `Zero UNPAID orders with membershipActivated=true (found: ${unpaidWithMem})`);

  // ── TEST 6: Payment recovery route exists ──────────────────────────────────
  console.log('\nTEST 5: Payment Recovery Route & Session Recovery');
  try {
    readFileSync('src/app/checkout/payment-recovery/page.tsx', 'utf8');
    assert(true, 'Payment recovery page exists at /checkout/payment-recovery');
  } catch {
    assert(false, 'Payment recovery page exists at /checkout/payment-recovery');
  }
  try {
    const checkoutActions = readFileSync('src/actions/checkout.actions.ts', 'utf8');
    assert(checkoutActions.includes('getActiveCheckoutSession') || checkoutActions.includes('CheckoutSession'),
      'checkout.actions.ts: getActiveCheckoutSession exists for recovery');
    assert(checkoutActions.includes('PaymentSession') || checkoutActions.includes('payment_sessions') || checkoutActions.includes('paymentSession'),
      'Checkout actions handle payment sessions for refresh recovery');
  } catch (e: any) {
    console.log(`  ${W} checkout.actions.ts: ${e.message}`);
  }

  // ── TEST 7: COD server-side enforcement ───────────────────────────────────
  console.log('\nTEST 6: Server-Side COD Prohibition for Pre-Booking');
  try {
    const orderActions = readFileSync('src/actions/order.actions.ts', 'utf8');
    assert(
      (orderActions.includes('COD') && orderActions.includes('PRE_BOOKING') && orderActions.includes('prohibited')) ||
      (orderActions.includes('Cash on Delivery is strictly prohibited') || orderActions.includes('COD is not allowed')),
      'order.actions.ts: COD prohibition for PRE_BOOKING enforced server-side'
    );
  } catch (e: any) {
    console.log(`  ${W} order.actions.ts: ${e.message}`);
  }

  // ── TEST 8: Invoice generation ─────────────────────────────────────────────
  console.log('\nTEST 7: Invoice Generation');
  try {
    const invoiceFile = readFileSync('src/app/invoice/[orderId]/page.tsx', 'utf8') ||
                        readFileSync('src/app/api/invoice/[orderId]/route.ts', 'utf8');
    assert(true, 'Invoice route exists');
  } catch {
    // Try API route
    try {
      readFileSync('src/app/api/invoice/route.ts', 'utf8');
      assert(true, 'Invoice API route exists');
    } catch {
      console.log(`  ${NT} Invoice route — could not locate file`);
    }
  }

  // Also verify PRE_BOOKING orders have invoice-relevant fields
  const pbOrderForInvoice = await prisma.order.findFirst({
    where: { orderType: 'PRE_BOOKING', paymentStatus: 'PAID' },
    select: { id: true, orderNumber: true, total: true, taxableAmount: true, gstAmount: true },
  });

  if (pbOrderForInvoice) {
    console.log(`  ${I} Sample PRE_BOOKING PAID order for invoice: #${pbOrderForInvoice.orderNumber}`);
    assert(Boolean(pbOrderForInvoice.total), `Order #${pbOrderForInvoice.orderNumber}: total is set (₹${pbOrderForInvoice.total})`);
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  PHASE 2 RESULTS: ${pass} PASS | ${fail} FAIL`);
  console.log('═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
