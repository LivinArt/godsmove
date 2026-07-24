import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { confirmOrder } from '@/actions/order.actions';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // ── VERIFY WEBHOOK SIGNATURE ─────────────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      console.warn('Razorpay webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    // ── HANDLE PAYMENT CAPTURED ───────────────────────────────────────────────
    if (eventType === 'payment.captured') {
      const payment = payload.payment.entity;
      const { order_id, id: paymentId, notes } = payment;

      // notes.orderId is our internal order ID set during Razorpay order creation
      const internalOrderId = notes?.orderId;

      if (!internalOrderId) {
        console.error('No internal order ID in Razorpay payment notes');
        return NextResponse.json({ error: 'Missing order reference' }, { status: 400 });
      }

      await confirmOrder(internalOrderId, paymentId, order_id);

      console.log(`✅ Order ${internalOrderId} confirmed via webhook`);
    }

    // ── HANDLE PAYMENT FAILED ─────────────────────────────────────────────────
    if (eventType === 'payment.failed') {
      const payment = payload.payment.entity;
      const internalOrderId = payment.notes?.orderId;

      if (internalOrderId) {
        await prisma.order.update({
          where: { id: internalOrderId },
          data: { paymentStatus: 'FAILED' },
        });

        // Release reserved inventory
        const order = await prisma.order.findUnique({
          where: { id: internalOrderId },
          include: { items: true },
        });

        if (order) {
          for (const item of order.items) {
            await prisma.inventory.update({
              where: { variantId: item.variantId },
              data: { reservedStock: { decrement: item.quantity } },
            });
          }
        }

        console.log(`❌ Payment failed for order ${internalOrderId} — inventory released`);
      }
    }

    // ── HANDLE REFUND ─────────────────────────────────────────────────────────
    if (eventType === 'refund.processed') {
      const refund = payload.refund.entity;
      console.log(`Refund processed: ${refund.id}`);
      // Future: update order paymentStatus to REFUNDED
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
