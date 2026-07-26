import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface AbandonedCartMarketingTemplateProps {
  customerName?: string;
  cartItemName?: string;
  cartTotal?: number;
  checkoutUrl?: string;
}

export const AbandonedCartMarketingTemplate: React.FC<AbandonedCartMarketingTemplateProps> = ({
  customerName = 'Valued Collector',
  cartItemName = 'NOISE TEE (IVORY, SIZE L)',
  cartTotal = 2999,
  checkoutUrl = 'https://godsmove.in/cart',
}) => {
  return (
    <LuxuryEmailLayout previewText="Your Archival Piece is Reserved in Cart">
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>RESERVED SELECTION</Text>
        <Text style={headlineStyle}>COMPLETE YOUR ALLOCATION</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, you left <strong style={{ color: '#ffffff' }}>{cartItemName}</strong> in your shopping session. Your allocation is reserved for a short period.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={itemLabel}>RESERVED PIECE</Text>
        <Text style={itemTitle}>{cartItemName}</Text>
        <Text style={priceStyle}>₹{cartTotal.toLocaleString('en-IN')}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={checkoutUrl} variant="gold">
          RETURN TO CHECKOUT
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default AbandonedCartMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 16px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', textAlign: 'center' as const };
const itemLabel = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0 0 4px 0' };
const itemTitle = { fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' };
const priceStyle = { fontSize: '15px', fontWeight: 800, color: '#c8a46a', margin: '0' };
