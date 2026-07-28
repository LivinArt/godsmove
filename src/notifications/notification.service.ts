import { EmailService } from './email/services/email.service';
import {
  NotificationDispatchPayload,
  NotificationRecipient,
  NotificationEvent,
} from './types/notification.types';
import { InvoiceService } from '@/lib/invoice';

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

  static async notifyOrderConfirmation(recipient: NotificationRecipient, payload: Record<string, any>) {
    return this.dispatch({ event: 'ORDER_CREATED', recipient, payload });
  }

  static async notifyWalletCredit(recipient: NotificationRecipient, payload: Record<string, any>) {
    return this.dispatch({ event: 'WALLET_CREDITED', recipient, payload });
  }

  /**
   * Helper method to map an Order record and dispatch ORDER_CREATED / ORDER_CONFIRMED with stored PDF invoice attachment
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

    try {
      const invoiceResult = await InvoiceService.generateAndStoreInvoice(order);

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
        viewInvoiceUrl: `/api/invoice/view/${order.id}`,
        downloadInvoiceUrl: `/api/invoice/download/${order.id}`,
        attachments: attachPdf
          ? [
              {
                filename: `GODSMOVE_Tax_Invoice_${order.orderNumber}.pdf`,
                content: invoiceResult.pdfBuffer,
              },
            ]
          : [],
      };

      const recipient: NotificationRecipient = {
        email: targetEmail,
        name: recipientName,
        phone: addr.phone || undefined,
        userId: order.profileId || undefined,
      };

      const eventKey = order.status === 'CONFIRMED' || order.paymentStatus === 'PAID' ? 'ORDER_CONFIRMED' : 'ORDER_CREATED';

      console.log(`[ORDER_DISPATCH] Dispatching "${eventKey}" for Order ${order.orderNumber} with stored PDF invoice attachment...`);

      return await NotificationService.dispatch({
        event: eventKey,
        recipient,
        payload,
      });
    } catch (err: any) {
      console.error(`❌ [NOTIFICATION SERVICE] Order confirmation dispatch failed:`, err);
      return { success: false, error: err.message };
    }
  }

  static async sendInvoiceRequest(order: any) {
    if (!order || !order.id) {
      throw new Error('Invalid order object');
    }

    const addr = typeof order.shippingAddress === 'string'
      ? JSON.parse(order.shippingAddress)
      : (order.shippingAddress || {});

    const recipientName = addr.firstName
      ? `${addr.firstName} ${addr.lastName || ''}`.trim()
      : 'Valued Collector';

    const targetEmail = order.email || addr.email;

    const invoiceResult = await InvoiceService.generateAndStoreInvoice(order);

    const payload = {
      customerName: recipientName,
      orderNumber: order.orderNumber,
      invoiceNumber: invoiceResult.invoiceRecord.invoiceNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      total: Number(order.total || 0),
      viewInvoiceUrl: `/api/invoice/view/${order.id}`,
      downloadInvoiceUrl: `/api/invoice/download/${order.id}`,
      attachments: [
        {
          filename: `GODSMOVE_Tax_Invoice_${order.orderNumber}.pdf`,
          content: invoiceResult.pdfBuffer,
        },
      ],
    };

    return this.dispatch({
      event: 'INVOICE_REQUEST',
      recipient: {
        email: targetEmail,
        name: recipientName,
        userId: order.profileId || undefined,
      },
      payload,
    });
  }

  static async sendOrderShipped(order: any, carrier: string, trackingNumber: string) {
    const recipient: NotificationRecipient = {
      email: order.email,
      name: order.email.split('@')[0] || 'Collector',
      userId: order.profileId || undefined,
    };
    
    let attachments: any[] = [];
    try {
      const inv = await InvoiceService.generateAndStoreInvoice(order);
      attachments = [{ filename: `GODSMOVE_Tax_Invoice_${order.orderNumber}.pdf`, content: inv.pdfBuffer }];
    } catch {}

    return this.dispatch({
      event: 'ORDER_SHIPPED',
      recipient,
      payload: {
        orderNumber: order.orderNumber,
        carrier,
        trackingNumber,
        trackingUrl: '/profile?tab=collection',
        attachments,
      },
    });
  }

  static async sendShipmentCreated(to: string, orderNumber: string, carrier: string, trackingNumber: string, trackingUrl: string, estimatedDelivery: string) {
    return this.dispatch({
      event: 'ORDER_SHIPPED',
      recipient: { email: to },
      payload: { orderNumber, carrier, trackingNumber, trackingUrl, estimatedDelivery },
    });
  }

  static async sendShipmentStatusUpdate(to: string, orderNumber: string, trackingNumber: string, status: string, location: string, description: string) {
    return this.dispatch({
      event: status === 'DELIVERED' ? 'ORDER_DELIVERED' : 'ORDER_SHIPPED',
      recipient: { email: to },
      payload: { orderNumber, trackingNumber, status, location, description },
    });
  }

  static async sendOrderDelivered(order: any) {
    const recipient: NotificationRecipient = {
      email: order.email,
      name: order.email.split('@')[0] || 'Collector',
      userId: order.profileId || undefined,
    };

    let attachments: any[] = [];
    try {
      const inv = await InvoiceService.generateAndStoreInvoice(order);
      attachments = [{ filename: `GODSMOVE_Tax_Invoice_${order.orderNumber}.pdf`, content: inv.pdfBuffer }];
    } catch {}

    return this.dispatch({
      event: 'ORDER_DELIVERED',
      recipient,
      payload: {
        orderNumber: order.orderNumber,
        attachments,
        viewInvoiceUrl: `/api/invoice/view/${order.id}`,
        downloadInvoiceUrl: `/api/invoice/download/${order.id}`,
      },
    });
  }

  static async sendOrderCancelled(order: any, reason?: string) {
    const recipient: NotificationRecipient = {
      email: order.email,
      name: order.email.split('@')[0] || 'Collector',
      userId: order.profileId || undefined,
    };
    return this.dispatch({
      event: 'ORDER_CANCELLED',
      recipient,
      payload: { orderNumber: order.orderNumber, reason: reason || 'Requested by customer' },
    });
  }

  static async sendReturnRequested(to: string, returnId: string, orderNumber: string) {
    return this.dispatch({
      event: 'RETURN_REQUESTED',
      recipient: { email: to },
      payload: { returnId, orderNumber },
    });
  }

  static async sendReturnApproved(to: string, returnId: string, carrier?: string, trackingNumber?: string) {
    return this.dispatch({
      event: 'RETURN_APPROVED',
      recipient: { email: to },
      payload: { returnId, carrier, trackingNumber },
    });
  }

  static async sendReturnReceived(to: string, returnId: string) {
    return this.dispatch({
      event: 'RETURN_APPROVED',
      recipient: { email: to },
      payload: { returnId },
    });
  }

  static async sendReturnRefunded(to: string, returnId: string, amount: string, deductionHtml?: string) {
    return this.dispatch({
      event: 'REFUND_COMPLETED',
      recipient: { email: to },
      payload: { returnId, amount, deductionHtml },
    });
  }

  static async sendReturnRejected(to: string, returnId: string, reason: string) {
    return this.dispatch({
      event: 'RETURN_REJECTED',
      recipient: { email: to },
      payload: { returnId, reason },
    });
  }

  static async sendReturnPickupScheduled(to: string, returnId: string, pickupDate: string, carrier?: string) {
    return this.dispatch({
      event: 'RETURN_PICKUP_SCHEDULED',
      recipient: { email: to },
      payload: { returnId, pickupDate, carrier: carrier || 'Logistics Partner' },
    });
  }

  static async sendReturnPickupCompleted(to: string, returnId: string) {
    return this.dispatch({
      event: 'RETURN_PICKUP_COMPLETED',
      recipient: { email: to },
      payload: { returnId },
    });
  }

  static async sendReturnRefundCompleted(to: string, returnId: string, amount: number) {
    return this.dispatch({
      event: 'RETURN_REFUND_COMPLETED',
      recipient: { email: to },
      payload: { returnId, amount },
    });
  }

  static async sendReturnClosed(to: string, returnId: string) {
    return this.dispatch({
      event: 'RETURN_REFUND_COMPLETED',
      recipient: { email: to },
      payload: { returnId },
    });
  }

  static async sendProfileUpdated(email: string, name: string) {
    return this.dispatch({
      event: 'PROFILE_UPDATED',
      recipient: { email, name },
      payload: { customerName: name },
    });
  }

  static async sendPaymentConfirmed(email: string, name: string, orderNumber: string, total: number, transactionId: string, orderId: string) {
    return this.dispatch({
      event: 'PAYMENT_CONFIRMED',
      recipient: { email, name },
      payload: {
        customerName: name,
        orderNumber,
        total,
        transactionId,
        viewInvoiceUrl: `/api/invoice/view/${orderId}`,
        downloadInvoiceUrl: `/api/invoice/download/${orderId}`,
      },
    });
  }

  static async sendPaymentFailed(email: string, name: string, orderNumber: string, reason?: string) {
    return this.dispatch({
      event: 'PAYMENT_FAILED',
      recipient: { email, name },
      payload: { customerName: name, orderNumber, reason: reason || 'Payment transaction was declined or interrupted.' },
    });
  }

  static async sendInactiveUserNotice(email: string, name: string) {
    return this.dispatch({
      event: 'INACTIVE_USER',
      recipient: { email, name },
      payload: { customerName: name },
    });
  }

  static async sendCareRequestSubmitted(to: string, requestId: string, productName: string, category: string) {
    return this.dispatch({
      event: 'ACCOUNT_UPDATED',
      recipient: { email: to },
      payload: { requestId, productName, category },
    });
  }

  static async sendCareRequestApproved(to: string, requestId: string, totalCharge: string) {
    return this.dispatch({
      event: 'ACCOUNT_UPDATED',
      recipient: { email: to },
      payload: { requestId, totalCharge },
    });
  }

  static async sendCareRequestRejected(to: string, requestId: string, reason: string) {
    return this.dispatch({
      event: 'ACCOUNT_UPDATED',
      recipient: { email: to },
      payload: { requestId, reason },
    });
  }

  static async sendCarePaymentReceived(to: string, requestId: string, amount: string) {
    return this.dispatch({
      event: 'ACCOUNT_UPDATED',
      recipient: { email: to },
      payload: { requestId, amount },
    });
  }

  static async sendCareStatusUpdate(to: string, requestId: string, status: string, description: string) {
    return this.dispatch({
      event: 'ACCOUNT_UPDATED',
      recipient: { email: to },
      payload: { requestId, status, description },
    });
  }

  static async sendCustomEmail(to: string, subject: string, message: string) {
    return this.dispatch({
      event: 'NEWSLETTER',
      recipient: { email: to },
      payload: { headline: subject, message },
    });
  }

  static async sendWalletCredited(email: string, name: string, amount: number, newBalance: number) {
    return this.dispatch({
      event: 'WALLET_CREDITED',
      recipient: { email, name },
      payload: { amount, newBalance, customerName: name, entityId: `WLT_CR_${Date.now()}` },
    });
  }

  static async sendWalletDebited(email: string, name: string, amount: number, newBalance: number) {
    return this.dispatch({
      event: 'WALLET_DEBITED',
      recipient: { email, name },
      payload: { amount, newBalance, customerName: name, entityId: `WLT_DR_${Date.now()}` },
    });
  }
}
