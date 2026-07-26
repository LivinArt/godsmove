import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface BackInStockMarketingTemplateProps {
  productName?: string;
  size?: string;
  productUrl?: string;
}

export const BackInStockMarketingTemplate: React.FC<BackInStockMarketingTemplateProps> = ({
  productName = 'ECHO HEAVYWEIGHT TEE',
  size = 'L',
  productUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={`Back in Stock: ${productName}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>RESTOCK NOTIFICATION</Text>
        <Text style={headlineStyle}>BACK IN STOCK: {productName}</Text>
        <Text style={bodyStyle}>
          The requested size <strong style={{ color: '#ffffff' }}>{size}</strong> for {productName} is back in our warehouse allocation.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={productUrl} variant="gold">
          SECURE YOUR PIECE NOW
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default BackInStockMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#22c55e', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
