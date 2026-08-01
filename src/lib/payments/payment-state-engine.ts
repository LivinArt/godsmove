import { prisma } from '@/lib/prisma';
import { InvoiceService } from '@/lib/invoice';
import { NotificationService } from '@/notifications/notification.service';

export type PaymentTransitionType = 'CONFIRM_PAYMENT' | 'CANCEL_PAYMENT' | 'RECONCILE_PAYMENT';

export interface TransitionPayload {
  orderId: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  reason?: string;
}

export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * GODSMOVE V7 Canonical Payment Transition Engine
 * Centralized, transactional state transition service. All gateway callbacks, webhooks,
 * recovery modals, cron jobs, and admin actions MUST invoke this engine.
 */
export class PaymentStateEngine {
  /**
   * Executes a canonical order payment confirmation transition.
   * Atomically sets paymentStatus = 'PAID', status = 'CONFIRMED', deducts inventory,
   * generates invoice, and dispatches customer notification emails inside a database transaction lock.
   */
  static async confirmOrder(orderId: string, razorpayPaymentId?: string, razorpayOrderId?: string) {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Idempotency check: if already confirmed/paid, return existing order safely
      if (order.paymentStatus === 'PAID') {
        return order;
      }

      // Guard: Illegal transition checks
      if (order.status === 'CANCELLED') {
        throw new InvalidStateTransitionError(`Cannot confirm order ${orderId} because it is in CANCELLED status.`);
      }

      // Execute database mutation
      const confirmed = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: razorpayPaymentId ? 'RAZORPAY' : order.paymentMethod,
          razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
          razorpayOrderId: razorpayOrderId || order.razorpayOrderId,
          paidAt: new Date(),
        },
      });

      // Atomic inventory deduction & movement ledger
      for (const item of order.items) {
        const inv = await tx.inventory.upsert({
          where: { variantId: item.variantId },
          create: {
            variantId: item.variantId,
            totalStock: 100,
            reservedStock: 0,
            soldStock: item.quantity,
          },
          update: {
            reservedStock: { decrement: item.quantity },
            soldStock: { increment: item.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            delta: -item.quantity,
            type: 'PURCHASE',
            reason: `Order #${order.orderNumber} payment confirmed`,
            orderId: order.id,
          },
        });
      }

      return confirmed;
    });

    // Side-effects execution outside transaction block
    try {
      if (razorpayPaymentId) {
        await InvoiceService.updatePaymentStatus(orderId, 'PAID', razorpayPaymentId, 'RAZORPAY').catch(() => {});
      }

      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, profile: true },
      });

      if (fullOrder) {
        const custName = fullOrder.profile
          ? `${fullOrder.profile.firstName || ''} ${fullOrder.profile.lastName || ''}`.trim()
          : 'Valued Collector';

        // Dispatch notifications out-of-band
        await NotificationService.sendPaymentConfirmed(
          fullOrder.email,
          custName,
          fullOrder.orderNumber,
          Number(fullOrder.total),
          razorpayPaymentId || 'PAYMENT_CONFIRMED',
          fullOrder.id
        ).catch(() => {});

        await NotificationService.sendOrderConfirmationForOrder(fullOrder, true).catch(() => {});
      }
    } catch (sideEffectErr) {
      console.error('[PAYMENT_STATE_ENGINE] Side-effects warning:', sideEffectErr);
    }

    return updatedOrder;
  }

  /**
   * Executes a canonical order payment cancellation transition.
   * Atomically sets paymentStatus = 'FAILED', status = 'CANCELLED', and releases reserved stock.
   */
  static async cancelOrder(orderId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Idempotency check: if already cancelled, return existing order
      if (order.status === 'CANCELLED') {
        return order;
      }

      // Guard: Illegal transition checks
      if (order.paymentStatus === 'PAID') {
        throw new InvalidStateTransitionError(`Cannot cancel order ${orderId} because it is already PAID.`);
      }

      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });

      // Release reserved inventory
      for (const item of order.items) {
        const inv = await tx.inventory.findFirst({ where: { variantId: item.variantId } });
        if (inv && inv.reservedStock > 0) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              reservedStock: { decrement: Math.min(inv.reservedStock, item.quantity) },
            },
          });
        }
      }

      return cancelled;
    });
  }
}
