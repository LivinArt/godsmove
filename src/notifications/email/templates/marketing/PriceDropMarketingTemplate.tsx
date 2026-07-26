import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface PriceDropMarketingTemplateProps {
  productName?: string;
  originalPrice?: number;
  newPrice?: number;
  productUrl?: string;
}

export const PriceDropMarketingTemplate: React.FC<PriceDropMarketingTemplateProps> = ({
  productName = 'NOISE TEE (IVORY)',
  originalPrice = 3999,
  newPrice = 2999,
  productUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={`Price Adjustment: ${productName}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>PRICE ADJUSTMENT</Text>
        <Text style={headlineStyle}>{productName}</Text>
        <Text style={bodyStyle}>A price adjustment has been applied to a piece in your watched list.</Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={oldPriceStyle}>WAS ₹{originalPrice.toLocaleString('en-IN')}</Text>
        <Text style={newPriceStyle}>NOW ₹{newPrice.toLocaleString('en-IN')}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={productUrl} variant="gold">
          SHOP UPDATED ALLOCATION
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default PriceDropMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 8px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 16px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', textAlign: 'center' as const };
const oldPriceStyle = { fontSize: '13px', color: '#71717a', textDecoration: 'line-through', margin: '0 0 4px 0' };
const newPriceStyle = { fontSize: '22px', fontWeight: 800, color: '#22c55e', margin: '0' };
