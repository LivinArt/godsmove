import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { prisma } from '../src/lib/prisma';
import Razorpay from 'razorpay';

async function runForensicInvestigation() {
  const targetEmail = 'livinarttech@gmail.com';
  const targetNumbers = [
    'SS-202608-2890',
    'SS-202608-1347',
    'SS-202608-5720',
    'SS-202608-9169',
    'SS-202608-9152'
  ];

  console.log('================================================================');
  console.log(`🔍 GODSMOVE FORENSIC INVESTIGATION FOR ${targetEmail}`);
  console.log('================================================================');

  // 1. Fetch Orders from DB
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { orderNumber: { in: targetNumbers } },
        { email: targetEmail }
      ]
    },
    include: {
      items: true,
      checkoutSession: true,
      paymentSessions: true,
      transitionLogs: true,
      invoice: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${orders.length} orders in database matching criteria.\n`);

  for (const order of orders) {
    console.log(`----------------------------------------------------------------`);
    console.log(`📦 ORDER #${order.orderNumber} (ID: ${order.id})`);
    console.log(`   Email: ${order.email}`);
    console.log(`   DB Status: ${order.status} | DB PaymentStatus: ${order.paymentStatus}`);
    console.log(`   Payment Method: ${order.paymentMethod}`);
    console.log(`   Razorpay Order ID: ${order.razorpayOrderId || 'NONE'}`);
    console.log(`   Razorpay Payment ID: ${order.razorpayPaymentId || 'NONE'}`);
    console.log(`   Total Amount: ₹${order.total}`);
    console.log(`   Created At: ${order.createdAt.toISOString()}`);
    console.log(`   Updated At: ${order.updatedAt.toISOString()}`);
    console.log(`   Paid At: ${order.paidAt ? order.paidAt.toISOString() : 'NULL'}`);
    console.log(`   Admin Notes: ${order.adminNotes || 'NONE'}`);

    if (order.checkoutSession) {
      const cs = order.checkoutSession;
      console.log(`   --- Related Checkout Session ---`);
      console.log(`       ID: ${cs.id} | SessionToken: ${cs.sessionToken} | Status: ${cs.status} | VerifState: ${cs.verificationState} | RzpOrdId: ${cs.razorpayOrderId} | ExpiresAt: ${cs.expiresAt.toISOString()}`);
    }

    console.log(`   --- Related Payment Sessions (${order.paymentSessions.length}) ---`);
    for (const ps of order.paymentSessions) {
      console.log(`       ID: ${ps.id} | RzpPayId: ${ps.razorpayPaymentId} | Amount: ${ps.amount} | Status: ${ps.status} | CreatedAt: ${ps.createdAt.toISOString()}`);
    }

    console.log(`   --- Transition Audit Logs (${order.transitionLogs.length}) ---`);
    for (const log of order.transitionLogs) {
      console.log(`       [${log.createdAt.toISOString()}] ${log.fromStatus}/${log.fromPaymentStatus} -> ${log.toStatus}/${log.toPaymentStatus} | Actor: ${log.triggerActor} | Reason: "${log.reason}" | Key: ${log.idempotencyKey}`);
    }

    // 2. Query Razorpay API if Razorpay Order ID exists
    if (order.razorpayOrderId) {
      try {
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;
        if (keyId && keySecret) {
          const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const rzpOrder = await rzp.orders.fetch(order.razorpayOrderId);
          const rzpPayments = await rzp.orders.fetchPayments(order.razorpayOrderId);
          console.log(`   --- RAZORPAY GATEWAY REST STATUS ---`);
          console.log(`       Rzp Order Status: ${rzpOrder.status} | Amount Paid: ${rzpOrder.amount_paid} | Attempts: ${rzpOrder.attempts}`);
          console.log(`       Payments Count: ${rzpPayments.items?.length || 0}`);
          for (const p of (rzpPayments.items || [])) {
            console.log(`           Payment ID: ${p.id} | Status: ${p.status} | Method: ${p.method} | Amount: ${Number(p.amount)/100} | CreatedAt: ${new Date(p.created_at * 1000).toISOString()} | ErrorDesc: ${p.error_description || 'NONE'}`);
          }
        }
      } catch (rzpErr: any) {
        console.log(`   ⚠️ Razorpay REST Query Error: ${rzpErr.message}`);
      }
    }
  }

  console.log('================================================================');
  await prisma.$disconnect();
}

runForensicInvestigation().catch((err) => {
  console.error('Forensic Script Error:', err);
  process.exit(1);
});
