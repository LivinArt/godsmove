import React from 'react';
import { sendEmail, SendEmailResponse } from './resend.service';
import { NotificationEvent, NotificationRecipient } from '../../types/notification.types';
import { TemplateResolver } from '../templates/registry';
import { NotificationLogger } from '../../logging/notification-logger.service';

export class EmailService {
  /**
   * Template-Driven Email Dispatcher
   */
  static async sendNotification(
    event: NotificationEvent,
    recipient: NotificationRecipient,
    payload: Record<string, any>
  ): Promise<SendEmailResponse> {
    const startTime = new Date();
    const entityId = payload.orderId || payload.orderNumber || payload.returnId || payload.id || 'GENERIC';
    const templateVersion = payload.templateVersion || 1;
    const idempotencyKey = `${event}_${entityId}_${recipient.email}_v${templateVersion}`;

    // Priority 6: Idempotency protection check
    const isDuplicate = await NotificationLogger.checkIdempotent(idempotencyKey);
    if (isDuplicate && !payload.forceResend) {
      console.log(`ℹ️ [IDEMPOTENCY PROTECTION] Skipping duplicate dispatch for key: ${idempotencyKey}`);
      return {
        success: true,
        id: `idempotent_skipped_${idempotencyKey}`,
      };
    }

    const attachments = payload.attachments || [];
    const attachmentNames = attachments.map((a: any) => a.filename || 'attachment.pdf');

    try {
      // 1. Resolve active template definition from registry
      const definition = await TemplateResolver.resolveAsync(event);
      const subject = definition.subjectBuilder(payload);
      const reactElement = React.createElement(definition.component, payload);

      // 2. Dispatch via Resend API with configured sender identity & attachments
      const result = await sendEmail({
        to: recipient.email,
        subject,
        react: reactElement,
        from: definition.senderConfig.from,
        replyTo: definition.senderConfig.replyTo,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // 3. Write complete Delivery Log Record to database
      await NotificationLogger.log({
        event,
        channel: 'EMAIL',
        recipient: recipient.email,
        profileId: recipient.userId,
        provider: 'RESEND',
        providerMessageId: result.id,
        status: result.success ? 'SUCCESS' : 'FAILED',
        timestamp: startTime,
        error: result.error,
        idempotencyKey,
        subject,
        payloadJson: JSON.stringify({ event, recipient: recipient.email, entityId }),
        attachmentNames,
        templateId: event,
        retryCount: payload.retryCount || 0,
      });

      return result;
    } catch (err: any) {
      console.error(`❌ [EMAIL SERVICE ERROR] Failed to process notification for event ${event}:`, err);
      
      await NotificationLogger.log({
        event,
        channel: 'EMAIL',
        recipient: recipient.email,
        profileId: recipient.userId,
        provider: 'RESEND',
        status: 'FAILED',
        timestamp: startTime,
        error: err?.message || 'Uncaught template resolution or send error',
        idempotencyKey,
        attachmentNames,
        templateId: event,
        retryCount: payload.retryCount || 0,
      });

      return {
        success: false,
        error: err?.message || 'Email dispatch failed',
      };
    }
  }

  // ── CONVENIENCE DISPATCH WRAPPERS ──────────────────────────────────────────

  static async sendOrderConfirmation(to: string, data: any): Promise<SendEmailResponse> {
    return this.sendNotification('ORDER_CREATED', { email: to, name: data.customerName }, data);
  }

  static async sendInvoice(to: string, data: any): Promise<SendEmailResponse> {
    return this.sendNotification('INVOICE_REQUEST', { email: to, name: data.customerName }, data);
  }

  static async sendWalletCredit(to: string, data: any): Promise<SendEmailResponse> {
    return this.sendNotification('WALLET_CREDITED', { email: to, name: data.customerName }, data);
  }

  static async sendReturnUpdate(to: string, data: any): Promise<SendEmailResponse> {
    return this.sendNotification('RETURN_REQUESTED', { email: to, name: data.customerName }, data);
  }

  static async sendOrderShipped(to: string, data: any): Promise<SendEmailResponse> {
    return this.sendNotification('ORDER_SHIPPED', { email: to, name: data.customerName }, data);
  }

  static async sendOrderDelivered(to: string, data: any): Promise<SendEmailResponse> {
    return this.sendNotification('ORDER_DELIVERED', { email: to, name: data.customerName }, data);
  }
}
