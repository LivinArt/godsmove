import { NotificationLogEntry } from '../types/notification.types';
import { prisma } from '@/lib/prisma';

/**
 * Serverless-compatible Notification Logger Service
 *
 * Logs structured entries for auditability across Email, WhatsApp, and Push channels
 * and persists audit logs directly into the PostgreSQL NotificationHistory database table.
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

    try {
      await prisma.notificationHistory.create({
        data: {
          email: entry.recipient,
          channel: entry.channel,
          eventType: entry.event,
          provider: entry.provider,
          providerMessageId: entry.providerMessageId,
          status: entry.status === 'SUCCESS' ? 'SENT' : 'FAILED',
          error: entry.error,
        },
      });
    } catch (dbErr: any) {
      console.error('⚠️ [NOTIFICATION LOGGER DB PERSIST WARNING]:', dbErr?.message);
    }
  }
}
