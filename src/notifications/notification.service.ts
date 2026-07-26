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
