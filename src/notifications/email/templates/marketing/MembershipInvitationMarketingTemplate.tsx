import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface MembershipInvitationMarketingTemplateProps {
  customerName?: string;
  invitationDetails?: string;
  acceptUrl?: string;
}

export const MembershipInvitationMarketingTemplate: React.FC<MembershipInvitationMarketingTemplateProps> = ({
  customerName = 'Valued Collector',
  invitationDetails = 'You are invited to join the GODSMOVE Private Collector Circle with exclusive tier privileges, bespoke physical drops, and direct concierge access.',
  acceptUrl = 'https://godsmove.in/profile',
}) => {
  return (
    <LuxuryEmailLayout previewText="Invitation to Join GODSMOVE Private Circle">
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>PRIVATE INVITATION</Text>
        <Text style={headlineStyle}>PRIVATE COLLECTOR CIRCLE INVITATION</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, {invitationDetails}
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={acceptUrl} variant="gold">
          ACCEPT INVITATION
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default MembershipInvitationMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
