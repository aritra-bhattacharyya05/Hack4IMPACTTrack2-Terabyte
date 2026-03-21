/**
 * services/api.js
 * All AgriAI backend calls — disease detection, remedy, yield prediction.
 */
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ── Request / response logging ─────────────────────────────────────
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────────────────────────
// DISEASE DETECTION
// ─────────────────────────────────────────────────────────────────

/**
 * Upload a leaf image → get disease + confidence + top-3
 * @param {File} imageFile
 * @returns {{ disease, confidence, top_3 }}
 */
export async function predictDisease(imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);

  const { data } = await api.post('/api/predict-disease', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * Get GenAI remedy for a detected disease
 * @param {string} disease
 * @param {string} confidence
 * @returns {{ remedy: string[] }}
 */
export async function getRemedy(disease, confidence = 'N/A') {
  const { data } = await api.post('/api/get-remedy', { disease, confidence });
  return data;
}

// ─────────────────────────────────────────────────────────────────
// YIELD PREDICTION
// ─────────────────────────────────────────────────────────────────

/**
 * Predict crop yield from farm inputs
 * @param {{ crop, state, season, area, annual_rainfall, fertilizer, pesticide }} inputs
 * @returns {{ predicted_yield, source }}
 */
export async function predictYield(inputs) {
  const { data } = await api.post('/api/predict-yield', inputs);
  return data;
}

// ─────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────
export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}

// ─────────────────────────────────────────────────────────────────
// DEMO FALLBACKS (used when API is unavailable)
// ─────────────────────────────────────────────────────────────────
export const DEMO_DISEASE = {
  disease: 'Tomato___Late_blight',
  confidence: 0.87,
  top_3: [
    { disease: 'Tomato___Late_blight',       confidence: 0.87 },
    { disease: 'Tomato___Early_blight',       confidence: 0.09 },
    { disease: 'Tomato___Septoria_leaf_spot', confidence: 0.04 },
  ],
};

export const DEMO_REMEDY = {
  remedy: [
    '1. Severity: High — act within 24 hours to prevent crop loss.',
    '2. Remove all visibly infected leaves and burn or bury them immediately.',
    '3. Spray Mancozeb (2g/L water) on all plants every 7 days for 3 weeks.',
    '4. Avoid overhead watering; water at the base early morning only.',
    '5. If >30% of crop is affected, consult your agricultural extension officer.',
  ],
};

export const DEMO_YIELD = {
  predicted_yield: '3.42 Tonnes/Hectare',
  source: 'demo',
};
