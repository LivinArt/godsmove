import React from 'react';
import { NotificationEvent, EmailSenderConfig } from '../../types/notification.types';
import OrderConfirmationTemplate from './OrderConfirmationTemplate';
import OrderShippedTemplate from './OrderShippedTemplate';
import OrderDeliveredTemplate from './OrderDeliveredTemplate';
import OrderCancelledTemplate from './OrderCancelledTemplate';
import ReturnRequestedTemplate from './ReturnRequestedTemplate';
import ReturnApprovedTemplate from './ReturnApprovedTemplate';
import ReturnRejectedTemplate from './ReturnRejectedTemplate';
import ReturnCompletedTemplate from './ReturnCompletedTemplate';
import WalletCreditedTemplate from './WalletCreditedTemplate';
import WalletDebitedTemplate from './WalletDebitedTemplate';
import PasswordResetTemplate from './PasswordResetTemplate';
import WelcomeTemplate from './WelcomeTemplate';
import NewsletterTemplate from './NewsletterTemplate';
import NewDropTemplate from './NewDropTemplate';
import CouponTemplate from './CouponTemplate';

export interface EmailTemplateDefinition {
  component: React.ComponentType<any>;
  subjectBuilder: (payload: any) => string;
  senderConfig: EmailSenderConfig;
}

// Default mailbox settings (GoDaddy Webmail hosted verified domain)
const DEFAULT_SENDER: EmailSenderConfig = {
  from: 'GODSMOVE <support@godsmove.in>',
  replyTo: 'support@godsmove.in',
};

/**
 * CENTRALIZED TEMPLATE REGISTRY
 *
 * Maps every business NotificationEvent to its independent email template component,
 * subject builder, and sender identity configuration.
 *
 * Future mailbox changes (e.g. orders@, billing@, concierge@) are configured here
 * without modifying any checkout, payment, or business logic.
 */
export const TEMPLATE_REGISTRY: Record<NotificationEvent, EmailTemplateDefinition> = {
  ORDER_CREATED: {
    component: OrderConfirmationTemplate,
    subjectBuilder: (p) => `Allocation Confirmed: Order ${p.orderNumber || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER, // Can be updated to orders@godsmove.in later
  },
  ORDER_SHIPPED: {
    component: OrderShippedTemplate,
    subjectBuilder: (p) => `Allocation Dispatched: Order ${p.orderNumber || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  ORDER_DELIVERED: {
    component: OrderDeliveredTemplate,
    subjectBuilder: (p) => `Allocation Delivered: Order ${p.orderNumber || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  ORDER_CANCELLED: {
    component: OrderCancelledTemplate,
    subjectBuilder: (p) => `Order Cancellation Notice: ${p.orderNumber || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_REQUESTED: {
    component: ReturnRequestedTemplate,
    subjectBuilder: (p) => `Return Request Received: ${p.returnId || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_APPROVED: {
    component: ReturnApprovedTemplate,
    subjectBuilder: (p) => `Return Request Approved: ${p.returnId || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_REJECTED: {
    component: ReturnRejectedTemplate,
    subjectBuilder: (p) => `Return Request Notice: ${p.returnId || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_COMPLETED: {
    component: ReturnCompletedTemplate,
    subjectBuilder: (p) => `Return Settlement Completed: ${p.returnId || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  WALLET_CREDITED: {
    component: WalletCreditedTemplate,
    subjectBuilder: (p) => `₹${Number(p.amount || 0).toLocaleString('en-IN')} Privilege Credits Credited | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  WALLET_DEBITED: {
    component: WalletDebitedTemplate,
    subjectBuilder: (p) => `₹${Number(p.amount || 0).toLocaleString('en-IN')} Vault Credits Applied | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  PASSWORD_RESET: {
    component: PasswordResetTemplate,
    subjectBuilder: () => `Password Reset Instructions | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  WELCOME: {
    component: WelcomeTemplate,
    subjectBuilder: () => `Welcome to the GODSMOVE Archival Movement`,
    senderConfig: DEFAULT_SENDER,
  },
  NEWSLETTER: {
    component: NewsletterTemplate,
    subjectBuilder: (p) => p.headline || `Archival Dispatch | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  NEW_DROP: {
    component: NewDropTemplate,
    subjectBuilder: (p) => `New Drop Allocation Released: ${p.dropName || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  COUPON: {
    component: CouponTemplate,
    subjectBuilder: (p) => `Exclusive Privilege Pass: ${p.couponCode || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
};

export class TemplateResolver {
  static resolve(event: NotificationEvent): EmailTemplateDefinition {
    const definition = TEMPLATE_REGISTRY[event];
    if (!definition) {
      throw new Error(`[TEMPLATE RESOLVER ERROR] No template definition registered for event: ${event}`);
    }
    return definition;
  }
}
