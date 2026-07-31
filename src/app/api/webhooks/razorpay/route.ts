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

      // Robust Multi-Fallback Order Correlation Strategy
      let internalOrderId = notes?.orderId || notes?.internalOrderId;

      if (!internalOrderId && order_id) {
        const orderByRzp = await prisma.order.findFirst({
          where: { razorpayOrderId: order_id },
          select: { id: true }
        });
        if (orderByRzp) internalOrderId = orderByRzp.id;
      }

      if (!internalOrderId && notes?.orderNumber) {
        const orderByNum = await prisma.order.findFirst({
          where: { orderNumber: notes.orderNumber },
          select: { id: true }
        });
        if (orderByNum) internalOrderId = orderByNum.id;
      }

      if (!internalOrderId) {
        console.error('❌ [WEBHOOK CORRELATION FAILED]: No order reference found for payment', paymentId);
        return NextResponse.json({ error: 'Unresolvable order reference' }, { status: 400 });
      }

      await confirmOrder(internalOrderId, paymentId, order_id);
      console.log(`✅ Order ${internalOrderId} confirmed via webhook (Idempotent)`);
    }

    // ── HANDLE PAYMENT FAILED ─────────────────────────────────────────────────
    if (eventType === 'payment.failed') {
      const payment = payload.payment.entity;
      const { order_id, notes } = payment;

      let internalOrderId = notes?.orderId || notes?.internalOrderId;

      if (!internalOrderId && order_id) {
        const orderByRzp = await prisma.order.findFirst({
          where: { razorpayOrderId: order_id },
          select: { id: true }
        });
        if (orderByRzp) internalOrderId = orderByRzp.id;
      }

      if (internalOrderId) {
        const order = await prisma.order.findUnique({
          where: { id: internalOrderId },
          include: { items: true },
        });

        // ONLY mark failed if order is NOT already PAID
        if (order && order.paymentStatus !== 'PAID') {
          await prisma.order.update({
            where: { id: internalOrderId },
            data: { paymentStatus: 'FAILED' },
          });

          for (const item of order.items) {
            const inv = await prisma.inventory.findFirst({ where: { variantId: item.variantId } });
            if (inv && inv.reservedStock > 0) {
              await prisma.inventory.update({
                where: { id: inv.id },
                data: { reservedStock: { decrement: Math.min(inv.reservedStock, item.quantity) } },
              });
            }
          }

          try {
            const { NotificationService } = await import('@/notifications/notification.service');
            const addr = typeof order.shippingAddress === 'string'
              ? JSON.parse(order.shippingAddress)
              : (order.shippingAddress || {});
            const customerName = addr.firstName ? `${addr.firstName} ${addr.lastName || ''}`.trim() : 'Collector';
            const reason = payment.error_description || 'Payment transaction was declined or interrupted.';
            await NotificationService.sendPaymentFailed(order.email, customerName, order.orderNumber, reason);
          } catch (notifErr) {
            console.error('Payment failed notification error:', notifErr);
          }
        }
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
