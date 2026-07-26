import React from 'react';
import { Section, Text, Img } from '@react-email/components';

export interface EmailOrderItem {
  id: string;
  title: string;
  size: string;
  color?: string | null;
  quantity: number;
  price: number;
  imageUrl?: string | null;
}

interface ProductCardProps {
  items: EmailOrderItem[];
}

export const ProductCard: React.FC<ProductCardProps> = ({ items }) => {
  return (
    <Section style={containerStyle}>
      <Text style={headingStyle}>ALLOCATED PIECES ({items.length})</Text>
      
      {items.map((item, index) => (
        <Section key={item.id || index} style={itemRowStyle}>
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
            <tr>
              {item.imageUrl && (
                <td width="80" style={{ verticalAlign: 'top', paddingRight: '16px' }}>
                  <Img
                    src={item.imageUrl}
                    alt={item.title}
                    width="70"
                    height="90"
                    style={imageStyle}
                  />
                </td>
              )}
              <td style={{ verticalAlign: 'top' }}>
                <Text style={titleStyle}>{item.title}</Text>
                <Text style={detailsStyle}>
                  SIZE: {item.size} {item.color ? `| COLOUR: ${item.color}` : ''}
                </Text>
                <Text style={qtyStyle}>QTY: {item.quantity}</Text>
              </td>
              <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                <Text style={priceStyle}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Text>
                <Text style={unitPriceStyle}>₹{item.price.toLocaleString('en-IN')} each</Text>
              </td>
            </tr>
          </table>
        </Section>
      ))}
    </Section>
  );
};

const containerStyle = {
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

const itemRowStyle = {
  padding: '16px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
};

const imageStyle = {
  borderRadius: '2px',
  objectFit: 'cover' as const,
  backgroundColor: '#18181b',
};

const titleStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '0 0 4px 0',
  letterSpacing: '0.05em',
};

const detailsStyle = {
  fontSize: '10px',
  color: '#a1a1aa',
  margin: '0 0 4px 0',
  letterSpacing: '0.08em',
};

const qtyStyle = {
  fontSize: '10px',
  color: '#71717a',
  margin: '0',
};

const priceStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '0 0 2px 0',
};

const unitPriceStyle = {
  fontSize: '10px',
  color: '#71717a',
  margin: '0',
};
