import React from 'react';
import { sendEmail, SendEmailResponse } from './resend.service';
import { NotificationEvent, NotificationRecipient } from '../../types/notification.types';
import { TemplateResolver } from '../templates/registry';
import { NotificationLogger } from '../../logging/notification-logger.service';

export class EmailService {
  /**
   * Template-Driven Email Dispatcher
   *
   * Automatically resolves the template, subject line, and sender identity from the
   * central Template Registry based on the event type.
   * Business logic NEVER imports individual templates directly.
   */
  static async sendNotification(
    event: NotificationEvent,
    recipient: NotificationRecipient,
    payload: Record<string, any>
  ): Promise<SendEmailResponse> {
    const startTime = new Date();

    try {
      // 1. Resolve active template definition from registry (supporting custom DB HTML overrides)
      const definition = await TemplateResolver.resolveAsync(event);
      const subject = definition.subjectBuilder(payload);
      const reactElement = React.createElement(definition.component, payload);

      // 2. Extract attachments if present in payload
      const attachments = payload.attachments || [];

      // 3. Dispatch via Resend API with configured sender identity & attachments
      const result = await sendEmail({
        to: recipient.email,
        subject,
        react: reactElement,
        from: definition.senderConfig.from,
        replyTo: definition.senderConfig.replyTo,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // 3. Log persistent audit entry
      await NotificationLogger.log({
        event,
        channel: 'EMAIL',
        recipient: recipient.email,
        provider: 'RESEND',
        providerMessageId: result.id,
        status: result.success ? 'SUCCESS' : 'FAILED',
        timestamp: startTime,
        error: result.error,
      });

      return result;
    } catch (err: any) {
      console.error(`❌ [EMAIL SERVICE ERROR] Failed to process notification for event ${event}:`, err);
      
      await NotificationLogger.log({
        event,
        channel: 'EMAIL',
        recipient: recipient.email,
        provider: 'RESEND',
        status: 'FAILED',
        timestamp: startTime,
        error: err?.message || 'Uncaught template resolution or send error',
      });

      return {
        success: false,
        error: err?.message || 'Email dispatch failed',
      };
    }
  }

  // ── BACKWARD COMPATIBILITY CONVENIENCE WRAPPERS ─────────────────────────────

  static async sendOrderConfirmation(to: string, data: any): Promise<SendEmailResponse> {
    return this.sendNotification('ORDER_CREATED', { email: to, name: data.customerName }, data);
  }

  static async sendInvoice(to: string, data: any): Promise<SendEmailResponse> {
    return this.sendNotification('ORDER_CREATED', { email: to, name: data.customerName }, data);
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
