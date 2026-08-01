import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PaymentStateEngine } from '@/lib/payments/payment-state-engine';

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

      // Authoritative state machine execution with WEBHOOK ORDER RECOVERY
      await PaymentStateEngine.executeTransition({
        transition: 'CONFIRM_PAYMENT',
        orderId: internalOrderId,
        razorpayPaymentId: paymentId,
        razorpayOrderId: order_id,
        triggerActor: 'WEBHOOK',
        reason: 'Razorpay payment.captured webhook event',
      });

      console.log(`✅ Order ${internalOrderId} confirmed/recovered via webhook via PaymentStateEngine`);
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
        // Delegate cancellation to PaymentStateEngine (which executes gateway REST verification guard first)
        await PaymentStateEngine.executeTransition({
          transition: 'CANCEL_PAYMENT',
          orderId: internalOrderId,
          razorpayOrderId: order_id,
          triggerActor: 'WEBHOOK',
          reason: payment.error_description || 'Razorpay payment.failed webhook event',
        });
      }
    }

    // ── HANDLE REFUND ─────────────────────────────────────────────────────────
    if (eventType === 'refund.processed') {
      const refund = payload.refund.entity;
      console.log(`Refund processed: ${refund.id}`);
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
