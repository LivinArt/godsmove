import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface NewDropMarketingTemplateProps {
  dropTitle?: string;
  releaseDate?: string;
  description?: string;
  dropUrl?: string;
}

export const NewDropMarketingTemplate: React.FC<NewDropMarketingTemplateProps> = ({
  dropTitle = 'NEW ALLOCATION: DROP 05',
  releaseDate = 'AVAILABLE NOW',
  description = 'Capped batch production featuring our signature heavyweight loopback fleece and vintage wash treatments.',
  dropUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={`New Drop Allocation: ${dropTitle}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>LIMITED DROP</Text>
        <Text style={headlineStyle}>{dropTitle.toUpperCase()}</Text>
        <Text style={badgeStyle}>{releaseDate}</Text>
        <Text style={bodyStyle}>{description}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={dropUrl} variant="gold">
          ACCESS DROP ALLOCATION
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default NewDropMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '22px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 8px 0' };
const badgeStyle = { fontSize: '11px', fontWeight: 800, color: '#22c55e', letterSpacing: '0.1em', margin: '0 0 16px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
