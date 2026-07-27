import React from 'react';
import { Section, Text, Hr } from '@react-email/components';
import { LuxuryEditorialEmailLayout } from '../components/LuxuryEditorialEmailLayout';

export interface OrderItem {
  id: string;
  title: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface OrderCreatedEmailProps {
  customerName?: string;
  orderNumber?: string;
  orderId?: string;
  orderDate?: string;
  items?: OrderItem[];
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  total?: number;
  shippingAddress?: {
    name?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export const OrderCreatedEmail: React.FC<OrderCreatedEmailProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'GM-88192',
  orderId = 'ord_sample_88192',
  orderDate = new Date().toLocaleDateString('en-IN'),
  items = [
    {
      id: 'var_1',
      title: 'GODSMOVE Heavyweight Statement Tee',
      size: 'L',
      color: 'Ivory Wash',
      quantity: 1,
      price: 2999,
    },
    {
      id: 'var_2',
      title: 'Archival Loopback Fleece Hoodie',
      size: 'L',
      color: 'Onyx',
      quantity: 1,
      price: 4999,
    },
  ],
  subtotal = 7998,
  shipping = 0,
  discount = 0,
  total = 7998,
  shippingAddress = {
    name: 'Valued Collector',
    line1: '101 Quality Way, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
  },
}) => {
  const editorialNote = `Thank you for trusting GODSMOVE. Every order represents more than a purchase—it becomes part of a carefully documented archive. Your order #${orderNumber} has entered production and our team has begun preparing it with technical precision and care.`;

  const invoiceUrl = `https://godsmove.in/api/invoice/${orderId || orderNumber}`;

  return (
    <LuxuryEditorialEmailLayout
      previewText={`Order #${orderNumber} Confirmed — GODSMOVE Archival Allocation`}
      issueTag="ALLOCATION CONFIRMED // ARCHIVAL DISPATCH"
      headline={`Order #${orderNumber} Allocation Confirmed`}
      customerName={customerName}
      editorialNote={editorialNote}
      ctaText="TRACK MY ORDER"
      ctaUrl="https://godsmove.in/profile"
      invoiceUrl={invoiceUrl}
    >
      {/* ORDER METADATA BAR */}
      <Section style={cardSectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#C8A46A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <span>ORDER NO: {orderNumber}</span>
          <span>DATE: {orderDate}</span>
        </div>
      </Section>

      {/* ALLOCATION PIECES TABLE */}
      <Section style={{ marginBottom: '24px' }}>
        <Text style={sectionHeaderStyle}>ALLOCATION PIECES</Text>
        {items.map((item, idx) => (
          <div key={item.id || idx} style={itemRowStyle}>
            <div>
              <Text style={itemTitleStyle}>{item.title}</Text>
              <Text style={itemSubStyle}>
                {item.size ? `SIZE: ${item.size}` : ''} {item.color ? `• COLOR: ${item.color}` : ''} • QTY: {item.quantity}
              </Text>
            </div>
            <Text style={itemPriceStyle}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Text>
          </div>
        ))}
      </Section>

      <Hr style={dividerStyle} />

      {/* FINANCIAL BREAKDOWN */}
      <Section style={{ marginBottom: '24px' }}>
        <div style={summaryRowStyle}>
          <Text style={summaryLabelStyle}>SUBTOTAL</Text>
          <Text style={summaryValStyle}>₹{subtotal.toLocaleString('en-IN')}</Text>
        </div>
        <div style={summaryRowStyle}>
          <Text style={summaryLabelStyle}>SHIPPING (EXPRESS CONCIERGE)</Text>
          <Text style={summaryValStyle}>{shipping === 0 ? 'COMPLIMENTARY' : `₹${shipping.toLocaleString('en-IN')}`}</Text>
        </div>
        {discount > 0 && (
          <div style={summaryRowStyle}>
            <Text style={summaryLabelStyle}>VAULT PRIVILEGE CREDIT</Text>
            <Text style={{ ...summaryValStyle, color: '#22C55E' }}>-₹{discount.toLocaleString('en-IN')}</Text>
          </div>
        )}
        <Hr style={{ borderColor: '#EAE5DB', margin: '12px 0' }} />
        <div style={summaryRowStyle}>
          <Text style={{ ...summaryLabelStyle, fontWeight: 800, color: '#1A1918' }}>TOTAL ALLOCATION VALUE</Text>
          <Text style={{ ...summaryValStyle, fontSize: '16px', fontWeight: 800, color: '#1A1918' }}>₹{total.toLocaleString('en-IN')}</Text>
        </div>
      </Section>

      {/* SHIPPING ADDRESS CARD */}
      {shippingAddress && (
        <Section style={cardSectionStyle}>
          <Text style={sectionHeaderStyle}>DESTINATION ADDRESS</Text>
          <Text style={{ fontSize: '13px', fontWeight: 700, color: '#1A1918', margin: '0 0 4px 0' }}>{shippingAddress.name || customerName}</Text>
          <Text style={{ fontSize: '12px', color: '#6E6B65', margin: 0, lineHeight: '18px' }}>
            {shippingAddress.line1}<br />
            {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
          </Text>
        </Section>
      )}
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
  margin: '0 0 14px 0',
  textTransform: 'uppercase',
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #EAE5DB',
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#1A1918',
  margin: '0 0 4px 0',
};

const itemSubStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6E6B65',
  margin: 0,
};

const itemPriceStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#1A1918',
  margin: 0,
};

const summaryRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 0',
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: '#6E6B65',
  margin: 0,
};

const summaryValStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#1A1918',
  margin: 0,
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#EAE5DB',
  margin: '24px 0',
};

export default OrderCreatedEmail;
