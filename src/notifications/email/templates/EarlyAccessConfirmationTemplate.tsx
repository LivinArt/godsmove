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

  const benefits = [
    { text: `1 Year ${GODSMOVE_WORDMARK} Membership` },
    { text: 'Priority access at launch' },
    { text: 'Exclusive member benefits' },
    { text: 'Assured reward up to ₹1,000' },
  ];

  return (
    <LuxuryEditorialEmailLayout
      previewText={`${GODSMOVE_WORDMARK} Early Access Confirmed — Launch Benefits Active`}
      issueTag="EARLY ACCESS // PRIORITY REGISTRATION"
      headline={`Welcome to ${GODSMOVE_WORDMARK} Early Access`}
      customerName={firstName}
      editorialNote={editorialNote}
    >
      <style>{`
        @media only screen and (max-width: 600px) {
          .ea-benefit-cell {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding-right: 0 !important;
            padding-bottom: 14px !important;
          }
          .ea-benefit-row {
            display: block !important;
            width: 100% !important;
          }
        }
      `}</style>

      <Section style={cardSectionStyle}>
        <Text style={sectionHeaderStyle}>YOUR EARLY ACCESS LAUNCH PRIVILEGES</Text>

        <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {/* ROW 1: Benefit 1 & Benefit 2 */}
            <tr className="ea-benefit-row">
              <td
                className="ea-benefit-cell"
                width="50%"
                valign="top"
                style={{ width: '50%', paddingRight: '12px', paddingBottom: '16px', verticalAlign: 'top' }}
              >
                <table border={0} cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td valign="top" style={{ width: '20px', paddingRight: '8px', verticalAlign: 'top', color: '#C8A46A', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.5' }}>
                        ✔
                      </td>
                      <td valign="top" style={{ fontSize: '13px', color: '#1A1918', fontWeight: 600, lineHeight: '1.5', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                        {benefits[0].text}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td
                className="ea-benefit-cell"
                width="50%"
                valign="top"
                style={{ width: '50%', paddingRight: '0px', paddingBottom: '16px', verticalAlign: 'top' }}
              >
                <table border={0} cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td valign="top" style={{ width: '20px', paddingRight: '8px', verticalAlign: 'top', color: '#C8A46A', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.5' }}>
                        ✔
                      </td>
                      <td valign="top" style={{ fontSize: '13px', color: '#1A1918', fontWeight: 600, lineHeight: '1.5', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                        {benefits[1].text}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ROW 2: Benefit 3 & Benefit 4 */}
            <tr className="ea-benefit-row">
              <td
                className="ea-benefit-cell"
                width="50%"
                valign="top"
                style={{ width: '50%', paddingRight: '12px', paddingBottom: '8px', verticalAlign: 'top' }}
              >
                <table border={0} cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td valign="top" style={{ width: '20px', paddingRight: '8px', verticalAlign: 'top', color: '#C8A46A', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.5' }}>
                        ✔
                      </td>
                      <td valign="top" style={{ fontSize: '13px', color: '#1A1918', fontWeight: 600, lineHeight: '1.5', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                        {benefits[2].text}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td
                className="ea-benefit-cell"
                width="50%"
                valign="top"
                style={{ width: '50%', paddingRight: '0px', paddingBottom: '8px', verticalAlign: 'top' }}
              >
                <table border={0} cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td valign="top" style={{ width: '20px', paddingRight: '8px', verticalAlign: 'top', color: '#C8A46A', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.5' }}>
                        ✔
                      </td>
                      <td valign="top" style={{ fontSize: '13px', color: '#1A1918', fontWeight: 600, lineHeight: '1.5', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                        {benefits[3].text}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
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
  margin: '0 0 18px 0',
  textTransform: 'uppercase',
};

export default EarlyAccessConfirmationTemplate;
