export type NotificationEvent =
  | 'ORDER_CREATED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'RETURN_COMPLETED'
  | 'WALLET_CREDITED'
  | 'WALLET_DEBITED'
  | 'PASSWORD_RESET'
  | 'WELCOME'
  | 'NEWSLETTER'
  | 'NEW_DROP'
  | 'COUPON'
  | 'CAMPAIGN_NEWSLETTER'
  | 'CAMPAIGN_NEW_DROP'
  | 'CAMPAIGN_COLLECTION_LAUNCH'
  | 'CAMPAIGN_LIMITED_EDITION'
  | 'CAMPAIGN_COUPON'
  | 'CAMPAIGN_FLASH_SALE'
  | 'CAMPAIGN_BIRTHDAY'
  | 'CAMPAIGN_FESTIVAL'
  | 'CAMPAIGN_REFERRAL'
  | 'CAMPAIGN_LOYALTY_UPGRADE'
  | 'CAMPAIGN_WISHLIST_REMINDER'
  | 'CAMPAIGN_ABANDONED_CART'
  | 'CAMPAIGN_BACK_IN_STOCK'
  | 'CAMPAIGN_PRICE_DROP'
  | 'CAMPAIGN_RECOMMENDATION'
  | 'CAMPAIGN_VIP_EARLY_ACCESS'
  | 'CAMPAIGN_MEMBERSHIP_INVITATION'
  | 'CAMPAIGN_SEASONAL';

export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'PUSH';

export interface NotificationRecipient {
  email: string;
  phone?: string;
  name?: string;
  userId?: string;
}

export interface NotificationDispatchPayload {
  event: NotificationEvent;
  recipient: NotificationRecipient;
  payload: Record<string, any>;
  channels?: NotificationChannel[];
}

export interface NotificationLogEntry {
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string;
  provider: string;
  providerMessageId?: string;
  status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  timestamp: Date;
  error?: string;
}

export interface EmailSenderConfig {
  from: string;
  replyTo: string;
}
