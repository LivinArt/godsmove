import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { prisma } from '../src/lib/prisma';
import Razorpay from 'razorpay';

async function investigate6696() {
  const targetNumber = 'SS-202608-6696';
  console.log('================================================================');
  console.log(`🔍 GODSMOVE FORENSIC INVESTIGATION FOR ${targetNumber}`);
  console.log('================================================================');

  const order = await prisma.order.findUnique({
    where: { orderNumber: targetNumber },
    include: {
      items: true,
      checkoutSession: true,
      paymentSessions: true,
      transitionLogs: true,
      invoice: true,
    }
  });

  if (!order) {
    console.error(`❌ Order #${targetNumber} not found in database.`);
    process.exit(1);
  }

  console.log(`📦 ORDER #${order.orderNumber} (ID: ${order.id})`);
  console.log(`   Email: ${order.email}`);
  console.log(`   Profile ID: ${order.profileId || 'NULL'}`);
  console.log(`   DB Status: ${order.status} | DB PaymentStatus: ${order.paymentStatus}`);
  console.log(`   Payment Method: ${order.paymentMethod}`);
  console.log(`   Razorpay Order ID: ${order.razorpayOrderId || 'NONE'}`);
  console.log(`   Razorpay Payment ID: ${order.razorpayPaymentId || 'NONE'}`);
  console.log(`   Total Amount: ₹${order.total}`);
  console.log(`   Subtotal: ₹${order.subtotal} | Shipping: ₹${order.shippingCost} | CodFee: ₹${order.codFee}`);
  console.log(`   Created At: ${order.createdAt.toISOString()}`);
  console.log(`   Updated At: ${order.updatedAt.toISOString()}`);
  console.log(`   Paid At: ${order.paidAt ? order.paidAt.toISOString() : 'NULL'}`);
  console.log(`   Admin Notes: ${order.adminNotes || 'NONE'}`);

  if (order.checkoutSession) {
    const cs = order.checkoutSession;
    console.log(`   --- Checkout Session ---`);
    console.log(`       ID: ${cs.id} | Token: ${cs.sessionToken} | Status: ${cs.status} | VerifState: ${cs.verificationState} | RzpOrdId: ${cs.razorpayOrderId} | ExpiresAt: ${cs.expiresAt.toISOString()}`);
  } else {
    console.log(`   --- Checkout Session: NONE ---`);
  }

  console.log(`   --- Payment Sessions (${order.paymentSessions.length}) ---`);
  for (const ps of order.paymentSessions) {
    console.log(`       ID: ${ps.id} | RzpPayId: ${ps.razorpayPaymentId} | Amount: ₹${ps.amount} | Status: ${ps.status} | CreatedAt: ${ps.createdAt.toISOString()}`);
  }

  console.log(`   --- Transition Audit Logs (${order.transitionLogs.length}) ---`);
  for (const log of order.transitionLogs) {
    console.log(`       [${log.createdAt.toISOString()}] ${log.fromStatus}/${log.fromPaymentStatus} -> ${log.toStatus}/${log.toPaymentStatus} | Actor: ${log.triggerActor} | Reason: "${log.reason}" | Key: ${log.idempotencyKey}`);
  }

  // Razorpay API direct query
  if (order.razorpayOrderId) {
    try {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;
      if (keyId && keySecret) {
        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const rzpOrder = await rzp.orders.fetch(order.razorpayOrderId);
        const rzpPayments = await rzp.orders.fetchPayments(order.razorpayOrderId);
        console.log(`   --- RAZORPAY GATEWAY REST STATUS ---`);
        console.log(`       Rzp Order ID: ${rzpOrder.id} | Status: ${rzpOrder.status} | Amount Paid: ₹${rzpOrder.amount_paid/100} | Attempts: ${rzpOrder.attempts}`);
        console.log(`       Gateway Payments Count: ${rzpPayments.items?.length || 0}`);
        for (const p of (rzpPayments.items || [])) {
          console.log(`           Payment ID: ${p.id} | Status: ${p.status} | Method: ${p.method} | Amount: ₹${Number(p.amount)/100} | CreatedAt: ${new Date(p.created_at * 1000).toISOString()} | ErrorDesc: ${p.error_description || 'NONE'}`);
        }
      }
    } catch (rzpErr: any) {
      console.log(`   ⚠️ Razorpay REST Query Error: ${rzpErr.message}`);
    }
  } else {
    console.log(`   ⚠️ No Razorpay Order ID on Order. Querying Razorpay by amount & timestamp...`);
    try {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;
      if (keyId && keySecret) {
        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const paymentsRes = await rzp.payments.all({ count: 50 });
        const items = (paymentsRes as any).items || [];
        const match = items.filter((p: any) => p.email === order.email || Number(p.amount)/100 === Number(order.total));
        console.log(`   Matching Razorpay payments found by email/amount: ${match.length}`);
        for (const p of match) {
          console.log(`       Payment ID: ${p.id} | OrderID: ${p.order_id} | Status: ${p.status} | Amount: ₹${Number(p.amount)/100} | CreatedAt: ${new Date(p.created_at * 1000).toISOString()}`);
        }
      }
    } catch (err: any) {
      console.log(`   ⚠️ Razorpay Search Error: ${err.message}`);
    }
  }

  console.log('================================================================');
  await prisma.$disconnect();
}

investigate6696();
