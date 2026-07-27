import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEditorialEmailLayout } from '../components/LuxuryEditorialEmailLayout';

export interface PasswordResetEmailProps {
  customerName?: string;
  resetUrl?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  customerName = 'Valued Collector',
  resetUrl = 'https://godsmove.in/auth/callback',
}) => {
  const editorialNote = `Someone requested access to reset your account password. If that was you, continue securely below to update your security credentials. If you did not initiate this request, you can safely ignore this message—your account credentials remain protected.`;

  return (
    <LuxuryEditorialEmailLayout
      previewText="Password Reset Instructions — GODSMOVE Security Concierge"
      issueTag="SECURITY AUTHENTICATION // ACCOUNT PROTECTION"
      headline="Security Password Reset Request"
      customerName={customerName}
      editorialNote={editorialNote}
      ctaText="RESET SECURE PASSWORD"
      ctaUrl={resetUrl}
    >
      <Section style={cardSectionStyle}>
        <Text style={sectionHeaderStyle}>SECURITY NOTICE</Text>
        <Text style={{ fontSize: '12px', color: '#4A4742', margin: 0, lineHeight: '18px' }}>
          This security link is valid for 60 minutes. For protection, never share this link with anyone.
        </Text>
      </Section>
    </LuxuryEditorialEmailLayout>
  );
};

const cardSectionStyle: React.CSSProperties = {
  backgroundColor: '#F4F0E8',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  color: '#C8A46A',
  margin: '0 0 10px 0',
  textTransform: 'uppercase',
};

export default PasswordResetEmail;
