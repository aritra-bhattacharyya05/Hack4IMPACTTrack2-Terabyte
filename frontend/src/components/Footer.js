import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{
      background: 'var(--green-900)',
      color: 'var(--green-200)',
      padding: 'var(--space-12) var(--space-6) var(--space-8)',
      marginTop: 'auto',
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'white', marginBottom: 8 }}>🌿 AgriAI Assist</div>
          <p style={{ fontSize: '0.88rem', maxWidth: 280, opacity: 0.75, lineHeight: 1.7 }}>
            AI-powered crop disease detection and yield prediction to help farmers make smarter decisions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'white', marginBottom: 12, fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tools</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Disease Detection', '/detection'], ['Yield Prediction', '/yield']].map(([label, path]) => (
                <button key={path} onClick={() => navigate(path)} style={{ background: 'none', border: 'none', color: 'var(--green-200)', cursor: 'pointer', textAlign: 'left', fontSize: '0.88rem', opacity: 0.8, padding: 0 }}
                  onMouseEnter={e => e.target.style.opacity = 1}
                  onMouseLeave={e => e.target.style.opacity = 0.8}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'white', marginBottom: 12, fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Built With</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.88rem', opacity: 0.8 }}>
              <span>ResNet50 (PyTorch)</span>
              <span>FastAPI + AIPipe</span>
              <span>Hugging Face</span>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', fontSize: '0.82rem', opacity: 0.55 }}>
        © 2024 AgriAI Assist · Built for IITM Hackathon
      </div>
    </footer>
  );
}
