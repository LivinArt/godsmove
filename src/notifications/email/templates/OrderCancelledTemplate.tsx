import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface OrderCancelledTemplateProps {
  customerName: string;
  orderNumber: string;
  reason?: string;
  refundInfo?: string;
  supportUrl?: string;
}

export const OrderCancelledTemplate: React.FC<OrderCancelledTemplateProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'GM-2026-8801',
  reason = 'Customer requested cancellation',
  refundInfo = 'Refund processed to original payment source / wallet balance.',
  supportUrl = 'https://godsmove.in/contact',
}) => {
  const previewText = `Order Cancellation Notice: ${orderNumber}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>ORDER CANCELLED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, order reference{' '}
          <strong style={{ color: '#ffffff' }}>{orderNumber}</strong> has been cancelled.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>CANCELLATION REASON</Text>
        <Text style={valueStyle}>{reason}</Text>

        <Text style={{ ...labelStyle, marginTop: '12px' }}>REFUND & SETTLEMENT</Text>
        <Text style={{ ...valueStyle, color: '#a1a1aa' }}>{refundInfo}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={supportUrl} variant="secondary">
          CONTACT CONCIERGE SUPPORT
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default OrderCancelledTemplate;

const greetingStyle = {
  fontSize: '14px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#ef4444',
  margin: '0 0 12px 0',
};

const bodyStyle = {
  fontSize: '12px',
  color: '#a1a1aa',
  lineHeight: '20px',
  margin: '0',
};

const cardStyle = {
  backgroundColor: '#121215',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '4px',
  padding: '20px',
  marginBottom: '28px',
};

const labelStyle = {
  fontSize: '9px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: '#8c857b',
  margin: '0',
  textTransform: 'uppercase' as const,
};

const valueStyle = {
  fontSize: '12px',
  color: '#ffffff',
  margin: '2px 0 0 0',
};
