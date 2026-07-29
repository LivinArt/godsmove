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

// Marketing Templates
import NewsletterMarketingTemplate from './marketing/NewsletterMarketingTemplate';
import NewDropMarketingTemplate from './marketing/NewDropMarketingTemplate';
import CollectionLaunchMarketingTemplate from './marketing/CollectionLaunchMarketingTemplate';
import LimitedEditionMarketingTemplate from './marketing/LimitedEditionMarketingTemplate';
import CouponMarketingTemplate from './marketing/CouponMarketingTemplate';
import FlashSaleMarketingTemplate from './marketing/FlashSaleMarketingTemplate';
import BirthdayMarketingTemplate from './marketing/BirthdayMarketingTemplate';
import FestivalMarketingTemplate from './marketing/FestivalMarketingTemplate';
import ReferralMarketingTemplate from './marketing/ReferralMarketingTemplate';
import LoyaltyUpgradeMarketingTemplate from './marketing/LoyaltyUpgradeMarketingTemplate';
import WishlistReminderMarketingTemplate from './marketing/WishlistReminderMarketingTemplate';
import AbandonedCartMarketingTemplate from './marketing/AbandonedCartMarketingTemplate';
import BackInStockMarketingTemplate from './marketing/BackInStockMarketingTemplate';
import PriceDropMarketingTemplate from './marketing/PriceDropMarketingTemplate';
import RecommendationMarketingTemplate from './marketing/RecommendationMarketingTemplate';
import VipEarlyAccessMarketingTemplate from './marketing/VipEarlyAccessMarketingTemplate';
import MembershipInvitationMarketingTemplate from './marketing/MembershipInvitationMarketingTemplate';
import SeasonalMarketingTemplate from './marketing/SeasonalMarketingTemplate';

import InvoiceRequestTemplate from './InvoiceRequestTemplate';
import ProfileUpdatedTemplate from './ProfileUpdatedTemplate';
import PaymentConfirmationTemplate from './PaymentConfirmationTemplate';
import ReturnPickupScheduledTemplate from './ReturnPickupScheduledTemplate';
import ReturnRefundCompletedTemplate from './ReturnRefundCompletedTemplate';

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
 */
