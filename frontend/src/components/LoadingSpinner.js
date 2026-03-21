import React from 'react';

export default function LoadingSpinner({ text = 'Analysing…', size = 32 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '2rem 0' }}>
      <div style={{
        width: size,
        height: size,
        border: '3px solid var(--green-200)',
        borderTopColor: 'var(--green-700)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ color: 'var(--gray-600)', fontSize: '0.92rem', fontWeight: 500 }}>{text}</span>
    </div>
  );
}
