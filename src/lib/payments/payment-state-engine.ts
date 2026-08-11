import { prisma } from '@/lib/prisma';
import { InvoiceService } from '@/lib/invoice';
import { NotificationService } from '@/notifications/notification.service';

export type PaymentTransitionType = 'CONFIRM_PAYMENT' | 'CANCEL_PAYMENT' | 'RECONCILE_PAYMENT';
export type TriggerActor = 'WEBHOOK' | 'RECOVERY_MODAL' | 'CRON_WORKER' | 'CLEANUP_JOB' | 'CALLBACK' | 'ADMIN';

export interface TransitionPayload {
  orderId: string;
  transition: PaymentTransitionType;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  triggerActor?: TriggerActor;
  reason?: string;
}

export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * GODSMOVE V7.1 Canonical Payment Transition Engine
 * Centralized, transactional state transition service. All gateway callbacks, webhooks,
 * recovery modals, cron jobs, and admin actions MUST invoke this engine.
 * 
 * Single Source of Truth for order status, payment status, inventory, invoices, and emails.
 */
export class PaymentStateEngine {
  /**
   * Universal canonical transition executor.
   */
  static async executeTransition(payload: TransitionPayload) {
    const { transition, orderId, razorpayPaymentId, razorpayOrderId, triggerActor = 'CALLBACK', reason } = payload;
    const timestamp = new Date().toISOString();

    console.log(
      `[PAYMENT_STATE_ENGINE_FORENSIC_LOG] timestamp=${timestamp} orderId=${orderId} requestedTransition=${transition} triggerActor=${triggerActor} razorpayPaymentId=${razorpayPaymentId || 'N/A'} razorpayOrderId=${razorpayOrderId || 'N/A'} reason="${reason || 'N/A'}"`
    );

    if (transition === 'CONFIRM_PAYMENT') {
      return await PaymentStateEngine.confirmOrder(orderId, razorpayPaymentId, razorpayOrderId, triggerActor);
    } else if (transition === 'CANCEL_PAYMENT') {
      return await PaymentStateEngine.cancelOrder(orderId, reason, triggerActor);
    } else if (transition === 'RECONCILE_PAYMENT') {
      if (razorpayOrderId) {
        const { PaymentService } = await import('@/lib/payments/payment-service');
        const gatewayCheck = await PaymentService.verifyPaymentStatusOnGateway(razorpayOrderId);
        if (gatewayCheck.isCaptured && gatewayCheck.paymentId) {
          return await PaymentStateEngine.confirmOrder(orderId, gatewayCheck.paymentId, razorpayOrderId, triggerActor);
        } else if (gatewayCheck.status === 'failed' || gatewayCheck.status === 'cancelled') {
          return await PaymentStateEngine.cancelOrder(orderId, reason || 'Gateway reported failure', triggerActor);
        }
      }
      return await prisma.order.findUnique({ where: { id: orderId } });
    }

    throw new InvalidStateTransitionError(`Unsupported transition type: ${transition}`);
  }