export const TEMPLATE_REGISTRY: Record<NotificationEvent, EmailTemplateDefinition> = {
  ORDER_CREATED: {
    component: OrderConfirmationTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Order ${p.orderNumber ? `#${p.orderNumber}` : ''} is Confirmed`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  ORDER_CONFIRMED: {
    component: OrderConfirmationTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Order ${p.orderNumber ? `#${p.orderNumber}` : ''} is Confirmed`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  ORDER_SHIPPED: {
    component: OrderShippedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Order ${p.orderNumber ? `#${p.orderNumber}` : ''} has been Shipped`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  ORDER_DELIVERED: {
    component: OrderDeliveredTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Order ${p.orderNumber ? `#${p.orderNumber}` : ''} has been Delivered`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  ORDER_CANCELLED: {
    component: OrderCancelledTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Order ${p.orderNumber ? `#${p.orderNumber}` : ''} Cancellation Notice`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  PAYMENT_CONFIRMED: {
    component: PaymentConfirmationTemplate,
    subjectBuilder: (p) => `Payment Confirmed: Order ${p.orderNumber ? `#${p.orderNumber}` : ''} | GODSMOVE`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  PAYMENT_SUCCESSFUL: {
    component: PaymentConfirmationTemplate,
    subjectBuilder: (p) => `Payment Confirmed: Order ${p.orderNumber ? `#${p.orderNumber}` : ''} | GODSMOVE`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  PAYMENT_FAILED: {
    component: OrderCancelledTemplate,
    subjectBuilder: (p) => `Payment Issue Notice: Order ${p.orderNumber ? `#${p.orderNumber}` : ''} | GODSMOVE`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  PROFILE_UPDATED: {
    component: ProfileUpdatedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Profile was Updated ${p.entityId ? `(#${String(p.entityId).slice(-7).toUpperCase()})` : ''}`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_REQUESTED: {
    component: ReturnRequestedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Return Request ${p.returnId ? `#${p.returnId}` : ''} Received`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_APPROVED: {
    component: ReturnApprovedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Return ${p.returnId ? `#${p.returnId}` : ''} has been Approved`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_REJECTED: {
    component: ReturnRejectedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Return Request Notice: ${p.returnId || ''}`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_PICKUP_SCHEDULED: {
    component: ReturnPickupScheduledTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Return Pickup Scheduled for ${p.pickupDate || 'Soon'} (${p.returnId || ''})`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_PICKUP_COMPLETED: {
    component: ReturnCompletedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Return Package Received at Warehouse (${p.returnId || ''})`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_REFUND_COMPLETED: {
    component: ReturnRefundCompletedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Return Refund Settlement Completed (${p.returnId || ''})`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  RETURN_COMPLETED: {
    component: ReturnCompletedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Return Case Completed (${p.returnId || ''})`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  REFUND_INITIATED: {
    component: ReturnCompletedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Refund Settlement Initiated (${p.returnId || ''})`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  REFUND_COMPLETED: {
    component: ReturnCompletedTemplate,
    subjectBuilder: (p) => `Your GODSMOVE Refund Settlement Completed (${p.returnId || ''})`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  INACTIVE_USER: {
    component: WelcomeTemplate,
    subjectBuilder: () => `Explore the Archival Collection | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  WALLET_CREDITED: {
    component: WalletCreditedTemplate,
    subjectBuilder: (p) => `₹${Number(p.amount || 0).toLocaleString('en-IN')} Privilege Credits Credited ${p.entityId ? `(#${String(p.entityId).slice(-7).toUpperCase()})` : ''}`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  WALLET_DEBITED: {
    component: WalletDebitedTemplate,
    subjectBuilder: (p) => `₹${Number(p.amount || 0).toLocaleString('en-IN')} Vault Credits Applied ${p.orderNumber ? `to Order #${p.orderNumber}` : ''}`.trim(),
    senderConfig: DEFAULT_SENDER,
  },
  PASSWORD_RESET: {
    component: PasswordResetTemplate,
    subjectBuilder: () => `Password Reset Instructions | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  EMAIL_VERIFICATION: {
    component: PasswordResetTemplate,
    subjectBuilder: () => `Verify Your Email Address | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  WELCOME: {
    component: WelcomeTemplate,
    subjectBuilder: () => `Welcome to the GODSMOVE Archival Circle`,
    senderConfig: DEFAULT_SENDER,
  },
  FIRST_TIME_REGISTRATION: {
    component: WelcomeTemplate,
    subjectBuilder: () => `Welcome to the GODSMOVE Archival Circle`,
    senderConfig: DEFAULT_SENDER,
  },
  ACCOUNT_UPDATED: {
    component: WelcomeTemplate,
    subjectBuilder: () => `Account Security & Profile Updated | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  INVOICE_REQUEST: {
    component: InvoiceRequestTemplate,
    subjectBuilder: () => `Your GODSMOVE Tax Invoice`,
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

  // Marketing Campaign Library Maps
  CAMPAIGN_NEWSLETTER: {
    component: NewsletterMarketingTemplate,
    subjectBuilder: (p) => p.subject || p.headline || 'Archival Newsletter Dispatch | GODSMOVE',
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_NEW_DROP: {
    component: NewDropMarketingTemplate,
    subjectBuilder: (p) => p.subject || `New Drop Allocation: ${p.dropTitle || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_COLLECTION_LAUNCH: {
    component: CollectionLaunchMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Collection Launch: ${p.collectionName || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_LIMITED_EDITION: {
    component: LimitedEditionMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Limited Series Release: ${p.editionName || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_COUPON: {
    component: CouponMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Exclusive Privilege Code: ${p.couponCode || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_FLASH_SALE: {
    component: FlashSaleMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Flash Allocation Window: ${p.saleTitle || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_BIRTHDAY: {
    component: BirthdayMarketingTemplate,
    subjectBuilder: () => `Happy Birthday from GODSMOVE Archival Concierge`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_FESTIVAL: {
    component: FestivalMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Festive Season Greetings | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_REFERRAL: {
    component: ReferralMarketingTemplate,
    subjectBuilder: () => `Invite Fellow Collectors to GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_LOYALTY_UPGRADE: {
    component: LoyaltyUpgradeMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Status Elevation: ${p.newTier || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_WISHLIST_REMINDER: {
    component: WishlistReminderMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Low Stock Alert: ${p.productName || 'Saved Piece'} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_ABANDONED_CART: {
    component: AbandonedCartMarketingTemplate,
    subjectBuilder: () => `Your Archival Piece is Reserved in Cart | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_BACK_IN_STOCK: {
    component: BackInStockMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Back in Stock: ${p.productName || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_PRICE_DROP: {
    component: PriceDropMarketingTemplate,
    subjectBuilder: (p) => p.subject || `Price Adjustment Alert: ${p.productName || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_RECOMMENDATION: {
    component: RecommendationMarketingTemplate,
    subjectBuilder: () => `Curated Archival Recommendations for You | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_VIP_EARLY_ACCESS: {
    component: VipEarlyAccessMarketingTemplate,
    subjectBuilder: (p) => p.subject || `VIP Early Access Pass | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_MEMBERSHIP_INVITATION: {
    component: MembershipInvitationMarketingTemplate,
    subjectBuilder: () => `Private Collector Circle Invitation | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
  CAMPAIGN_SEASONAL: {
    component: SeasonalMarketingTemplate,
    subjectBuilder: (p) => p.subject || p.seasonTitle || `Seasonal Editorial Dispatch | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
  },
};

import DynamicHtmlTemplate from './DynamicHtmlTemplate';
import { prisma } from '@/lib/prisma';

export class TemplateResolver {
  static resolve(event: NotificationEvent): EmailTemplateDefinition {
    const definition = TEMPLATE_REGISTRY[event];
    if (!definition) {
      throw new Error(`[TEMPLATE RESOLVER ERROR] No template definition registered for event: ${event}`);
    }
    return definition;
  }

  static async resolveAsync(event: NotificationEvent): Promise<EmailTemplateDefinition> {
    const defaultDef = this.resolve(event);
    try {
      const activeVersion = await prisma.templateVersion.findFirst({
        where: { templateId: event, isActive: true },
        orderBy: { version: 'desc' },
      });

      if (activeVersion && activeVersion.bodyHtml) {
        return {
          component: (props: any) =>
            React.createElement(DynamicHtmlTemplate, {
              htmlContent: activeVersion.bodyHtml!,
              payload: props,
            }),
          subjectBuilder: (p: any) => {
            if (!activeVersion.subject || activeVersion.subject.startsWith('Notification:')) {
              return defaultDef.subjectBuilder(p);
            }
            let sub = activeVersion.subject;
            if (p.orderNumber) sub = sub.replace(/\{\{\s*orderNumber\s*\}\}/gi, p.orderNumber);
            if (p.returnId) sub = sub.replace(/\{\{\s*returnId\s*\}\}/gi, p.returnId);
            return sub;
          },
          senderConfig: defaultDef.senderConfig,
        };
      }
    } catch {
      // Fallback silently to default compiled React Email component
    }

    return defaultDef;
  }
}
