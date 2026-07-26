import { EmailService } from './email/services/email.service';
import { OrderConfirmationEmailProps } from './email/templates/OrderConfirmation';
import { InvoiceEmailProps } from './email/templates/Invoice';
import { WalletCreditEmailProps } from './email/templates/WalletCredit';
import { ReturnUpdateEmailProps } from './email/templates/ReturnUpdate';
import { OrderShippedEmailProps } from './email/templates/OrderShipped';
import { OrderDeliveredEmailProps } from './email/templates/OrderDelivered';

export interface NotificationUserRecipient {
  email: string;
  phone?: string;
  name: string;
}

/**
 * Unified Notification Architecture Orchestrator
 *
 * Dispatches notifications across multi-channel adapters (Email, WhatsApp, Push).
 * Future services (e.g. WhatsAppService) plug into this class without altering core business logic.
 */
export class NotificationService {
  private static sentOrderIds = new Set<string>();

  /**
   * Helper method to map a Prisma Order database record and dispatch Order Confirmation email cleanly.
   * Includes idempotency guard to prevent duplicate dispatches for the same order ID.
   */
  static async sendOrderConfirmationForOrder(order: any) {
    if (!order || !order.id) {
      console.warn('⚠️ [NOTIFICATION SERVICE] Attempted to send order confirmation for invalid order record.');
      return { success: false, error: 'Invalid order object' };
    }

    // Idempotency check: prevent duplicate emails for the same order
    if (NotificationService.sentOrderIds.has(order.id)) {
      console.log(`ℹ️ [NOTIFICATION SERVICE] Order confirmation email already sent for order ${order.id} (${order.orderNumber}). Skipping duplicate dispatch.`);
      return { success: true, duplicate: true };
    }

    // Mark order as processed for email dispatch
    NotificationService.sentOrderIds.add(order.id);

    const addr = typeof order.shippingAddress === 'string'
      ? JSON.parse(order.shippingAddress)
      : (order.shippingAddress || {});

    const recipientName = addr.firstName
      ? `${addr.firstName} ${addr.lastName || ''}`.trim()
      : 'Valued Collector';

    const targetEmail = order.email || addr.email || 'support@godsmove.in';

    const formattedDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    const items = Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          id: item.id || item.variantId,
          title: item.productName || item.name || 'GODSMOVE Statement Piece',
          size: item.size || 'L',
          color: item.color || null,
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          imageUrl: item.variant?.product?.frontImageUrl || item.variant?.product?.images?.[0]?.url || 'https://godsmove.in/images/hero-1.jpg',
        }))
      : [];

    const emailPayload: OrderConfirmationEmailProps = {
      customerName: recipientName,
      orderNumber: order.orderNumber || `GM-${order.id.slice(-6)}`,
      orderDate: formattedDate,
      items,
      subtotal: Number(order.subtotal || 0),
      shipping: Number(order.shippingCost || 0),
      walletDiscount: Number(order.walletCredit || 0),
      couponDiscount: Number(order.discountAmount || 0),
      total: Number(order.total || 0),
      shippingAddress: {
        name: recipientName,
        line1: addr.line1 || 'Address Line 1',
        line2: addr.line2 || null,
        city: addr.city || 'Mumbai',
        state: addr.state || 'Maharashtra',
        pincode: addr.pincode || '400050',
        phone: addr.phone || '',
      },
      trackOrderUrl: 'https://godsmove.in/profile',
      continueShoppingUrl: 'https://godsmove.in/drops',
    };

    try {
      console.log(`[NOTIFICATION SERVICE] Dispatching Order Confirmation Email for Order #${order.orderNumber} to ${targetEmail}`);
      const emailResult = await EmailService.sendOrderConfirmation(targetEmail, emailPayload);
      console.log(`✅ [NOTIFICATION SERVICE] Order Confirmation Email sent successfully for #${order.orderNumber}. Resend ID: ${emailResult.id || 'N/A'}`);
      return { success: true, email: emailResult };
    } catch (err: any) {
      console.error(`❌ [NOTIFICATION SERVICE] Non-critical email dispatch failure for order ${order.id}:`, err?.message || err);
      // Return error result without throwing so database order creation/verification NEVER fails
      return { success: false, error: err?.message || 'Email dispatch failed' };
    }
  }

  /**
   * Dispatch Order Confirmation across configured channels
   */
  static async notifyOrderConfirmation(
    recipient: NotificationUserRecipient,
    data: OrderConfirmationEmailProps
  ) {
    console.log(`[NOTIFICATION SERVICE] Triggering Order Confirmation for ${recipient.email}`);

    // 1. Dispatch Email
    const emailResult = await EmailService.sendOrderConfirmation(recipient.email, data);

    // 2. Future WhatsApp Integration Slot
    // if (recipient.phone) {
    //   await WhatsAppService.sendOrderConfirmation(recipient.phone, data);
    // }

    return { email: emailResult };
  }

  /**
   * Dispatch Tax Invoice
   */
  static async notifyInvoice(
    recipient: NotificationUserRecipient,
    data: InvoiceEmailProps
  ) {
    console.log(`[NOTIFICATION SERVICE] Triggering Tax Invoice for ${recipient.email}`);
    const emailResult = await EmailService.sendInvoice(recipient.email, data);
    return { email: emailResult };
  }

  /**
   * Dispatch Wallet Credit Notification
   */
  static async notifyWalletCredit(
    recipient: NotificationUserRecipient,
    data: WalletCreditEmailProps
  ) {
    console.log(`[NOTIFICATION SERVICE] Triggering Wallet Credit Notification for ${recipient.email}`);
    const emailResult = await EmailService.sendWalletCredit(recipient.email, data);
    return { email: emailResult };
  }

  /**
   * Dispatch Return Request Update
   */
  static async notifyReturnUpdate(
    recipient: NotificationUserRecipient,
    data: ReturnUpdateEmailProps
  ) {
    console.log(`[NOTIFICATION SERVICE] Triggering Return Update for ${recipient.email}`);
    const emailResult = await EmailService.sendReturnUpdate(recipient.email, data);
    return { email: emailResult };
  }

  /**
   * Dispatch Order Shipped Notification
   */
  static async notifyOrderShipped(
    recipient: NotificationUserRecipient,
    data: OrderShippedEmailProps
  ) {
    console.log(`[NOTIFICATION SERVICE] Triggering Order Shipped Notification for ${recipient.email}`);
    const emailResult = await EmailService.sendOrderShipped(recipient.email, data);
    return { email: emailResult };
  }

  /**
   * Dispatch Order Delivered Notification
   */
  static async notifyOrderDelivered(
    recipient: NotificationUserRecipient,
    data: OrderDeliveredEmailProps
  ) {
    console.log(`[NOTIFICATION SERVICE] Triggering Order Delivered Notification for ${recipient.email}`);
    const emailResult = await EmailService.sendOrderDelivered(recipient.email, data);
    return { email: emailResult };
  }
}
