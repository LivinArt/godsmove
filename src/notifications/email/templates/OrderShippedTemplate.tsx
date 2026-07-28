import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface OrderShippedTemplateProps {
  customerName: string;
  orderNumber: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export const OrderShippedTemplate: React.FC<OrderShippedTemplateProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'GM-2026-8801',
  courierName = 'Blue Dart Express Archival Priority',
  trackingNumber = 'BD778899001',
  trackingUrl = 'https://godsmove.in/profile?tab=collection',
  estimatedDelivery = '3 Business Days',
}) => {
  const previewText = `Allocation Dispatched: Order ${orderNumber}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>ALLOCATION DISPATCHED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, your allocation piece{' '}
          <strong style={{ color: '#ffffff' }}>{orderNumber}</strong> has passed technical inspection and is now in transit via our express logistics partner.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>COURIER / CARRIER</Text>
        <Text style={valueStyle}>{courierName}</Text>

        <Text style={{ ...labelStyle, marginTop: '12px' }}>TRACKING NUMBER</Text>
        <Text style={highlightStyle}>{trackingNumber}</Text>

        <Text style={{ ...labelStyle, marginTop: '12px' }}>ESTIMATED ARRIVAL</Text>
        <Text style={valueStyle}>{estimatedDelivery}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={trackingUrl} variant="gold">
          TRACK SHIPMENT
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default OrderShippedTemplate;

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

const highlightStyle = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#c8a46a',
  letterSpacing: '0.08em',
  margin: '2px 0 0 0',
};
