'use client';

import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';

export interface SizeChartEntry {
  size: string;             // Combined size e.g. "L-38" or "L"
  alphaSize?: string | null;
  numericSize?: string | null;
  measurements?: Record<string, string> | null;
}

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  entries: SizeChartEntry[];
}

export default function SizeChartModal({
  isOpen,
  onClose,
  productName,
  entries,
}: SizeChartModalProps) {
  const [unit, setUnit] = useState<'INCHES' | 'CM'>('INCHES');

  if (!isOpen || !entries || entries.length === 0) return null;

  // Extract all unique measurement keys across all entries
  const allKeysSet = new Set<string>();
  entries.forEach(e => {
    if (e.measurements) {
      Object.keys(e.measurements).forEach(k => {
        if (e.measurements![k]) allKeysSet.add(k);
      });
    }
  });
  const measurementKeys = Array.from(allKeysSet);

  // Helper to convert inches to cm if unit === 'CM'
  const formatVal = (val?: string | null) => {
    if (!val) return '—';
    if (unit === 'CM') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        return `${(num * 2.54).toFixed(1)} cm`;
      }
    }
    return val.includes('"') || val.includes('in') ? val : `${val}"`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0f172a',
          border: '1px solid rgba(200, 164, 106, 0.3)',
          borderRadius: '16px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(200, 164, 106, 0.1) 0%, transparent 100%)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c8a46a', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
              <Ruler size={14} />
              GARMENT SPECIFICATION CHART
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {productName} — Size Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Unit Selector Toggle Bar */}
        <div style={{
          padding: '12px 28px',
          background: '#1e293b',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            All measurements shown in <strong>{unit === 'INCHES' ? 'Inches (in)' : 'Centimeters (cm)'}</strong>
          </span>
          <div style={{ display: 'flex', background: '#0f172a', padding: '3px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={() => setUnit('INCHES')}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                background: unit === 'INCHES' ? '#c8a46a' : 'transparent',
                color: unit === 'INCHES' ? '#000000' : '#9ca3af',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              INCHES
            </button>
            <button
              onClick={() => setUnit('CM')}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                background: unit === 'CM' ? '#c8a46a' : 'transparent',
                color: unit === 'CM' ? '#000000' : '#9ca3af',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              CM
            </button>
          </div>
        </div>

        {/* Scrollable Table Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(200, 164, 106, 0.3)' }}>
                <th style={{ padding: '12px', color: '#c8a46a', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  SIZE
                </th>
                {measurementKeys.map(k => (
                  <th key={k} style={{ padding: '12px', color: '#9ca3af', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <td style={{ padding: '14px 12px', color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>
                    {entry.size}
                  </td>
                  {measurementKeys.map(k => (
                    <td key={k} style={{ padding: '14px 12px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}>
                      {formatVal(entry.measurements?.[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Guidance Note */}
        <div style={{
          padding: '16px 28px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
        }}>
          💡 <strong>Fitting Note:</strong> Measure around the fullest part of your chest and waist. For relaxed fits, choose your true size.
        </div>
      </div>
    </div>
  );
}
