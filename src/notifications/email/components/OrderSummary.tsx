import React from 'react';
import { Section, Text } from '@react-email/components';

export interface EmailShippingAddress {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface OrderSummaryProps {
  orderNumber: string;
  orderDate: string;
  paymentMethod?: string;
  shippingAddress: EmailShippingAddress;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  orderNumber,
  orderDate,
  paymentMethod = 'Online Payment (Razorpay)',
  shippingAddress,
}) => {
  return (
    <Section style={containerStyle}>
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
        <tr>
          <td style={{ verticalAlign: 'top', width: '50%', paddingRight: '12px' }}>
            <Text style={headingStyle}>ALLOCATION REFERENCE</Text>
            <Text style={labelStyle}>Order Number:</Text>
            <Text style={highlightValueStyle}>{orderNumber}</Text>

            <Text style={{ ...labelStyle, marginTop: '8px' }}>Date:</Text>
            <Text style={valueStyle}>{orderDate}</Text>

            <Text style={{ ...labelStyle, marginTop: '8px' }}>Payment Method:</Text>
            <Text style={valueStyle}>{paymentMethod}</Text>
          </td>

          <td style={{ verticalAlign: 'top', width: '50%', paddingLeft: '12px' }}>
            <Text style={headingStyle}>DESTINATION ADDRESS</Text>
            <Text style={nameValueStyle}>{shippingAddress.name}</Text>
            <Text style={valueStyle}>{shippingAddress.line1}</Text>
            {shippingAddress.line2 && <Text style={valueStyle}>{shippingAddress.line2}</Text>}
            <Text style={valueStyle}>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
            </Text>
            <Text style={valueStyle}>T: {shippingAddress.phone}</Text>
          </td>
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
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: '#c8a46a',
  marginBottom: '10px',
  textTransform: 'uppercase' as const,
};

const labelStyle = {
  fontSize: '10px',
  color: '#8c857b',
  margin: '0',
};

const valueStyle = {
  fontSize: '11px',
  color: '#d4d4d8',
  margin: '2px 0 0 0',
};

const nameValueStyle = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '2px 0 0 0',
};

const highlightValueStyle = {
  fontSize: '12px',
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '0.05em',
  margin: '2px 0 0 0',
};
