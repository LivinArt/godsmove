import { prisma } from '@/lib/prisma';
import { razorpayService } from './razorpay-service';
import { PaymentStateEngine } from '@/lib/payments/payment-state-engine';

class WebhookService {
  /**
   * Process raw webhook request payloads from Razorpay
   */
  async handleRazorpayWebhook(rawBody: string, signature: string) {
    // 1. Validate signature
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error('Invalid webhook signature verification');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[WebhookService] Received Razorpay Event: ${event}`);

    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload.payload.payment.entity);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(payload.payload.payment.entity);
        break;

      case 'refund.processed':
        await this.handleRefundProcessed(payload.payload.refund.entity);
        break;

      default:
        console.log(`[WebhookService] Event ${event} is not configured. Skipped.`);
    }

    return { success: true };
  }

  /**
   * Handle captured payment (ensure status is synced to PAID via PaymentStateEngine)
   */
  private async handlePaymentCaptured(payment: any) {
    const rzpOrderId = payment.order_id;
    const rzpPaymentId = payment.id;

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: rzpOrderId },
    });

    if (!order) {
      console.error(`[WebhookService] Order with Razorpay ID ${rzpOrderId} not found.`);
      return;
    }

    await PaymentStateEngine.executeTransition({
      transition: 'CONFIRM_PAYMENT',
      orderId: order.id,
      razorpayPaymentId: rzpPaymentId,
      razorpayOrderId: rzpOrderId,
      triggerActor: 'WEBHOOK',
      reason: 'Razorpay payment.captured webhook service',
    });
    console.log(`[WebhookService] Order ${order.id} successfully confirmed/recovered from webhook via PaymentStateEngine.`);
  }

  /**
   * Handle failed payment (release inventory reservations and mark FAILED via PaymentStateEngine)
   */
  private async handlePaymentFailed(payment: any) {
    const rzpOrderId = payment.order_id;

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: rzpOrderId },
    });

    if (!order) {
      console.error(`[WebhookService] Failed order with Razorpay ID ${rzpOrderId} not found.`);
      return;
    }

    await PaymentStateEngine.executeTransition({
      transition: 'CANCEL_PAYMENT',
      orderId: order.id,
      razorpayOrderId: rzpOrderId,
      triggerActor: 'WEBHOOK',
      reason: payment.error_description || 'Razorpay payment.failed webhook service',
    });
    console.log(`[WebhookService] Order ${order.id} processed cancellation check via PaymentStateEngine.`);
  }

  /**
   * Handle processed refund (update status in database)
   */
  private async handleRefundProcessed(refund: any) {
    const rzpRefundId = refund.id;
    const rzpPaymentId = refund.payment_id;
    const amount = Number(refund.amount) / 100; // converted to INR

    const order = await prisma.order.findFirst({
      where: { razorpayPaymentId: rzpPaymentId },
    });

    if (order) {
      const newNote = `[Webhook Refund processed] Razorpay Refund ID ${rzpRefundId} for ₹${amount} has settled.`;
      const nextAdminNotes = order.adminNotes 
        ? `${order.adminNotes}\n${newNote}` 
        : newNote;

      await prisma.order.update({
        where: { id: order.id },
        data: { adminNotes: nextAdminNotes },
      });
      console.log(`[WebhookService] Webhook confirmed payment ${rzpPaymentId} refund processed.`);
    }
  }
}

export const webhookService = new WebhookService();
