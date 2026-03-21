import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--gray-200)',
    padding: '0 var(--space-6)',
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: 'var(--green-700)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1.2rem',
    color: 'var(--green-900)',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
};

const linkStyle = ({ isActive }) => ({
  padding: '6px 16px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 500,
  fontSize: '0.92rem',
  textDecoration: 'none',
  color: isActive ? 'var(--green-800)' : 'var(--gray-600)',
  background: isActive ? 'var(--green-100)' : 'transparent',
  transition: 'all 0.15s',
});

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav style={{
      ...styles.nav,
      boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
    }}>
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logo} onClick={() => navigate('/')}>
          <div style={styles.logoIcon}>🌿</div>
          <span style={styles.logoText}>AgriAI Assist</span>
        </div>

        {/* Nav links */}
        <div style={styles.links}>
          <NavLink to="/"          style={linkStyle} end>Home</NavLink>
          <NavLink to="/detection" style={linkStyle}>Disease Detection</NavLink>
          <NavLink to="/yield"     style={linkStyle}>Yield Prediction</NavLink>
        </div>
      </div>
    </nav>
  );
}
