import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { predictYield, DEMO_YIELD } from '../services/api';

const CROPS = [
  'Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Tomato', 'Potato',
  'Onion', 'Soybean', 'Groundnut', 'Sunflower', 'Jowar', 'Bajra', 'Arhar/Tur',
];

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Goa', 'Puducherry',
];

const SEASONS = ['Kharif', 'Rabi', 'Whole Year', 'Zaid', 'Summer', 'Winter'];

const initialForm = {
  crop: 'Wheat',
  state: 'Punjab',
  season: 'Rabi',
  area: '',
  annual_rainfall: '',
  fertilizer: '',
  pesticide: '',
};

function Field({ label, name, type = 'text', value, onChange, options, hint, placeholder }) {
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.95rem',
    background: 'var(--white)',
    transition: 'border-color 0.15s',
    outline: 'none',
    appearance: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: 'var(--gray-400)', marginLeft: 6 }}>({hint})</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--green-600)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || ''}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--green-600)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
        />
      )}
    </div>
  );
}

export default function Yield() {
  const [form,    setForm]    = useState(initialForm);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.area || !form.annual_rainfall || !form.fertilizer || !form.pesticide) {
      setError('Please fill in all numeric fields.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await predictYield({
        crop:            form.crop,
        state:           form.state,
        season:          form.season,
        area:            parseFloat(form.area),
        annual_rainfall: parseFloat(form.annual_rainfall),
        fertilizer:      parseFloat(form.fertilizer),
        pesticide:       parseFloat(form.pesticide),
      });
      setResult(data);
    } catch {
      setResult(DEMO_YIELD);
      setError('⚠️  Backend unreachable — showing estimated result.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setResult(null);
    setError(null);
  };

  return (
    <div style={{ padding: 'var(--space-12) var(--space-6)' }}>
      <div className="container" style={{ maxWidth: 900 }}>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="badge badge-amber" style={{ marginBottom: 'var(--space-3)' }}>Yield Prediction</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--green-900)', marginBottom: 'var(--space-3)' }}>
            Crop Yield Predictor
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem', maxWidth: 560 }}>
            Enter your farm details to get an AI-powered crop yield estimate for the upcoming season.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>

          {/* Left: Form */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: 'var(--space-6)' }}>
              Farm Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <Field label="Crop" name="crop" value={form.crop} onChange={handleChange} options={CROPS} />
                <Field label="Season" name="season" value={form.season} onChange={handleChange} options={SEASONS} />
              </div>
              <Field label="State" name="state" value={form.state} onChange={handleChange} options={STATES} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <Field label="Farm Area" name="area" type="number" value={form.area} onChange={handleChange} hint="hectares" placeholder="e.g. 2.5" />
                <Field label="Annual Rainfall" name="annual_rainfall" type="number" value={form.annual_rainfall} onChange={handleChange} hint="mm" placeholder="e.g. 900" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <Field label="Fertilizer Used" name="fertilizer" type="number" value={form.fertilizer} onChange={handleChange} hint="kg" placeholder="e.g. 150" />
                <Field label="Pesticide Used" name="pesticide" type="number" value={form.pesticide} onChange={handleChange} hint="kg" placeholder="e.g. 3" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button
                className="btn btn-amber"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} /> Predicting…</>
                ) : (
                  '📊 Predict Yield'
                )}
              </button>
              <button className="btn btn-outline" onClick={handleReset} disabled={loading}>
                Reset
              </button>
            </div>
          </div>

          {/* Right: Result */}
          <div>
            {error && (
              <div style={{ padding: 'var(--space-4)', background: 'var(--amber-100)', border: '1px solid var(--amber-400)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: '0.88rem', color: 'var(--amber-600)' }}>
                {error}
              </div>
            )}

            {loading && <div className="card"><LoadingSpinner text="Running yield model…" /></div>}

            {!loading && !result && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-8)', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🌾</div>
                <p style={{ fontWeight: 500 }}>Fill in your farm details</p>
                <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Yield estimate will appear here</p>
              </div>
            )}

            {!loading && result && (
              <div className="fade-up">
                {/* Main result */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--green-900), var(--green-700))',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-8)',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: 'var(--space-6)',
                }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Predicted Yield
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--green-200)', marginBottom: 8 }}>
                    {result.predicted_yield}
                  </div>
                  {result.source === 'demo' && (
                    <span className="badge badge-amber" style={{ margin: '0 auto' }}>Demo Estimate</span>
                  )}
                </div>

                {/* Input summary */}
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }}>
                    Your Inputs
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    {[
                      ['Crop', form.crop],
                      ['State', form.state],
                      ['Season', form.season],
                      ['Area', `${form.area} ha`],
                      ['Rainfall', `${form.annual_rainfall} mm`],
                      ['Fertilizer', `${form.fertilizer} kg`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                        <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
