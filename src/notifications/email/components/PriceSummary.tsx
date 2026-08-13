import React from 'react';
import { Section, Text, Hr } from '@react-email/components';

interface PriceSummaryProps {
  subtotal: number;
  shipping: number;
  codFee?: number;
  walletDiscount?: number;
  couponDiscount?: number;
  total: number;
  gstNote?: string;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  subtotal,
  shipping,
  codFee = 0,
  walletDiscount = 0,
  couponDiscount = 0,
  total,
  gstNote = 'Price inclusive of GST',
}) => {
  return (
    <Section style={containerStyle}>
      <Text style={headingStyle}>FINANCIAL BREAKDOWN</Text>

      <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
        <tr>
          <td style={labelStyle}>Subtotal</td>
          <td style={valueStyle}>₹{subtotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style={labelStyle}>Archival Express Shipping</td>
          <td style={valueStyle}>{shipping === 0 ? 'COMPLIMENTARY' : `₹${shipping.toLocaleString('en-IN')}`}</td>
        </tr>

        {codFee > 0 && (
          <tr>
            <td style={labelStyle}>COD Handling Fee</td>
            <td style={valueStyle}>+ ₹{codFee.toLocaleString('en-IN')}</td>
          </tr>
        )}

        {walletDiscount > 0 && (
          <tr>
            <td style={discountLabelStyle}>Godsmove Wallet Credits Applied</td>
            <td style={discountValueStyle}>- ₹{walletDiscount.toLocaleString('en-IN')}</td>
          </tr>
        )}

        {couponDiscount > 0 && (
          <tr>
            <td style={discountLabelStyle}>Exclusive Privileges Discount</td>
            <td style={discountValueStyle}>- ₹{couponDiscount.toLocaleString('en-IN')}</td>
          </tr>
        )}
      </table>

      <Hr style={hrStyle} />

      <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
        <tr>
          <td style={totalLabelStyle}>
            TOTAL PAYABLE
            <span style={gstSubtextStyle}> ({gstNote})</span>
          </td>
          <td style={totalValueStyle}>₹{total.toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </Section>
  );
};

const containerStyle = {
  backgroundColor: '#121215',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '4px',
  padding: '20px',
  marginBottom: '28px',
};

const headingStyle = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: '#c8a46a',
  marginBottom: '16px',
  textTransform: 'uppercase' as const,
};

const labelStyle = {
  fontSize: '11px',
  color: '#a1a1aa',
  padding: '4px 0',
};

const valueStyle = {
  fontSize: '11px',
  color: '#ffffff',
  textAlign: 'right' as const,
  padding: '4px 0',
  fontWeight: 600,
};

const discountLabelStyle = {
  fontSize: '11px',
  color: '#22c55e',
  padding: '4px 0',
};

const discountValueStyle = {
  fontSize: '11px',
  color: '#22c55e',
  textAlign: 'right' as const,
  padding: '4px 0',
  fontWeight: 600,
};

const hrStyle = {
  borderColor: 'rgba(255, 255, 255, 0.1)',
  margin: '12px 0',
};

const totalLabelStyle = {
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#ffffff',
  textTransform: 'uppercase' as const,
};

const gstSubtextStyle = {
  fontSize: '9px',
  color: '#8c857b',
  fontWeight: 400,
  letterSpacing: '0.02em',
};

const totalValueStyle = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#c8a46a',
  textAlign: 'right' as const,
};
