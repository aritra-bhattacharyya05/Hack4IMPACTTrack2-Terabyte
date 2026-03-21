import React from 'react';

function confidenceBadge(conf) {
  const pct = typeof conf === 'number' ? conf : parseFloat(conf);
  if (pct >= 0.8) return { label: 'High Confidence', cls: 'badge-green' };
  if (pct >= 0.5) return { label: 'Medium Confidence', cls: 'badge-amber' };
  return { label: 'Low Confidence', cls: 'badge-red' };
}

function formatDisease(name) {
  return name.replace(/___/g, ' — ').replace(/_/g, ' ');
}

function ConfidenceBar({ value }) {
  const pct = Math.round((typeof value === 'number' ? value : parseFloat(value)) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct >= 80 ? 'var(--green-600)' : pct >= 50 ? 'var(--amber-400)' : 'var(--red-600)',
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-600)', minWidth: 36 }}>
        {pct}%
      </span>
    </div>
  );
}

export default function DiseaseResult({ detection, remedy, remedyLoading }) {
  if (!detection) return null;

  const badge = confidenceBadge(detection.confidence);

  return (
    <div className="fade-up">
      {/* Primary result */}
      <div style={{
        background: 'var(--green-900)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        color: 'white',
        marginBottom: 'var(--space-6)',
      }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Detected Disease
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 12, lineHeight: 1.3 }}>
          {formatDisease(detection.disease)}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
          <span style={{ opacity: 0.7, fontSize: '0.88rem' }}>
            {Math.round(detection.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      {/* Top-3 predictions */}
      {detection.top_3?.length > 1 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }}>
            Top Predictions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {detection.top_3.map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'var(--green-800)' : 'var(--gray-600)' }}>
                    {formatDisease(p.disease)}
                  </span>
                </div>
                <ConfidenceBar value={p.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remedy */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--green-900)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          🌱 Treatment Plan
        </h3>
        {remedyLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--space-4) 0' }}>
            <div className="spinner" />
            <span style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>Generating AI remedy…</span>
          </div>
        ) : remedy?.remedy ? (
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {remedy.remedy.map((step, i) => (
              <li key={i} style={{ fontSize: '0.93rem', color: 'var(--gray-700)', lineHeight: 1.65 }}>
                {step.replace(/^\d+\.\s*/, '')}
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>No remedy data available.</p>
        )}
      </div>
    </div>
  );
}
