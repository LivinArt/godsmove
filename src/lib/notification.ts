import fs from 'fs';
import path from 'path';

// Helper to write simulated emails locally for UAT inspection
function saveSimulatedEmail(to: string, subject: string, htmlContent: string) {
  try {
    const artifactDir = process.env.CONVERSATION_ID 
      ? path.join('C:\\Users\\hp\\.gemini\\antigravity-ide\\brain', process.env.CONVERSATION_ID) 
      : 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\3fbd69ae-198e-46d9-94aa-7283285b81d9';
    const emailLogsDir = path.join(artifactDir, 'logs', 'emails');
    fs.mkdirSync(emailLogsDir, { recursive: true });

    const safeFilename = `${Date.now()}_${subject.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    const fullPath = path.join(emailLogsDir, safeFilename);

    const logEntry = `To: ${to}\nSubject: ${subject}\nDate: ${new Date().toISOString()}\n\n${htmlContent}`;
    fs.writeFileSync(fullPath, logEntry, 'utf8');
    console.log(`[EMAIL NOTIFICATION] Luxury email logged successfully: ${fullPath}`);
  } catch (err) {
    console.error('Failed to log simulated email:', err);
  }
}

// Apple-level luxury minimalist responsive template builder
function buildLuxuryEmailTemplate(title: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #000000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            letter-spacing: -0.01em;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            padding: 48px 24px;
          }
          .header {
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 24px;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin: 0;
            display: inline-block;
          }
          .content {
            margin-bottom: 40px;
          }
          h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 16px 0;
            letter-spacing: -0.015em;
          }
          p {
            margin: 0 0 16px 0;
            color: #4a4a4a;
          }
          .btn {
            display: inline-block;
            background-color: #000000;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 12px;
          }
          .footer {
            border-top: 1px solid #e5e5e5;
            padding-top: 24px;
            font-size: 11px;
            color: #86868b;
            text-align: center;
          }
          .footer-logo {
            font-weight: 600;
            color: #000000;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .timeline-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
            font-family: monospace;
          }
          .timeline-table th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding-bottom: 6px;
            text-transform: uppercase;
          }
          .timeline-table td {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">GODSMOVE</div>
          </div>
          <div class="content">
            ${bodyHtml}
          </div>
          <div class="footer">
            <div class="footer-logo">GODSMOVE</div>
            <p>You are receiving this communication regarding your digital purchase account.<br>&copy; ${new Date().getFullYear()} GODSMOVE. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

import { prisma } from './prisma';

async function getCustomerFirstName(email: string): Promise<string> {
  try {
    const profile = await prisma.profile.findFirst({
      where: { email },
    });
    return profile?.firstName || 'Customer';
  } catch (err) {
    console.error('Failed to resolve customer name for email:', err);
    return 'Customer';
  }
}

export const NotificationService = {
  // 1. Purchase Successful & Invoice
  async sendOrderConfirmation(to: string, orderNumber: string, itemsListHtml: string, total: string) {
    const customerName = await getCustomerFirstName(to);
    const title = `Order Confirmation #${orderNumber}`;
    const bodyHtml = `
      <p>Hello ${customerName},</p>
      <p>Your order has entered our preparation process.</p>
      
      <table class="timeline-table">
        <thead>
          <tr>
            <th>Item Details</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
          <tr>
            <td><strong>Grand Total</strong></td>
            <td style="text-align: right;"><strong>${total}</strong></td>
          </tr>
        </tbody>
      </table>
      
      <p style="margin-top: 24px;">Our logistics team is preparing your allocation.</p>
      <a href="http://localhost:3000/profile?tab=orders" class="btn">View Order Details</a>
    `;
    const html = buildLuxuryEmailTemplate(title, bodyHtml);
    saveSimulatedEmail(to, title, html);
  },

  // 2. Shipment Created
  async sendShipmentCreated(to: string, orderNumber: string, carrier: string, trackingNumber: string, trackingUrl: string, estimatedDelivery: string) {
    const customerName = await getCustomerFirstName(to);
    const title = `Shipment Created for Order #${orderNumber}`;
    const bodyHtml = `
      <p>Hello ${customerName},</p>
      <p>Your order is now on its way.</p>
      <p>Carrier: <strong>${carrier}</strong></p>
      <p>Tracking Number: <strong>${trackingNumber}</strong></p>
      <p>Estimated Delivery: <strong>${estimatedDelivery}</strong></p>
      
      <a href="${trackingUrl}" class="btn">Track Package</a>
    `;
    const html = buildLuxuryEmailTemplate(title, bodyHtml);
    saveSimulatedEmail(to, title, html);
  },

  // 3. Shipment Status Events (Picked Up, Out for Delivery, Delivered)
  async sendShipmentStatusUpdate(to: string, orderNumber: string, trackingNumber: string, status: string, location: string, description: string) {
    const customerName = await getCustomerFirstName(to);
    const isDelivered = status === 'DELIVERED' || description.toLowerCase().includes('delivered');
    const title = isDelivered ? `Your GODSMOVE piece has arrived` : `Shipment Event: ${status} for Order #${orderNumber}`;
    const bodyHtml = isDelivered ? `
      <p>Hello ${customerName},</p>
      <p>Your GODSMOVE piece has arrived.</p>
      <a href="http://localhost:3000/profile?tab=orders" class="btn">View Order Details</a>
    ` : `
      <p>Hello ${customerName},</p>
      <p>Your package status (AWB: <strong>${trackingNumber}</strong>) has changed to: <strong>${status}</strong></p>
      <p>Location: <strong>${location}</strong></p>
      <p>Details: <strong>${description}</strong></p>
      
      <a href="http://localhost:3000/profile?tab=orders" class="btn">Track in Dashboard</a>
    `;
    const html = buildLuxuryEmailTemplate(title, bodyHtml);
    saveSimulatedEmail(to, title, html);
  },

  // 4. Return Requested
  async sendReturnRequested(to: string, returnId: string, orderNumber: string) {
    const customerName = await getCustomerFirstName(to);
    const title = `Return Request Received - #${orderNumber}`;
    const bodyHtml = `
      <p>Hello ${customerName},</p>
      <p>We've received your return request for Order <strong>#${orderNumber}</strong>.</p>
      <p>You can follow the approval and pickup milestones in your profile returns portal.</p>
      
      <a href="http://localhost:3000/profile?tab=returns" class="btn">View Return Milestones</a>
    `;
    const html = buildLuxuryEmailTemplate(title, bodyHtml);
    saveSimulatedEmail(to, title, html);
  },

  // 5. Return Approved & Pickup Scheduled
  async sendReturnApproved(to: string, returnId: string, carrier: string, trackingNumber: string) {
    const customerName = await getCustomerFirstName(to);
    const title = `Return Request Approved - #${returnId}`;
    const bodyHtml = `
      <p>Hello ${customerName},</p>
      <p>Your return request (ID: <strong>${returnId}</strong>) has been approved by the GODSMOVE team.</p>
      <p>We have scheduled a reverse pickup with <strong>${carrier}</strong>.</p>
      <p>AWB Tracking Number: <strong>${trackingNumber}</strong></p>
      <p>Please keep the item folded in its original premium packaging sleeve ready for hand-off to the logistics agent.</p>
      
      <a href="http://localhost:3000/profile?tab=returns" class="btn">Track Return status</a>
    `;
    const html = buildLuxuryEmailTemplate(title, bodyHtml);
    saveSimulatedEmail(to, title, html);
  },

  // 6. Return Received at Warehouse
  async sendReturnReceived(to: string, returnId: string) {
    const customerName = await getCustomerFirstName(to);
    const title = `Return Received at Studio - #${returnId}`;
    const bodyHtml = `
      <p>Hello ${customerName},</p>
      <p>Your returned package (ID: <strong>${returnId}</strong>) has arrived at our preparation studio.</p>
      <p>Our quality team is conducting the verification inspection. Updates will follow shortly.</p>
    `;
    const html = buildLuxuryEmailTemplate(title, bodyHtml);
    saveSimulatedEmail(to, title, html);
  },

  // 7. Wallet Refunded
  async sendReturnRefunded(to: string, returnId: string, amount: string, deductionHtml: string) {
    const customerName = await getCustomerFirstName(to);
    const title = `Return Completed - #${returnId}`;
    const bodyHtml = `
      <p>Hello ${customerName},</p>
      <p>We've completed your return. Credits have been added to your account.</p>
      <p>Refunded Amount: <strong>${amount}</strong></p>
      
      <table class="timeline-table">
        <thead>
          <tr>
            <th>Deduction Parameter</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${deductionHtml}
        </tbody>
      </table>
      
      <p style="margin-top: 24px;">These credits are ready to use instantly at checkout on any future purchase.</p>
      <a href="http://localhost:3000/profile?tab=wallet" class="btn">View Ledger Wallet</a>
    `;
    const html = buildLuxuryEmailTemplate(title, bodyHtml);
    saveSimulatedEmail(to, title, html);
  },

  // 8. Custom Campaign Email Dispatcher
  async sendCustomEmail(to: string, subject: string, message: string) {
    const customerName = await getCustomerFirstName(to);
    const title = subject;
    const bodyHtml = `
      <p>Hello ${customerName},</p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;
    const html = buildLuxuryEmailTemplate(title, bodyHtml);
    saveSimulatedEmail(to, title, html);
  },
};
