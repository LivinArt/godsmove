import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { PriceSummary } from '../components/PriceSummary';
import { OrderSummary, EmailShippingAddress } from '../components/OrderSummary';
import { CTAButton } from '../components/CTAButton';

export interface InvoiceEmailProps {
  customerName: string;
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  subtotal: number;
  shipping: number;
  total: number;
  gstAmount: number;
  shippingAddress: EmailShippingAddress;
  downloadInvoiceUrl?: string;
}

export const InvoiceEmail: React.FC<InvoiceEmailProps> = ({
  customerName = 'Valued Collector',
  invoiceNumber = 'INV-GM-2026-001',
  orderNumber = 'GM-2026-8801',
  orderDate = '26 July 2026',
  subtotal = 2999,
  shipping = 0,
  total = 2999,
  shippingAddress = {
    name: 'Valued Collector',
    line1: '402 Archival Towers, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '+91 98765 43210',
  },
  downloadInvoiceUrl = 'https://godsmove.in/api/invoice/123',
}) => {
  const previewText = `Tax Invoice ${invoiceNumber} for Order ${orderNumber}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>OFFICIAL TAX INVOICE</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, your tax invoice for allocation reference{' '}
          <strong style={{ color: '#ffffff' }}>{orderNumber}</strong> has been generated and filed.
        </Text>
      </Section>

      <OrderSummary
        orderNumber={orderNumber}
        orderDate={orderDate}
        shippingAddress={shippingAddress}
      />

      <PriceSummary
        subtotal={subtotal}
        shipping={shipping}
        total={total}
        gstNote="GST Included in MRP"
      />

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={downloadInvoiceUrl} variant="gold">
          DOWNLOAD PDF INVOICE
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default InvoiceEmail;

const greetingStyle = {
  fontSize: '14px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#c8a46a',
  margin: '0 0 12px 0',
};

const bodyStyle = {
  fontSize: '12px',
  color: '#a1a1aa',
  lineHeight: '20px',
  margin: '0',
};
