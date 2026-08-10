import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface WalletDebitedTemplateProps {
  customerName: string;
  amount: number;
  remainingBalance?: number;
  newBalance?: number;
  reason?: string;
  walletUrl?: string;
}

export const WalletDebitedTemplate: React.FC<WalletDebitedTemplateProps> = ({
  customerName = 'Valued Collector',
  amount = 500,
  remainingBalance,
  newBalance,
  reason = 'Applied to Order Checkout',
  walletUrl = 'https://godsmove.in/profile',
}) => {
  const actualRemaining = remainingBalance ?? newBalance ?? 0;
  const previewText = `₹${amount.toLocaleString('en-IN')} Applied from your GODSMOVE Account`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>GODSMOVE VAULT DEBIT</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, store credits have been applied from your Archival Vault.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={cardLabel}>DEBITED AMOUNT</Text>
        <Text style={amountStyle}>- ₹{amount.toLocaleString('en-IN')}</Text>

        <Text style={cardLabel}>REMAINING VAULT BALANCE</Text>
        <Text style={balanceStyle}>₹{actualRemaining.toLocaleString('en-IN')}</Text>

        <Text style={cardLabel}>TRANSACTION REFERENCE</Text>
        <Text style={reasonStyle}>{reason}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={walletUrl} variant="gold">
          VIEW ACCOUNT ACTIVITY
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default WalletDebitedTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '24px', marginBottom: '28px', textAlign: 'center' as const };
const cardLabel = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '12px 0 2px 0', textTransform: 'uppercase' as const };
const amountStyle = { fontSize: '24px', fontWeight: 800, color: '#ef4444', margin: '0' };
const balanceStyle = { fontSize: '18px', fontWeight: 800, color: '#c8a46a', margin: '0' };
const reasonStyle = { fontSize: '11px', color: '#ffffff', margin: '0' };