  /**
   * Executes a canonical order payment confirmation transition.
   * Supports WEBHOOK ORDER RECOVERY: if an order was prematurely marked CANCELLED/FAILED,
   * but a valid Razorpay payment capture is verified, it atomically recovers the order,
   * confirms DB status, deducts stock, generates invoice, updates sessions, and dispatches confirmation emails.
   */
  static async confirmOrder(
    orderId: string,
    razorpayPaymentId?: string,
    razorpayOrderId?: string,
    triggerActor: TriggerActor = 'CALLBACK'
  ) {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Idempotency check: if already confirmed/paid, return existing order safely
      if (order.paymentStatus === 'PAID' && order.status === 'CONFIRMED') {
        return order;
      }

      // Webhook / REST Order Recovery Guard:
      // If order is currently CANCELLED/FAILED, allow recovery ONLY if razorpayPaymentId is verified
      const isRecovery = order.status === 'CANCELLED' || order.paymentStatus === 'FAILED';
      if (isRecovery && !razorpayPaymentId) {
        throw new InvalidStateTransitionError(
          `Cannot confirm order ${orderId} in CANCELLED status without verified Razorpay payment ID.`
        );
      }

      if (isRecovery) {
        console.log(
          `[WEBHOOK_ORDER_RECOVERY] Recovering CANCELLED Order #${order.orderNumber} (ID: ${orderId}) using verified Razorpay Payment ID: ${razorpayPaymentId} [Actor: ${triggerActor}]`
        );
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

      // Update related CheckoutSession if exists
      const targetRzpOrderId = razorpayOrderId || order.razorpayOrderId;
      if (targetRzpOrderId) {
        await tx.checkoutSession.updateMany({
          where: {
            OR: [
              { orderId: order.id },
              { razorpayOrderId: targetRzpOrderId }
            ]
          },
          data: {
            status: 'COMPLETED',
            verificationState: 'CAPTURED',
          }
        }).catch(() => {});
      }

      // Record / Update PaymentSession
      if (razorpayPaymentId) {
        await tx.paymentSession.upsert({
          where: { razorpayPaymentId },
          create: {
            orderId: order.id,
            razorpayOrderId: targetRzpOrderId,
            razorpayPaymentId,
            amount: order.total,
            status: 'CAPTURED',
          },
          update: {
            status: 'CAPTURED',
          }
        }).catch(() => {});
      }

      // Record Audit Transition Log
      const idempotencyKey = `${order.id}_CONFIRMED_${razorpayPaymentId || 'DIRECT'}`;
      await tx.paymentTransitionLog.upsert({
        where: { idempotencyKey },
        create: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'CONFIRMED',
          fromPaymentStatus: order.paymentStatus,
          toPaymentStatus: 'PAID',
          triggerActor,
          reason: isRecovery ? 'Order recovered from verified payment capture' : 'Payment confirmed',
          idempotencyKey,
        },
        update: {},
      }).catch(() => {});

      // Atomically increment product currentPreBookings allocation & grant GODSMOVE Membership for Pre-Booking orders
      if (order.isPreBooking || order.orderType === 'PRE_BOOKING') {
        for (const item of order.items) {
          if (item.variantId) {
            const vr = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { productId: true },
            });
            if (vr?.productId) {
              const targetProd = await tx.product.findUnique({
                where: { id: vr.productId },
                select: { maxPreBooking: true, currentPreBookings: true },
              });
              if (
                targetProd?.maxPreBooking != null &&
                targetProd.currentPreBookings + item.quantity > targetProd.maxPreBooking
              ) {
                throw new InvalidStateTransitionError(
                  `Pre-Booking allocation capacity (${targetProd.maxPreBooking}) exceeded for product.`
                );
              }
              await tx.product.update({
                where: { id: vr.productId },
                data: { currentPreBookings: { increment: item.quantity } },
              });
            }
          }
        }



        let targetProfileId = order.profileId;
        if (!targetProfileId && order.email) {
          const prof = await tx.profile.findFirst({
            where: { email: { equals: order.email, mode: 'insensitive' } },
            select: { id: true },
          });
          if (prof) targetProfileId = prof.id;
        }

