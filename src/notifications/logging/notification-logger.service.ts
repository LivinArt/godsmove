import { NotificationLogEntry } from '../types/notification.types';
import { prisma } from '@/lib/prisma';

export interface ExtendedNotificationLogEntry extends NotificationLogEntry {
  idempotencyKey?: string;
  subject?: string;
  payloadJson?: string;
  attachmentNames?: string[];
  retryCount?: number;
  templateId?: string;
  profileId?: string;
}

export class NotificationLogger {
  /**
   * Check if an idempotent delivery record already exists and succeeded.
   */
  static async checkIdempotent(idempotencyKey: string): Promise<boolean> {
    if (!idempotencyKey) return false;
    try {
      const existing = await prisma.notificationHistory.findUnique({
        where: { idempotencyKey },
      });
      return existing?.status === 'SENT' || existing?.status === 'DELIVERED';
    } catch {
      return false;
    }
  }

  /**
   * Write delivery log record to database with full pipeline details.
   */
  static async log(entry: ExtendedNotificationLogEntry): Promise<any> {
    const isSuccess = entry.status === 'SUCCESS';

    const pipelineLog = `
====================================================================
BUSINESS EVENT: ${entry.event}
↓
Dispatch Target: ${entry.recipient} (${entry.channel})
↓
Template Resolver: ${entry.templateId || entry.event}
↓
Attachments: ${entry.attachmentNames && entry.attachmentNames.length > 0 ? entry.attachmentNames.join(', ') : 'None'}
↓
Provider: ${entry.provider} | Provider Message ID: ${entry.providerMessageId || 'N/A'}
↓
Delivery Log Status: ${isSuccess ? 'SENT' : 'FAILED'} ${entry.error ? `(Error: ${entry.error})` : ''}
↓
COMPLETED AT ${entry.timestamp.toISOString()}
====================================================================
    `.trim();

    if (isSuccess) {
      console.log(`✅ [DELIVERY LOG SUCCESS]\n${pipelineLog}`);
    } else {
      console.error(`❌ [DELIVERY LOG FAILURE]\n${pipelineLog}`);
    }

    try {
      const record = await prisma.notificationHistory.create({
        data: {
          idempotencyKey: entry.idempotencyKey || null,
          profileId: entry.profileId || null,
          email: entry.recipient,
          channel: entry.channel || 'EMAIL',
          eventType: entry.event,
          templateId: entry.templateId || entry.event,
          provider: entry.provider || 'RESEND',
          providerMessageId: entry.providerMessageId || null,
          status: isSuccess ? 'SENT' : 'FAILED',
          subject: entry.subject || null,
          payloadJson: entry.payloadJson || null,
          attachmentNames: entry.attachmentNames || [],
          retryCount: entry.retryCount || 0,
          error: entry.error || null,
          sentAt: isSuccess ? entry.timestamp : null,
          failedAt: !isSuccess ? entry.timestamp : null,
        },
      });
      return record;
    } catch (dbErr: any) {
      console.error('⚠️ [DELIVERY LOG DB PERSIST WARNING]:', dbErr?.message);
      return null;
    }
  }
}
