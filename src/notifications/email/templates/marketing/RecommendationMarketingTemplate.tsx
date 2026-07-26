import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface RecommendationMarketingTemplateProps {
  customerName?: string;
  recommendationTitle?: string;
  recommendationReason?: string;
  shopUrl?: string;
}

export const RecommendationMarketingTemplate: React.FC<RecommendationMarketingTemplateProps> = ({
  customerName = 'Valued Collector',
  recommendationTitle = 'CURATED ARCHIVAL SELECTIONS',
  recommendationReason = 'Based on your recent allocation of heavyweight loopback tees, our concierge recommends these matching silhouettes.',
  shopUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText="Curated Archival Recommendations for You">
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>PERSONAL CONCIERGE</Text>
        <Text style={headlineStyle}>{recommendationTitle}</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, {recommendationReason}
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={shopUrl} variant="gold">
          EXPLORE CURATED PIECES
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default RecommendationMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
