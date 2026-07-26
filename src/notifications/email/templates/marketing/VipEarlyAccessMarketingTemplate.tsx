import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface VipEarlyAccessMarketingTemplateProps {
  customerName?: string;
  dropName?: string;
  earlyAccessHours?: number;
  accessUrl?: string;
}

export const VipEarlyAccessMarketingTemplate: React.FC<VipEarlyAccessMarketingTemplateProps> = ({
  customerName = 'Valued Collector',
  dropName = 'ARCHIVAL DROP 06 — LIMITED SERIES',
  earlyAccessHours = 24,
  accessUrl = 'https://godsmove.in/exclusive-rack',
}) => {
  return (
    <LuxuryEmailLayout previewText={`VIP Early Access: ${dropName}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>VIP EARLY ACCESS PRIVILEGE</Text>
        <Text style={headlineStyle}>{dropName}</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, as a VIP Collector, you have been granted {earlyAccessHours}-hour advance access before public drop release.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={accessUrl} variant="gold">
          ENTER PRIVATE VAULT
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default VipEarlyAccessMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
