import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface NewDropTemplateProps {
  dropName: string;
  releaseTime: string;
  description: string;
  dropUrl?: string;
}

export const NewDropTemplate: React.FC<NewDropTemplateProps> = ({
  dropName = 'ARCHIVAL DROP 04: NOISE',
  releaseTime = 'LIVE NOW',
  description = 'Ultra-limited heavy fleece hoodies and acid-washed box tees. Strictly capped units.',
  dropUrl = 'https://godsmove.in/drops',
}) => {
  const previewText = `New Drop Released: ${dropName}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>NEW DROP ALLOCATION</Text>
        <Text style={titleStyle}>{dropName}</Text>
        <Text style={timeStyle}>{releaseTime}</Text>
        <Text style={bodyStyle}>{description}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={dropUrl} variant="gold">
          ACCESS DROP NOW
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default NewDropTemplate;

const greetingStyle = { fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: '#8c857b', margin: '0 0 6px 0' };
const titleStyle = { fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 4px 0' };
const timeStyle = { fontSize: '12px', fontWeight: 800, color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
