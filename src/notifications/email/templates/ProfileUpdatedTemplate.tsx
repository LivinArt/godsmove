import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface ProfileUpdatedTemplateProps {
  customerName?: string;
  email?: string;
  profileUrl?: string;
}

export const ProfileUpdatedTemplate: React.FC<ProfileUpdatedTemplateProps> = ({
  customerName = 'Valued Collector',
  email = '',
  profileUrl = 'https://godsmove.in/profile',
}) => {
  const previewText = 'Profile Security & Details Updated | GODSMOVE';

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>PROFILE UPDATED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, your GODSMOVE collector profile and security details were updated successfully.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>ACCOUNT SECURITY ADVISORY</Text>
        <Text style={valueStyle}>
          If you initiated these changes, no further action is required. If you did not authorize this update, please contact our concierge support immediately at support@godsmove.in.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={profileUrl} variant="gold">
          VIEW YOUR PROFILE
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default ProfileUpdatedTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', marginBottom: '28px' };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const valueStyle = { fontSize: '11px', color: '#d4d4d8', lineHeight: '18px', margin: '0' };
