import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface InvoiceRequestTemplateProps {
  customerName?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  orderDate?: string;
  total?: number;
  viewInvoiceUrl?: string;
  downloadInvoiceUrl?: string;
}

export const InvoiceRequestTemplate: React.FC<InvoiceRequestTemplateProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'GM-2026-8801',
  invoiceNumber = 'INV-GM-2026-8801',
  orderDate = '27 July 2026',
  total = 0,
  viewInvoiceUrl = 'https://godsmove.in/api/invoice/view/123',
  downloadInvoiceUrl = 'https://godsmove.in/api/invoice/download/123',
}) => {
  const previewText = `Your Requested GODSMOVE Tax Invoice — ${orderNumber}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>DEAR {customerName.toUpperCase()},</Text>
        <Text style={bodyStyle}>
          As requested, your official GODSMOVE Tax Invoice for Order <strong>#{orderNumber}</strong> has been generated and attached to this dispatch.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={cardTitleStyle}>INVOICE SUMMARY</Text>
        <Text style={detailRowStyle}>
          <strong>Invoice Number:</strong> {invoiceNumber}
        </Text>
        <Text style={detailRowStyle}>
          <strong>Order Number:</strong> #{orderNumber}
        </Text>
        <Text style={detailRowStyle}>
          <strong>Issue Date:</strong> {orderDate}
        </Text>
        {total > 0 && (
          <Text style={detailRowStyle}>
            <strong>Total Amount:</strong> ₹{total.toLocaleString('en-IN')}
          </Text>
        )}
      </Section>

      <Section style={{ margin: '32px 0 16px 0', textAlign: 'center' }}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ textAlign: 'center', paddingBottom: '12px' }}>
              <CTAButton href={viewInvoiceUrl} variant="gold">
                VIEW TAX INVOICE
              </CTAButton>
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>
              <CTAButton href={downloadInvoiceUrl} variant="secondary">
                DOWNLOAD INVOICE PDF
              </CTAButton>
            </td>
          </tr>
        </table>
      </Section>

      <Section style={{ marginTop: '24px', textAlign: 'center' }}>
        <Text style={{ fontSize: '11px', color: '#71717a', lineHeight: '16px' }}>
          The PDF document is also attached directly to this email for your permanent archival records.
        </Text>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default InvoiceRequestTemplate;

const greetingStyle = {
  fontSize: '14px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#ffffff',
  margin: '0 0 12px 0',
};

const bodyStyle = {
  fontSize: '12px',
  color: '#a1a1aa',
  lineHeight: '20px',
  margin: '0',
};

const cardStyle = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '4px',
  padding: '20px',
  margin: '20px 0',
};

const cardTitleStyle = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  color: '#c8a46a',
  margin: '0 0 12px 0',
};

const detailRowStyle = {
  fontSize: '12px',
  color: '#e4e4e7',
  margin: '0 0 6px 0',
};
