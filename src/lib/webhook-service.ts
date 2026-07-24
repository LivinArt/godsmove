import { prisma } from '@/lib/prisma';
import { razorpayService } from './razorpay-service';

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
   * Handle captured payment (ensure status is synced to PAID)
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

    if (order.paymentStatus === 'PAID') {
      console.log(`[WebhookService] Order ${order.id} is already marked as PAID.`);
      return;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        razorpayPaymentId: rzpPaymentId,
        paidAt: new Date(),
      },
    });

    console.log(`[WebhookService] Order ${order.id} successfully marked as PAID from webhook.`);
  }

  /**
   * Handle failed payment (release inventory reservations and mark FAILED)
   */
  private async handlePaymentFailed(payment: any) {
    const rzpOrderId = payment.order_id;

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: rzpOrderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`[WebhookService] Failed order with Razorpay ID ${rzpOrderId} not found.`);
      return;
    }

    if (order.paymentStatus === 'FAILED') {
      return;
    }

    // 1. Transactional rollback of stocks (restock)
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: { totalStock: { increment: item.quantity } },
        });

        const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (inv) {
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              delta: item.quantity,
              type: 'UNRESERVE',
              reason: `Failed Checkout Restock #${order.id}`,
            },
          });
        }
      }

      // 2. Mark order FAILED
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
        },
      });

      // 3. Refund used wallet credits if any were deducted during draft
      if (Number(order.walletCredit) > 0 && order.profileId) {
        const wallet = await tx.wallet.findUnique({ where: { profileId: order.profileId } });
        if (wallet) {
          await tx.wallet.update({
            where: { profileId: order.profileId },
            data: { balance: { increment: Number(order.walletCredit) } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: Number(order.walletCredit),
              type: 'CREDIT_ADJUSTMENT',
              description: `Restored credit from Failed checkout Order #${order.id}`,
            },
          });
        }
      }
    });

    console.log(`[WebhookService] Order ${order.id} payment FAILED. Restocked inventory.`);
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
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
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
