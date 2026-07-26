import { EmailService } from './email/services/email.service';
import {
  NotificationDispatchPayload,
  NotificationRecipient,
  NotificationEvent,
} from './types/notification.types';

/**
 * PRODUCTION NOTIFICATION SERVICE ORCHESTRATOR
 *
 * Enterprise event-driven notification manager.
 * Receives business event dispatches and routes to appropriate channel adapters
 * (Email, WhatsApp, Push) using central Template Registry.
 *
 * Fully stateless & compatible with Vercel Serverless Functions.
 */
export class NotificationService {
  /**
   * Unified Entry Point for All Business Event Dispatches
   */
  static async dispatch(params: NotificationDispatchPayload) {
    const { event, recipient, payload, channels = ['EMAIL'] } = params;
    console.log(`[NOTIFICATION SERVICE] Dispatching event "${event}" to ${recipient.email}`);

    const results: Record<string, any> = {};

    if (channels.includes('EMAIL')) {
      results.email = await EmailService.sendNotification(event, recipient, payload);
    }

    // Future Multi-Channel Expansion Slots:
    // if (channels.includes('WHATSAPP') && recipient.phone) {
    //   results.whatsapp = await WhatsAppService.sendNotification(event, recipient, payload);
    // }
    // if (channels.includes('PUSH') && recipient.userId) {
    //   results.push = await PushNotificationService.sendNotification(event, recipient, payload);
    // }

    return results;
  }

  /**
   * Helper method to map a Prisma Order database record and dispatch ORDER_CREATED event.
   */
  static async sendOrderConfirmationForOrder(order: any) {
    if (!order || !order.id) {
      console.warn('⚠️ [NOTIFICATION SERVICE] Attempted to send order confirmation for invalid order record.');
      return { success: false, error: 'Invalid order object' };
    }

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

    const payload = {
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
      const recipient: NotificationRecipient = {
        email: targetEmail,
        name: recipientName,
        phone: addr.phone || undefined,
      };

      const dispatchResult = await NotificationService.dispatch({
        event: 'ORDER_CREATED',
        recipient,
        payload,
      });

      return { success: true, ...dispatchResult };
    } catch (err: any) {
      console.error(`❌ [NOTIFICATION SERVICE] Non-critical error dispatching ORDER_CREATED for order ${order.id}:`, err?.message || err);
      return { success: false, error: err?.message || 'Email dispatch failed' };
    }
  }

  // Convenience methods for specific business triggers
  static async notifyOrderConfirmation(recipient: NotificationRecipient, payload: any) {
    return this.dispatch({ event: 'ORDER_CREATED', recipient, payload });
  }

  static async notifyInvoice(recipient: NotificationRecipient, payload: any) {
    return this.dispatch({ event: 'ORDER_CREATED', recipient, payload });
  }

  static async notifyWalletCredit(recipient: NotificationRecipient, payload: any) {
    return this.dispatch({ event: 'WALLET_CREDITED', recipient, payload });
  }

  static async notifyReturnUpdate(recipient: NotificationRecipient, payload: any) {
    return this.dispatch({ event: 'RETURN_REQUESTED', recipient, payload });
  }

  static async notifyOrderShipped(recipient: NotificationRecipient, payload: any) {
    return this.dispatch({ event: 'ORDER_SHIPPED', recipient, payload });
  }

  static async notifyOrderDelivered(recipient: NotificationRecipient, payload: any) {
    return this.dispatch({ event: 'ORDER_DELIVERED', recipient, payload });
  }
}
