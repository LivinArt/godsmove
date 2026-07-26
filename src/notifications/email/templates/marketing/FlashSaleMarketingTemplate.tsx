import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface FlashSaleMarketingTemplateProps {
  saleTitle?: string;
  discountPercentage?: string;
  durationHours?: number;
  shopUrl?: string;
}

export const FlashSaleMarketingTemplate: React.FC<FlashSaleMarketingTemplateProps> = ({
  saleTitle = '24-HOUR FLASH ALLOCATION',
  discountPercentage = 'UP TO 40% OFF',
  durationHours = 24,
  shopUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={`Flash Allocation Window: ${saleTitle}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>FLASH ALLOCATION</Text>
        <Text style={headlineStyle}>{saleTitle}</Text>
        <Text style={discountStyle}>{discountPercentage}</Text>
        <Text style={timerStyle}>WINDOW CLOSES IN {durationHours} HOURS</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={shopUrl} variant="gold">
          SHOP FLASH ALLOCATION
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default FlashSaleMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#ef4444', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 8px 0' };
const discountStyle = { fontSize: '26px', fontWeight: 800, color: '#c8a46a', margin: '0 0 8px 0' };
const timerStyle = { fontSize: '11px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.1em', margin: '0' };