        if (targetProfileId) {
          const existingMembership = await tx.membership.findUnique({
            where: { profileId: targetProfileId },
          });

          const now = new Date();
          const isCurrentlyActive = existingMembership &&
            existingMembership.status === 'ACTIVE' &&
            existingMembership.expiresAt &&
            existingMembership.expiresAt > now;

          if (!existingMembership) {
            // First Pre-Booking -> Activate 1-year Membership
            const actDate = order.paidAt || now;
            const expDate = new Date(actDate);
            expDate.setFullYear(expDate.getFullYear() + 1);

            await tx.membership.create({
              data: {
                profileId: targetProfileId,
                status: 'ACTIVE',
                source: 'PRE_BOOKING',
                sourceOrderId: order.id,
                tier: 'VIP',
                activatedAt: actDate,
                expiresAt: expDate,
              },
            });
          } else if (!isCurrentlyActive) {
            // Expired or cancelled membership -> Reactivate for 1 year from new pre-booking
            const actDate = order.paidAt || now;
            const expDate = new Date(actDate);
            expDate.setFullYear(expDate.getFullYear() + 1);

            await tx.membership.update({
              where: { profileId: targetProfileId },
              data: {
                status: 'ACTIVE',
                source: 'PRE_BOOKING',
                sourceOrderId: order.id,
                tier: 'VIP',
                activatedAt: actDate,
                expiresAt: expDate,
              },
            });
          } else {
            // Currently active membership exists -> DO NOT extend expiresAt, DO NOT reset activatedAt
            console.log(`[Membership] User ${targetProfileId} already has active membership until ${existingMembership.expiresAt?.toISOString()}. Multiple pre-booking duration extension ignored.`);
          }

          await tx.order.update({
            where: { id: order.id },
            data: { membershipActivated: true, profileId: targetProfileId },
          });
        }
      }


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
            reservedStock: { decrement: Math.min(100, item.quantity) },
            soldStock: { increment: item.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            delta: -item.quantity,
            type: 'PURCHASE',
            reason: isRecovery
              ? `Order #${order.orderNumber} payment recovered from webhook/REST`
              : `Order #${order.orderNumber} payment confirmed`,
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

        if (fullOrder.isPreBooking || fullOrder.orderType === 'PRE_BOOKING') {
          await NotificationService.sendPreBookingConfirmedForOrder(fullOrder).catch(() => {});
        }

        if (Number(fullOrder.walletCredit || 0) > 0 && fullOrder.profileId) {
          const wallet = await prisma.wallet.findUnique({ where: { profileId: fullOrder.profileId } });
          const remBalance = Number(wallet?.balance || 0);
          await NotificationService.sendWalletDebited(fullOrder.email, custName, Number(fullOrder.walletCredit), remBalance).catch(() => {});
        }
      }
    } catch (sideEffectErr) {
      console.error('[PAYMENT_STATE_ENGINE] Side-effects warning:', sideEffectErr);
    }

    return updatedOrder;
  }

  /**
   * Executes a canonical order payment cancellation transition.
   * Verifies Razorpay REST API out-of-band before executing cancellation.
   * If Razorpay status is CAPTURED, it auto-confirms payment instead of cancelling.
   * If Razorpay status is still pending (created/attempted), it retains AWAITING_PAYMENT state.
   */
  static async cancelOrder(
    orderId: string,
    reason?: string,
    triggerActor: TriggerActor = 'CALLBACK'
  ) {
    const order = await prisma.order.findUnique({
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

    // Guard: Cannot cancel a PAID order
    if (order.paymentStatus === 'PAID') {
      throw new InvalidStateTransitionError(`Cannot cancel order ${orderId} because it is already PAID.`);
    }

    // Razorpay REST Verification Guard before cancelling:
    const targetRzpOrderId = order.razorpayOrderId;
    if (targetRzpOrderId) {
      try {
        const { PaymentService } = await import('@/lib/payments/payment-service');
        const gatewayCheck = await PaymentService.verifyPaymentStatusOnGateway(targetRzpOrderId);

        if (gatewayCheck.isCaptured && gatewayCheck.paymentId) {
          console.log(
            `[CANCEL_GUARD] Payment ${gatewayCheck.paymentId} was captured on Razorpay! Auto-confirming Order ${order.orderNumber} instead of cancelling.`
          );
          return await PaymentStateEngine.confirmOrder(order.id, gatewayCheck.paymentId, targetRzpOrderId, triggerActor);
        }

        // If payment is still created/attempted (pending at bank/OTP), DO NOT cancel prematurely
        if (gatewayCheck.status === 'created' || gatewayCheck.status === 'attempted') {
          console.log(
            `[CANCEL_GUARD] Payment is still PENDING on Razorpay for Order ${order.orderNumber}. Retaining AWAITING_PAYMENT status.`
          );
          return order;
        }
      } catch (checkErr) {
        console.warn(`[CANCEL_GUARD] Could not verify Razorpay status for ${orderId}:`, checkErr);
      }
    }

    // Execute cancellation mutation
    return prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });

      // Update related CheckoutSession if exists
      if (targetRzpOrderId) {
        await tx.checkoutSession.updateMany({
          where: {
            OR: [
              { orderId: order.id },
              { razorpayOrderId: targetRzpOrderId }
            ]
          },
          data: {
            status: 'CANCELLED',
            verificationState: 'FAILED',
          }
        }).catch(() => {});
      }

      // Audit transition log
      const idempotencyKey = `${order.id}_CANCELLED_${Date.now()}`;
      await tx.paymentTransitionLog.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'CANCELLED',
          fromPaymentStatus: order.paymentStatus,
          toPaymentStatus: 'FAILED',
          triggerActor,
          reason: reason || 'Order payment cancelled',
          idempotencyKey,
        }
      }).catch(() => {});

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
