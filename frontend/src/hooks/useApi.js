/**
 * hooks/useApi.js
 * Reusable hook for API calls with loading / error / data state.
 */
import { useState, useCallback } from 'react';

/**
 * @param {Function} apiFn  — the API function to call
 * @param {any}      fallback — demo data to return on error
 */
export function useApi(apiFn, fallback = null) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Something went wrong';
      setError(msg);
      if (fallback) {
        setData(fallback);
        return fallback;
      }
    } finally {
      setLoading(false);
    }
  }, [apiFn, fallback]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
