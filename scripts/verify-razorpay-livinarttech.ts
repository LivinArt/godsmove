import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { prisma } from '../src/lib/prisma';
import Razorpay from 'razorpay';

async function runRazorpayVerification() {
  console.log('================================================================');
  console.log('🔍 RAZORPAY GATEWAY DIRECT QUERY FOR livinarttech@gmail.com');
  console.log('================================================================');

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;

  if (!keyId || !keySecret) {
    console.error('Razorpay credentials missing');
    process.exit(1);
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

  // Fetch recent payments from Razorpay REST API
  try {
    const paymentsRes = await rzp.payments.all({ count: 50 });
    const items = (paymentsRes as any).items || [];

    console.log(`Fetched ${items.length} recent payments from Razorpay REST API:\n`);

    const customerPayments = items.filter((p: any) => p.email === 'livinarttech@gmail.com');
    console.log(`Found ${customerPayments.length} payments for livinarttech@gmail.com:\n`);

    for (const p of customerPayments) {
      console.log(`----------------------------------------------------------------`);
      console.log(`Payment ID  : ${p.id}`);
      console.log(`Order ID    : ${p.order_id}`);
      console.log(`Status      : ${p.status}`);
      console.log(`Amount      : ₹${p.amount / 100}`);
      console.log(`Method      : ${p.method}`);
      console.log(`Email       : ${p.email}`);
      console.log(`Contact     : ${p.contact}`);
      console.log(`Created At  : ${new Date(p.created_at * 1000).toISOString()}`);
      console.log(`Description : ${p.description || 'N/A'}`);
      console.log(`Notes       : ${JSON.stringify(p.notes || {})}`);

      // Try to find matching order in DB by amount, email, or timestamp
      const createdTime = new Date(p.created_at * 1000);
      const timeWindowStart = new Date(createdTime.getTime() - 30 * 60 * 1000);
      const timeWindowEnd = new Date(createdTime.getTime() + 30 * 60 * 1000);

      const matchingOrders = await prisma.order.findMany({
        where: {
          email: 'livinarttech@gmail.com',
          total: p.amount / 100,
          createdAt: { gte: timeWindowStart, lte: timeWindowEnd }
        }
      });

      console.log(`   Matching DB Orders in 30m window (${matchingOrders.length}):`);
      for (const mo of matchingOrders) {
        console.log(`     -> Order #${mo.orderNumber} (ID: ${mo.id}) | DB Status: ${mo.status} | DB PayStatus: ${mo.paymentStatus} | RzpOrdId: ${mo.razorpayOrderId || 'NULL'}`);
      }
    }

  } catch (err: any) {
    console.error('Failed to query Razorpay REST API:', err.message || err);
  }

  console.log('================================================================');
  await prisma.$disconnect();
}

runRazorpayVerification();
