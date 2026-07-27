import { EmailService } from './email/services/email.service';
import {
  NotificationDispatchPayload,
  NotificationRecipient,
  NotificationEvent,
} from './types/notification.types';
import { InvoiceService } from '@/lib/invoice';

/**
 * PRODUCTION NOTIFICATION SERVICE ORCHESTRATOR
 *
 * Enterprise event-driven notification manager.
 * Routes business event dispatches to appropriate channel adapters
 * (Email, WhatsApp, Push) using central Template Registry.
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

    return results;
  }

  /**
   * Legacy alias for order confirmation test dispatches
   */
  static async notifyOrderConfirmation(recipient: NotificationRecipient, payload: Record<string, any>) {
    return this.dispatch({
      event: 'ORDER_CREATED',
      recipient,
      payload,
    });
  }

  /**
   * Legacy alias for wallet credit test dispatches
   */
  static async notifyWalletCredit(recipient: NotificationRecipient, payload: Record<string, any>) {
    return this.dispatch({
      event: 'WALLET_CREDITED',
      recipient,
      payload,
    });
  }

  /**
   * Helper method to map an Order record and dispatch ORDER_CREATED / ORDER_CONFIRMED with optional PDF invoice attachment
   */
  static async sendOrderConfirmationForOrder(order: any, attachPdf: boolean = true) {
    if (!order || !order.id) {
      console.warn('⚠️ [NOTIFICATION SERVICE] Invalid order record for confirmation email.');
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
        }))
      : [];

    const payload = {
      customerName: recipientName,
      orderNumber: order.orderNumber || `GM-${order.id.slice(-6)}`,
      orderId: order.id,
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
      invoiceUrl: `https://godsmove.in/api/invoice/${order.id}`,
    };

    try {
      const recipient: NotificationRecipient = {
        email: targetEmail,
        name: recipientName,
        phone: addr.phone || undefined,
      };

      const invoiceData = {
        invoiceNumber: `INV-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt || new Date(),
        email: targetEmail,
        customerName: recipientName,
        shippingAddress: {
          firstName: addr.firstName || 'Valued',
          lastName: addr.lastName || 'Collector',
          line1: addr.line1 || '',
          line2: addr.line2 || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || '',
          phone: addr.phone || '',
        },
        items: items.map((i: any) => ({
          productName: i.title,
          size: i.size,
          quantity: i.quantity,
          unitPrice: i.price,
          totalPrice: i.price * i.quantity,
        })),
        subtotal: Number(order.subtotal || 0),
        discountAmount: Number(order.discountAmount || 0),
        walletCredit: Number(order.walletCredit || 0),
        shippingCost: Number(order.shippingCost || 0),
        total: Number(order.total || 0),
        paymentMethod: order.paymentMethod || 'PREPAID',
        paymentStatus: order.paymentStatus || 'PAID',
      };

      await InvoiceService.saveInvoiceFile(invoiceData);

      const eventKey = order.status === 'CONFIRMED' || order.paymentStatus === 'PAID' ? 'ORDER_CONFIRMED' : 'ORDER_CREATED';

      const dispatchResult = await NotificationService.dispatch({
        event: eventKey,
        recipient,
        payload,
      });

      return dispatchResult;
    } catch (err: any) {
      console.error(`❌ [NOTIFICATION SERVICE] Order confirmation dispatch failed:`, err);
      return { success: false, error: err.message };
    }
  }

  static async sendOrderShipped(order: any, carrier: string, trackingNumber: string) {
    const recipient: NotificationRecipient = {
      email: order.email,
      name: order.email.split('@')[0] || 'Collector',
    };
    return this.dispatch({
      event: 'ORDER_SHIPPED',
      recipient,
      payload: {
        orderNumber: order.orderNumber,
        carrier,
        trackingNumber,
        trackingUrl: 'https://godsmove.in/profile',
      },
    });
  }

  static async sendOrderDelivered(order: any) {
    const recipient: NotificationRecipient = {
      email: order.email,
      name: order.email.split('@')[0] || 'Collector',
    };
    return this.dispatch({
      event: 'ORDER_DELIVERED',
      recipient,
      payload: { orderNumber: order.orderNumber },
    });
  }

  static async sendOrderCancelled(order: any, reason?: string) {
    const recipient: NotificationRecipient = {
      email: order.email,
      name: order.email.split('@')[0] || 'Collector',
    };
    return this.dispatch({
      event: 'ORDER_CANCELLED',
      recipient,
      payload: { orderNumber: order.orderNumber, reason: reason || 'Requested by customer' },
    });
  }

  static async sendWalletCredited(email: string, name: string, amount: number, newBalance: number) {
    return this.dispatch({
      event: 'WALLET_CREDITED',
      recipient: { email, name },
      payload: { amount, newBalance, customerName: name },
    });
  }
}
