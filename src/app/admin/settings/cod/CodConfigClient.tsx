'use client';

import React, { useState } from 'react';
import { updateCodSettings, type CodConfigData } from '@/actions/cod.actions';

interface Props {
  initialConfig: CodConfigData;
}

export default function CodConfigClient({ initialConfig }: Props) {
  const [isEnabled, setIsEnabled] = useState(initialConfig.isEnabled);
  const [chargeType, setChargeType] = useState<'PERCENTAGE' | 'FIXED'>(initialConfig.chargeType);
  const [chargeValue, setChargeValue] = useState(initialConfig.chargeValue);
  const [displayLabel, setDisplayLabel] = useState(initialConfig.displayLabel);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await updateCodSettings({
        isEnabled,
        chargeType,
        chargeValue: Number(chargeValue),
        displayLabel,
      });

      if (res.success) {
        setMessage({ type: 'success', text: '✅ COD Configuration updated and live on storefront!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update COD configuration.' });
    } finally {
      setLoading(false);
    }
  };

  // Preview calculations
  const previewOrderValue = 2000;
  const previewCharge = isEnabled
    ? chargeType === 'PERCENTAGE'
      ? Math.round(previewOrderValue * (chargeValue / 100))
      : Math.round(chargeValue)
    : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#e5e7eb' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(200, 164, 106, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(200, 164, 106, 0.3)',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Cash on Delivery (COD) Control Center
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '6px 0 0 0' }}>
              Configure global Cash on Delivery rules, surcharge models, and storefront display parameters in real time.
            </p>
          </div>
          <div style={{
            background: isEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${isEnabled ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: isEnabled ? '#4ade80' : '#f87171',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            SYSTEM STATUS: {isEnabled ? '● COD ACTIVE' : '○ COD DISABLED'}
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '24px',
          background: message.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.type === 'success' ? '#4ade80' : '#f87171',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
        {/* Form Controls */}
        <form onSubmit={handleSave} style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '28px',
        }}>
          {/* 1. Global Enable / Disable Toggle */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              1. Storefront Availability
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1e293b',
              padding: '16px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <div>
                <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '15px' }}>Enable Cash on Delivery</div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
                  {isEnabled
                    ? 'Customers can select Cash on Delivery at checkout.'
                    : 'COD option will be completely hidden from checkout.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                style={{
                  width: '56px',
                  height: '30px',
                  borderRadius: '15px',
                  background: isEnabled ? '#c8a46a' : '#334155',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  padding: '2px',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: isEnabled ? '28px' : '2px',
                  transition: 'left 0.2s ease',
                }} />
              </button>
            </div>
          </div>

          {/* 2. Surcharge Calculation Model */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              2. Surcharge Charging Model
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div
                onClick={() => setChargeType('FIXED')}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: chargeType === 'FIXED' ? 'rgba(200, 164, 106, 0.12)' : '#1e293b',
                  border: `1px solid ${chargeType === 'FIXED' ? '#c8a46a' : 'rgba(255, 255, 255, 0.05)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, color: chargeType === 'FIXED' ? '#c8a46a' : '#ffffff', fontSize: '14px' }}>
                  Fixed Amount (₹)
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Adds a fixed rupee fee to every COD order (e.g. ₹99).
                </div>
              </div>

              <div
                onClick={() => setChargeType('PERCENTAGE')}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: chargeType === 'PERCENTAGE' ? 'rgba(200, 164, 106, 0.12)' : '#1e293b',
                  border: `1px solid ${chargeType === 'PERCENTAGE' ? '#c8a46a' : 'rgba(255, 255, 255, 0.05)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, color: chargeType === 'PERCENTAGE' ? '#c8a46a' : '#ffffff', fontSize: '14px' }}>
                  Percentage (%)
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Calculates fee based on order subtotal percentage (e.g. 5%).
                </div>
              </div>
            </div>
          </div>

          {/* 3. Surcharge Value Input */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              3. Surcharge Charge Value ({chargeType === 'PERCENTAGE' ? '%' : '₹'})
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0"
                step={chargeType === 'PERCENTAGE' ? '0.1' : '1'}
                value={chargeValue}
                onChange={(e) => setChargeValue(parseFloat(e.target.value) || 0)}
                placeholder={chargeType === 'PERCENTAGE' ? 'e.g. 5' : 'e.g. 99'}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontWeight: 700 }}>
                {chargeType === 'PERCENTAGE' ? '%' : 'INR'}
              </span>
            </div>
          </div>

          {/* 4. Public Customer Display Label */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              4. Public Customer Display Label
            </label>
            <input
              type="text"
              value={displayLabel}
              onChange={(e) => setDisplayLabel(e.target.value)}
              placeholder="e.g. Cash on Delivery (+₹99)"
              style={{
                width: '100%',
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
              This exact title will be rendered on the checkout payment option card for customers.
            </div>
          </div>

          {/* Save Action Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#c8a46a',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'Saving Configuration...' : 'Save & Deploy COD Settings'}
          </button>
        </form>

        {/* Live Storefront Preview Sidebar */}
        <div>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px',
            position: 'sticky',
            top: '24px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#c8a46a', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Storefront Preview
            </h3>

            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '14px' }}>
              How the payment selection appears at checkout:
            </div>

            {/* Simulated Checkout Card */}
            <div style={{
              background: '#1e293b',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
                Payment Method Selection
              </div>

              {/* Online Payment Option */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                marginBottom: '8px',
              }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #64748b' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Secure Online Payment</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>UPI, Cards, Net Banking</div>
                </div>
              </div>

              {/* COD Option Preview */}
              {isEnabled ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'rgba(200, 164, 106, 0.1)',
                  border: '1px solid rgba(200, 164, 106, 0.4)',
                }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#c8a46a', border: '2px solid #c8a46a' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#c8a46a' }}>
                      {displayLabel || 'Cash on Delivery'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      Pay when you receive your order
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px border-dashed rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '12px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                  [COD HIDDEN FROM STOREFRONT]
                </div>
              )}
            </div>

            {/* Price Calculation Simulation */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                Simulated ₹2,000 Order Breakdown
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>
                <span>Subtotal:</span>
                <span>₹2,000</span>
              </div>
              {isEnabled && previewCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#c8a46a', marginBottom: '6px', fontWeight: 600 }}>
                  <span>COD Charge:</span>
                  <span>+₹{previewCharge}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ffffff', fontWeight: 800, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px', marginTop: '8px' }}>
                <span>Final Payable:</span>
                <span>₹{(2000 + previewCharge).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
