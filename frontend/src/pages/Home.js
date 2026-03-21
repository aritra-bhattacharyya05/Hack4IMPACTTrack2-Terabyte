import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: '🔬',
    title: 'Disease Detection',
    desc: 'Upload a leaf photo. Our ResNet50 model identifies 38 crop diseases with high accuracy.',
    cta: 'Try Detection',
    path: '/detection',
    accent: 'var(--green-700)',
  },
  {
    icon: '📊',
    title: 'Yield Prediction',
    desc: 'Enter your farm data — rainfall, fertilizer, area — and get a predicted harvest estimate.',
    cta: 'Predict Yield',
    path: '/yield',
    accent: 'var(--amber-600)',
  },
  {
    icon: '🤖',
    title: 'AI Treatment Plans',
    desc: 'Every detected disease comes with a structured, plain-language treatment plan from GenAI.',
    cta: 'Learn More',
    path: '/detection',
    accent: 'var(--soil-700)',
  },
];

const stats = [
  { value: '38',    label: 'Diseases Detected' },
  { value: '87%+',  label: 'Model Accuracy' },
  { value: '14',    label: 'Crop Types' },
  { value: '19k+',  label: 'Training Samples' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--green-900) 0%, var(--green-800) 60%, var(--green-700) 100%)',
        color: 'white',
        padding: 'var(--space-16) var(--space-6)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div className="container" style={{ position: 'relative', textAlign: 'center', maxWidth: 740 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-full)', padding: '6px 18px', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 'var(--space-6)', textTransform: 'uppercase' }}>
            🌾 Powered by ResNet50 + AIPipe GenAI
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: 1.15, marginBottom: 'var(--space-6)' }}>
            AI Assistant for<br />
            <span style={{ color: 'var(--green-200)' }}>Indian Farmers</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.82, lineHeight: 1.75, marginBottom: 'var(--space-8)', maxWidth: 560, margin: '0 auto var(--space-8)' }}>
            Detect crop diseases from a photo. Predict your harvest yield. Get plain-language treatment plans — all powered by AI.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ background: 'white', color: 'var(--green-800)', fontSize: '1rem', padding: '14px 28px' }}
              onClick={() => navigate('/detection')}>
              🔬 Detect Disease
            </button>
            <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', fontSize: '1rem', padding: '14px 28px' }}
              onClick={() => navigate('/yield')}>
              📊 Predict Yield
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <section style={{ background: 'var(--green-800)', padding: 'var(--space-6)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--green-200)' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-16) var(--space-6)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textAlign: 'center', color: 'var(--green-900)', marginBottom: 'var(--space-12)' }}>
            What AgriAI Can Do
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            {features.map((f) => (
              <div key={f.title} className="card fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ fontSize: 40 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gray-900)' }}>{f.title}</h3>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.93rem', lineHeight: 1.7, flex: 1 }}>{f.desc}</p>
                <button className="btn btn-outline" onClick={() => navigate(f.path)}
                  style={{ borderColor: f.accent, color: f.accent, alignSelf: 'flex-start' }}>
                  {f.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section style={{ background: 'var(--green-50)', padding: 'var(--space-16) var(--space-6)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textAlign: 'center', color: 'var(--green-900)', marginBottom: 'var(--space-12)' }}>
            How It Works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {[
              ['1', '📸', 'Upload a Photo', 'Take a clear photo of an infected leaf and upload it to the detection tool.'],
              ['2', '🧠', 'AI Analysis', 'Our ResNet50 model analyses the image and identifies the disease with confidence score.'],
              ['3', '💊', 'Get Treatment', 'AIPipe GenAI generates a practical, step-by-step treatment plan for the farmer.'],
            ].map(([num, icon, title, desc]) => (
              <div key={num} style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green-700)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>{num}</div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 6 }}>
                    {icon} {title}
                  </h4>
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.93rem', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-16) var(--space-6)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--green-900)', marginBottom: 'var(--space-4)' }}>
            Ready to protect your crops?
          </h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-8)', fontSize: '1rem' }}>
            Upload your first leaf image and get results in seconds.
          </p>
          <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }} onClick={() => navigate('/detection')}>
            Start Detecting Now →
          </button>
        </div>
      </section>
    </div>
  );
}
