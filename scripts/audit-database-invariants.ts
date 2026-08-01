import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { prisma } from '../src/lib/prisma';

async function runDatabaseInvariantAudit() {
  console.log('================================================================');
  console.log('🛡️ GODSMOVE DATABASE INVARIANT SAFETY AUDIT (PHASE 9)');
  console.log('================================================================');

  let violationsFound = 0;

  // Rule 1: FAILED + PROCESSING
  const rule1 = await prisma.order.findMany({
    where: { status: 'PROCESSING', paymentStatus: 'FAILED' }
  });
  console.log(`[RULE 1] Status: PROCESSING + PaymentStatus: FAILED -> Count: ${rule1.length}`);
  if (rule1.length > 0) violationsFound += rule1.length;

  // Rule 2: PAID + CANCELLED
  const rule2 = await prisma.order.findMany({
    where: { status: 'CANCELLED', paymentStatus: 'PAID' }
  });
  console.log(`[RULE 2] Status: CANCELLED + PaymentStatus: PAID -> Count: ${rule2.length}`);
  if (rule2.length > 0) violationsFound += rule2.length;

  // Rule 3: PAID + FAILED
  const rule3 = await prisma.order.findMany({
    where: { status: 'CONFIRMED', paymentStatus: 'FAILED' }
  });
  console.log(`[RULE 3] Status: CONFIRMED + PaymentStatus: FAILED -> Count: ${rule3.length}`);
  if (rule3.length > 0) violationsFound += rule3.length;

  // Rule 4: UNPAID Razorpay with paidAt populated
  const rule4 = await prisma.order.findMany({
    where: { paymentStatus: 'UNPAID', paidAt: { not: null } }
  });
  console.log(`[RULE 4] PaymentStatus: UNPAID + paidAt != null -> Count: ${rule4.length}`);
  if (rule4.length > 0) violationsFound += rule4.length;

  // Rule 5: FAILED + SHIPPED
  const rule5 = await prisma.order.findMany({
    where: { status: 'SHIPPED', paymentStatus: 'FAILED' }
  });
  console.log(`[RULE 5] Status: SHIPPED + PaymentStatus: FAILED -> Count: ${rule5.length}`);
  if (rule5.length > 0) violationsFound += rule5.length;

  // Rule 6: FAILED + DELIVERED
  const rule6 = await prisma.order.findMany({
    where: { status: 'DELIVERED', paymentStatus: 'FAILED' }
  });
  console.log(`[RULE 6] Status: DELIVERED + PaymentStatus: FAILED -> Count: ${rule6.length}`);
  if (rule6.length > 0) violationsFound += rule6.length;

  console.log('================================================================');
  if (violationsFound === 0) {
    console.log('✅ DATABASE INVARIANT VERIFICATION PERFECT: 0 VIOLATIONS FOUND');
  } else {
    console.error(`❌ DATABASE INVARIANT AUDIT FAILED: ${violationsFound} ILLEGAL ROWS DETECTED!`);
    process.exit(1);
  }
  console.log('================================================================');

  await prisma.$disconnect();
}

runDatabaseInvariantAudit().catch((err) => {
  console.error('Audit script error:', err);
  process.exit(1);
});
