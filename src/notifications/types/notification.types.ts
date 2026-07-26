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
  | 'COUPON';

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
