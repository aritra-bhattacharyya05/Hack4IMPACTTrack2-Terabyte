/**
 * AgriAI Assist — API Service Layer
 * Centralised API communication with retry logic, fallback data,
 * and consistent error handling for demo reliability.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Max retry attempts for transient failures
const MAX_RETRIES = 2;
// Delay between retries (ms)
const RETRY_DELAY_MS = 800;

// ---------------------------------------------------------------------------
// Demo / fallback data — UI never breaks even if backend is unreachable
// ---------------------------------------------------------------------------

export const FALLBACK_DISEASE_RESULT = {
  disease: "Tomato Early Blight",
  confidence: 0.92,
  treatment: [
    "Apply copper-based fungicide every 7–10 days",
    "Remove and destroy all infected leaves immediately",
    "Avoid overhead irrigation to reduce leaf wetness",
    "Ensure proper plant spacing for air circulation",
  ],
  heatmap_url: null, // no static asset in fallback
  _isFallback: true,
};

export const FALLBACK_YIELD_RESULT = {
  predicted_yield: "3.4 Tonnes/Hectare",
  confidence: 0.91,
  _isFallback: true,
};

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Pauses execution for a given number of milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Constructs the full URL for a backend-served static asset.
 * @param {string|null} path  e.g. "/static/heatmap.jpg"
 * @returns {string|null}
 */
export const buildAssetUrl = (path) =>
  path ? `${API_BASE_URL}${path}` : null;

// ---------------------------------------------------------------------------
// Core fetch wrapper with retry logic
// ---------------------------------------------------------------------------

/**
 * Fetches a resource with automatic retries on network-level failures.
 *
 * @param {string}  url         Full request URL
 * @param {object}  options     Standard fetch options
 * @param {number}  retries     Remaining retry attempts
 * @returns {Promise<Response>}
 * @throws  {Error}             After all retries are exhausted
 */
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  try {
    const response = await fetch(url, options);

    // Treat 5xx as retryable; 4xx are client errors — don't retry
    if (response.status >= 500 && retries > 0) {
      console.warn(
        `[AgriAI] Server error ${response.status}. Retrying… (${retries} left)`
      );
      await sleep(RETRY_DELAY_MS);
      return fetchWithRetry(url, options, retries - 1);
    }

    return response;
  } catch (networkError) {
    if (retries > 0) {
      console.warn(
        `[AgriAI] Network error. Retrying… (${retries} left)`,
        networkError.message
      );
      await sleep(RETRY_DELAY_MS);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw networkError;
  }
}

// ---------------------------------------------------------------------------
// Disease Detection API
// ---------------------------------------------------------------------------

/**
 * Sends a leaf/crop image to the backend for disease analysis.
 *
 * @param {File}    imageFile         The raw File object from an <input type="file">
 * @param {object}  [opts]
 * @param {boolean} [opts.useFallback=true]  Return mock data if request fails
 * @returns {Promise<{
 *   disease: string,
 *   confidence: number,
 *   treatment: string[],
 *   heatmap_url: string|null,
 *   heatmap_full_url: string|null,
 *   _isFallback?: boolean
 * }>}
 */
export async function predictDisease(imageFile, { useFallback = true } = {}) {
  const formData = new FormData();
  // Key must match the FastAPI parameter name: `file`
  formData.append("file", imageFile);

  console.log(`[AgriAI] POST /predict-disease — file: ${imageFile.name}`);

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/predict-disease`, {
      method: "POST",
      // Do NOT set Content-Type manually — the browser sets the correct
      // multipart/form-data boundary when you pass a FormData body.
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Prediction failed (HTTP ${response.status}): ${errorText}`
      );
    }

    const data = await response.json();
    console.log("[AgriAI] /predict-disease response:", data);

    // Validate expected shape
    if (!data.disease || typeof data.confidence !== "number") {
      throw new Error("Unexpected response shape from /predict-disease");
    }

    return {
      ...data,
      // Provide the absolute URL so components don't need to know the base
      heatmap_full_url: buildAssetUrl(data.heatmap_url),
    };
  } catch (error) {
    console.error("[AgriAI] /predict-disease error:", error.message);

    if (useFallback) {
      console.warn("[AgriAI] Using fallback disease data for demo continuity.");
      return FALLBACK_DISEASE_RESULT;
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Yield Prediction API
// ---------------------------------------------------------------------------

/**
 * Sends environmental parameters to the backend for yield forecasting.
 *
 * @param {{
 *   temperature: number,
 *   humidity:    number,
 *   rainfall:    number,
 *   soil_type:   string,
 *   crop_type:   string
 * }} params
 * @param {object}  [opts]
 * @param {boolean} [opts.useFallback=true]
 * @returns {Promise<{
 *   predicted_yield: string,
 *   confidence: number,
 *   _isFallback?: boolean
 * }>}
 */
export async function predictYield(params, { useFallback = true } = {}) {
  console.log("[AgriAI] POST /predict-yield — params:", params);

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/predict-yield`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Yield prediction failed (HTTP ${response.status}): ${errorText}`
      );
    }

    const data = await response.json();
    console.log("[AgriAI] /predict-yield response:", data);

    if (!data.predicted_yield || typeof data.confidence !== "number") {
      throw new Error("Unexpected response shape from /predict-yield");
    }

    return data;
  } catch (error) {
    console.error("[AgriAI] /predict-yield error:", error.message);

    if (useFallback) {
      console.warn("[AgriAI] Using fallback yield data for demo continuity.");
      return FALLBACK_YIELD_RESULT;
    }

    throw error;
  }
}
