import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface LimitedEditionMarketingTemplateProps {
  editionName?: string;
  pieceCount?: number;
  description?: string;
  claimUrl?: string;
}

export const LimitedEditionMarketingTemplate: React.FC<LimitedEditionMarketingTemplateProps> = ({
  editionName = 'THE BLACKOUT HOODIE — SERIES 01',
  pieceCount = 100,
  description = 'Strictly limited to 100 numbered pieces worldwide. Engineered with 480GSM organic cotton fleece.',
  claimUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={`Limited Allocation: ${editionName}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>STRICTLY CAPPED RELEASE</Text>
        <Text style={headlineStyle}>{editionName.toUpperCase()}</Text>
        <Text style={pieceStyle}>1 OF {pieceCount} NUMBERED PIECES</Text>
        <Text style={bodyStyle}>{description}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={claimUrl} variant="gold">
          CLAIM PIECE ALLOCATION
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default LimitedEditionMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#ef4444', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 8px 0' };
const pieceStyle = { fontSize: '12px', fontWeight: 800, color: '#c8a46a', letterSpacing: '0.15em', margin: '0 0 16px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
