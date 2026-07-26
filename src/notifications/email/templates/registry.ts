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
    subjectBuilder: (p) => `Allocation Confirmed: Order ${p.orderNumber || ''} | GODSMOVE`,
    senderConfig: DEFAULT_SENDER,
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

export class TemplateResolver {
  static resolve(event: NotificationEvent): EmailTemplateDefinition {
    const definition = TEMPLATE_REGISTRY[event];
    if (!definition) {
      throw new Error(`[TEMPLATE RESOLVER ERROR] No template definition registered for event: ${event}`);
    }
    return definition;
  }
}
