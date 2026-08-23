import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEditorialEmailLayout } from '../components/LuxuryEditorialEmailLayout';
import { GODSMOVE_WORDMARK } from '../brand';

export interface EarlyAccessConfirmationProps {
  customerName?: string;
  email?: string;
}

export const EarlyAccessConfirmationTemplate: React.FC<EarlyAccessConfirmationProps> = ({
  customerName = 'Custodian',
  email = '',
}) => {
  const firstName = customerName ? customerName.split(' ')[0] : 'Custodian';
  const editorialNote = `Thank you for registering for Early Access with ${GODSMOVE_WORDMARK}. As an early registrant, you have been granted launch benefits and priority privileges ahead of our upcoming release.`;

  return (
    <LuxuryEditorialEmailLayout
      previewText={`${GODSMOVE_WORDMARK} Early Access Confirmed — Launch Benefits Active`}
      issueTag="EARLY ACCESS // PRIORITY REGISTRATION"
      headline={`Welcome to ${GODSMOVE_WORDMARK} Early Access`}
      customerName={firstName}
      editorialNote={editorialNote}
    >
      <Section style={cardSectionStyle}>
        <Text style={sectionHeaderStyle}>YOUR EARLY ACCESS LAUNCH PRIVILEGES</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#111111', lineHeight: '1.6' }}>
          <div>✔ <strong>1 Year {GODSMOVE_WORDMARK} Membership</strong></div>
          <div>✔ <strong>Priority access at launch</strong></div>
          <div>✔ <strong>Exclusive member benefits</strong></div>
          <div>✔ <strong>Assured reward up to ₹1,000</strong></div>
        </div>
      </Section>

      {email ? (
        <Section style={{ textAlign: 'center', margin: '20px 0' }}>
          <Text style={{ fontSize: '12px', color: '#666666' }}>
            Registered email: <strong>{email}</strong>
          </Text>
        </Section>
      ) : null}
    </LuxuryEditorialEmailLayout>
  );
};

const cardSectionStyle: React.CSSProperties = {
  backgroundColor: '#F9F8F6',
  border: '1px solid #E5E5E5',
  borderRadius: '6px',
  padding: '24px',
  marginBottom: '24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.15em',
  color: '#111111',
  margin: '0 0 16px 0',
  textTransform: 'uppercase',
};

export default EarlyAccessConfirmationTemplate;
