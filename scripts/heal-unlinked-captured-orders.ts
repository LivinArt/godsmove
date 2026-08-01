import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { prisma } from '../src/lib/prisma';
import { PaymentStateEngine } from '../src/lib/payments/payment-state-engine';

async function healCapturedOrders() {
  console.log('================================================================');
  console.log('🩹 GODSMOVE DATA HEALING WORKER FOR UNLINKED CAPTURED PAYMENTS');
  console.log('================================================================');

  const targets = [
    {
      orderNumber: 'SS-202608-1347',
      razorpayOrderId: 'order_TKaPLVBVbnP6Ym',
      razorpayPaymentId: 'pay_TKaPWEgwaDeVNs',
    },
    {
      orderNumber: 'SS-202608-5720',
      razorpayOrderId: 'order_TKX3mP5gv2HsU4',
      razorpayPaymentId: 'pay_TKX3vodr41NxIh',
    },
  ];

  for (const target of targets) {
    console.log(`\nProcessing target Order #${target.orderNumber}...`);
    const order = await prisma.order.findUnique({
      where: { orderNumber: target.orderNumber },
      include: { items: true },
    });

    if (!order) {
      console.log(`❌ Order #${target.orderNumber} not found in database.`);
      continue;
    }

    console.log(`   Found Order ID: ${order.id} | Current DB Status: ${order.status} | DB PayStatus: ${order.paymentStatus}`);

    // Link Razorpay Order ID and Payment ID on Order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpayOrderId: target.razorpayOrderId,
        razorpayPaymentId: target.razorpayPaymentId,
      },
    });

    console.log(`   Linked Razorpay Order ID ${target.razorpayOrderId} & Payment ID ${target.razorpayPaymentId} to DB Order.`);

    // Execute PaymentStateEngine Webhook Order Recovery
    const recovered = await PaymentStateEngine.executeTransition({
      transition: 'CONFIRM_PAYMENT',
      orderId: order.id,
      razorpayPaymentId: target.razorpayPaymentId,
      razorpayOrderId: target.razorpayOrderId,
      triggerActor: 'ADMIN',
      reason: 'Data healing worker recovered captured gateway payment',
    });

    console.log(`   ✅ Order #${target.orderNumber} successfully recovered to Status: ${recovered?.status} | PayStatus: ${recovered?.paymentStatus}!`);
  }

  console.log('\n================================================================');
  console.log('✅ DATA HEALING COMPLETED SUCCESSFULLY');
  console.log('================================================================');

  await prisma.$disconnect();
}

healCapturedOrders().catch((err) => {
  console.error('Data Healing Error:', err);
  process.exit(1);
});
