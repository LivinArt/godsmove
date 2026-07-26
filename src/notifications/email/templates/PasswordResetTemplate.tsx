import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface PasswordResetTemplateProps {
  customerName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export const PasswordResetTemplate: React.FC<PasswordResetTemplateProps> = ({
  customerName = 'Valued Collector',
  resetUrl = 'https://godsmove.in/login',
  expiresInMinutes = 30,
}) => {
  const previewText = 'Security Advisory: GODSMOVE Password Reset Instructions';

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>AUTHENTICATION SECURITY ADVISORY</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, a password reset request was initiated for your GODSMOVE Archival Account. Click the secure link below to update your security credentials.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>SECURITY TOKEN EXPIRATION</Text>
        <Text style={valueStyle}>This single-use link expires in {expiresInMinutes} minutes.</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={resetUrl} variant="gold">
          RESET ACCOUNT PASSWORD
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default PasswordResetTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', marginBottom: '28px' };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0', textTransform: 'uppercase' as const };
const valueStyle = { fontSize: '12px', color: '#ffffff', margin: '2px 0 0 0' };
