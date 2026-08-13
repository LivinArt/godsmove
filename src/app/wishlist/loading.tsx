import React from 'react';

export default function WishlistLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        color: '#ffffff',
        paddingTop: 'var(--nav-height, 96px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          borderRadius: '9999px',
          border: '1px solid rgba(200, 164, 106, 0.2)',
          backgroundColor: 'rgba(200, 164, 106, 0.04)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#c8a46a',
            boxShadow: '0 0 10px rgba(200, 164, 106, 0.8)',
            animation: 'pulse 1.2s infinite ease-in-out',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c8a46a',
          }}
        >
          CURATING SAVED PIECES...
        </span>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
