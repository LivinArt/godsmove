import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface OrderDeliveredEmailProps {
  customerName: string;
  orderNumber: string;
  deliveredAt: string;
  reviewUrl?: string;
  careGuideUrl?: string;
}

export const OrderDeliveredEmail: React.FC<OrderDeliveredEmailProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'GM-2026-8801',
  deliveredAt = '26 July 2026, 04:30 PM',
  reviewUrl = 'https://godsmove.in/profile',
  careGuideUrl = 'https://godsmove.in/policies',
}) => {
  const previewText = `Delivered: Your GODSMOVE Allocation ${orderNumber}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>ALLOCATION DELIVERED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, your allocation package{' '}
          <strong style={{ color: '#ffffff' }}>{orderNumber}</strong> has been successfully delivered to your specified destination.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>DELIVERY TIME</Text>
        <Text style={valueStyle}>{deliveredAt}</Text>

        <Text style={{ ...labelStyle, marginTop: '12px' }}>GARMENT CARE ADVISORY</Text>
        <Text style={{ ...valueStyle, fontSize: '11px', color: '#a1a1aa', lineHeight: '18px' }}>
          Please inspect your garment upon opening. Wash inside out in cold water to preserve high-density stitch integrity and vintage fabric wash.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={reviewUrl} variant="gold">
          SHARE COLLECTOR FEEDBACK
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default OrderDeliveredEmail;

const greetingStyle = {
  fontSize: '14px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#c8a46a',
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
