'use client';

import React, { useState } from 'react';
import { switchSiteModeToNormal, setSiteModeAction } from '@/actions/site-config.actions';
import { Loader2, Rocket, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  initialSiteMode: 'PRELAUNCH' | 'NORMAL';
}

export default function StorefrontLaunchControl({ initialSiteMode }: Props) {
  const [siteMode, setSiteMode] = useState<'PRELAUNCH' | 'NORMAL'>(initialSiteMode);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmLaunch() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await switchSiteModeToNormal();
      if (res.success) {
        setSiteMode('NORMAL');
        setShowModal(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch storefront mode.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevertToPrelaunch() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await setSiteModeAction('PRELAUNCH');
      if (res.success) {
        setSiteMode('PRELAUNCH');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to revert to pre-launch mode.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'var(--admin-card-bg, #1A1A1A)',
      border: '1px solid var(--admin-border, #333333)',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: '#888888', textTransform: 'uppercase', marginBottom: 6 }}>
            STOREFRONT STATUS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: siteMode === 'PRELAUNCH' ? '#FFB74D' : '#4CAF50',
              boxShadow: siteMode === 'PRELAUNCH' ? '0 0 8px #FFB74D' : '0 0 8px #4CAF50',
            }} />
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.05em' }}>
              {siteMode === 'PRELAUNCH' ? 'PRE-LAUNCH' : 'LIVE (NORMAL)'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#AAAAAA', marginTop: 6, margin: '6px 0 0 0' }}>
            {siteMode === 'PRELAUNCH'
              ? 'Storefront is displaying the Early Access registration landing page.'
              : 'Storefront is fully open to the public. Normal shopping & checkout active.'}
          </p>
        </div>

        <div>
          {siteMode === 'PRELAUNCH' ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              disabled={loading}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#000000',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textTransform: 'uppercase',
              }}
            >
              <Rocket size={16} />
              <span>SWITCH TO LIVE STOREFRONT</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRevertToPrelaunch}
              disabled={loading}
              style={{
                backgroundColor: 'transparent',
                color: '#888888',
                border: '1px solid #444444',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.05em',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Updating...' : 'REVERT TO PRE-LAUNCH'}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: '#181818',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '440px',
            width: '100%',
            color: '#FFFFFF',
            textAlign: 'center',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 183, 77, 0.1)',
              color: '#FFB74D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              Are you ready to open GODSMOVƎ to the public?
            </h3>

            <p style={{ fontSize: '13px', color: '#AAAAAA', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              This will switch the storefront mode to <strong>NORMAL</strong> and open the store to public shoppers. No customer records, orders, inventory, or discounts will be deleted or altered.
            </p>

            {error && (
              <div style={{ color: '#FF5252', fontSize: '12px', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #444444',
                  color: '#CCCCCC',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleConfirmLaunch}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FFFFFF',
                  border: 'none',
                  color: '#000000',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                <span>GO LIVE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
