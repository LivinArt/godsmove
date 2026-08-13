import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEditorialEmailLayout } from '../components/LuxuryEditorialEmailLayout';
import { GODSMOVE_WORDMARK } from '../brand';

export interface WelcomeEmailProps {
  customerName?: string;
  email?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  customerName = 'Valued Collector',
  email = 'support@godsmove.in',
}) => {
  const editorialNote = `Welcome to ${GODSMOVE_WORDMARK}. You are no longer simply a customer—you are now part of an archival movement built around craftsmanship, permanence and intentional design. We are genuinely excited to have you with us.`;

  return (
    <LuxuryEditorialEmailLayout
      previewText={`Welcome to the ${GODSMOVE_WORDMARK} Archival Movement — Account Registration Confirmed`}
      issueTag="ACCOUNT REGISTRATION // WELCOME PRIVILEGE"
      headline={`Welcome to the ${GODSMOVE_WORDMARK} Archival Circle`}
      customerName={customerName}
      editorialNote={editorialNote}
      ctaText="EXPLORE ARCHIVAL COLLECTION"
      ctaUrl="https://godsmove.in/drops"
    >
      <Section style={cardSectionStyle}>
        <Text style={sectionHeaderStyle}>ACCOUNT PRIVILEGE DETAILS</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#4A4742' }}>
          <div><strong>MEMBER NAME:</strong> {customerName}</div>
          <div><strong>REGISTERED EMAIL:</strong> {email}</div>
          <div><strong>MEMBERSHIP STATUS:</strong> ARCHIVAL COLLECTOR</div>
          <div><strong>VAULT PRIVILEGE:</strong> ACCESS TO CAPPED DROPS & PRIVATE ALLOCATIONS</div>
        </div>
      </Section>
    </LuxuryEditorialEmailLayout>
  );
};

const cardSectionStyle: React.CSSProperties = {
  backgroundColor: '#F4F0E8',
  borderRadius: '6px',
  padding: '24px',
  marginBottom: '24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  color: '#C8A46A',
  margin: '0 0 14px 0',
  textTransform: 'uppercase',
};

export default WelcomeEmail;
