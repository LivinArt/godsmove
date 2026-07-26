import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface WelcomeTemplateProps {
  customerName: string;
  exploreUrl?: string;
}

export const WelcomeTemplate: React.FC<WelcomeTemplateProps> = ({
  customerName = 'Valued Collector',
  exploreUrl = 'https://godsmove.in/drops',
}) => {
  const previewText = 'Welcome to the GODSMOVE Archival Movement';

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>WELCOME TO GODSMOVE</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, welcome to GODSMOVE. You are now part of our archival collective, with priority access to limited drop allocations, member-only racks, and bespoke storytelling.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={exploreUrl} variant="gold">
          EXPLORE ARCHIVAL DROPS
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default WelcomeTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
