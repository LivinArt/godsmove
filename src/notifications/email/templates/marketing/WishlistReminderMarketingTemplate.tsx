import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface WishlistReminderMarketingTemplateProps {
  productName?: string;
  stockRemaining?: number;
  wishlistUrl?: string;
}

export const WishlistReminderMarketingTemplate: React.FC<WishlistReminderMarketingTemplateProps> = ({
  productName = 'NOISE TEE (IVORY)',
  stockRemaining = 4,
  wishlistUrl = 'https://godsmove.in/wishlist',
}) => {
  return (
    <LuxuryEmailLayout previewText={`Low Stock Alert: ${productName}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>SAVED PIECE ALERT</Text>
        <Text style={headlineStyle}>YOUR SAVED PIECE IS ALMOST SOLD OUT</Text>
        <Text style={bodyStyle}>
          <strong style={{ color: '#ffffff' }}>{productName}</strong> in your wishlist is running critically low. Only {stockRemaining} units remain in allocation.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={wishlistUrl} variant="gold">
          SECURE YOUR ALLOCATION
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default WishlistReminderMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#ef4444', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
