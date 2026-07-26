import React from 'react';
import { sendEmail, SendEmailResponse } from './resend.service';
import { OrderConfirmationEmail, OrderConfirmationEmailProps } from '../templates/OrderConfirmation';
import { InvoiceEmail, InvoiceEmailProps } from '../templates/Invoice';
import { WalletCreditEmail, WalletCreditEmailProps } from '../templates/WalletCredit';
import { ReturnUpdateEmail, ReturnUpdateEmailProps } from '../templates/ReturnUpdate';
import { OrderShippedEmail, OrderShippedEmailProps } from '../templates/OrderShipped';
import { OrderDeliveredEmail, OrderDeliveredEmailProps } from '../templates/OrderDelivered';

export class EmailService {
  /**
   * Send Order Confirmation Email
   */
  static async sendOrderConfirmation(
    to: string,
    data: OrderConfirmationEmailProps
  ): Promise<SendEmailResponse> {
    const subject = `Allocation Confirmed: Order ${data.orderNumber} | GODSMOVE`;
    return sendEmail({
      to,
      subject,
      react: React.createElement(OrderConfirmationEmail, data),
    });
  }

  /**
   * Send Official Tax Invoice Email
   */
  static async sendInvoice(
    to: string,
    data: InvoiceEmailProps
  ): Promise<SendEmailResponse> {
    const subject = `Tax Invoice ${data.invoiceNumber} | GODSMOVE`;
    return sendEmail({
      to,
      subject,
      react: React.createElement(InvoiceEmail, data),
    });
  }

  /**
   * Send Wallet Privilege Credit Email
   */
  static async sendWalletCredit(
    to: string,
    data: WalletCreditEmailProps
  ): Promise<SendEmailResponse> {
    const subject = `₹${data.amount.toLocaleString('en-IN')} GODSMOVE Privilege Credits Added`;
    return sendEmail({
      to,
      subject,
      react: React.createElement(WalletCreditEmail, data),
    });
  }

  /**
   * Send Return Status Update Email
   */
  static async sendReturnUpdate(
    to: string,
    data: ReturnUpdateEmailProps
  ): Promise<SendEmailResponse> {
    const subject = `Return Update ${data.returnId}: ${data.status} | GODSMOVE`;
    return sendEmail({
      to,
      subject,
      react: React.createElement(ReturnUpdateEmail, data),
    });
  }

  /**
   * Send Order Shipped / Dispatch Email
   */
  static async sendOrderShipped(
    to: string,
    data: OrderShippedEmailProps
  ): Promise<SendEmailResponse> {
    const subject = `Allocation Dispatched: Order ${data.orderNumber} | GODSMOVE`;
    return sendEmail({
      to,
      subject,
      react: React.createElement(OrderShippedEmail, data),
    });
  }

  /**
   * Send Order Delivered Email
   */
  static async sendOrderDelivered(
    to: string,
    data: OrderDeliveredEmailProps
  ): Promise<SendEmailResponse> {
    const subject = `Allocation Delivered: Order ${data.orderNumber} | GODSMOVE`;
    return sendEmail({
      to,
      subject,
      react: React.createElement(OrderDeliveredEmail, data),
    });
  }
}
