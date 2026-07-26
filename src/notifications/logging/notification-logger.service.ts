import { NotificationLogEntry } from '../types/notification.types';

/**
 * Serverless-compatible Notification Logger Service
 *
 * Logs structured entries for auditability across Email, WhatsApp, and Push channels.
 * Stateless design compatible with Vercel Serverless Lambdas.
 */
export class NotificationLogger {
  static async log(entry: NotificationLogEntry): Promise<void> {
    const formattedLog = {
      timestamp: entry.timestamp.toISOString(),
      event: entry.event,
      channel: entry.channel,
      recipient: entry.recipient,
      provider: entry.provider,
      providerMessageId: entry.providerMessageId || 'N/A',
      status: entry.status,
      error: entry.error || null,
    };

    if (entry.status === 'FAILED') {
      console.error('❌ [NOTIFICATION AUDIT LOG - FAILURE]', JSON.stringify(formattedLog, null, 2));
    } else {
      console.log('✅ [NOTIFICATION AUDIT LOG - SUCCESS]', JSON.stringify(formattedLog, null, 2));
    }
  }
}
