/**
 * YieldPrediction — environmental parameter form → AI yield forecast.
 *
 * Integration flow:
 *   User fills sliders/inputs → clicks Predict → predictYield() called →
 *   loading state → result panel shows predicted yield + confidence
 */

import React, { useState, useCallback } from "react";
import { predictYield } from "../services/api";
import ConfidenceBar from "../components/ConfidenceBar";

// ---------------------------------------------------------------------------
// Form field configuration — single source of truth
// ---------------------------------------------------------------------------

const CROP_TYPES = [
  "Tomato", "Wheat", "Rice", "Maize", "Soybean",
  "Cotton", "Potato", "Sugarcane",
];

const SOIL_TYPES = [
  "Loamy", "Sandy", "Clay", "Silty", "Peaty", "Chalky", "Sandy Loam",
];

const FIELD_CONFIG = [
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    icon: "thermometer",
    min: 0, max: 50, step: 0.5, defaultValue: 25,
    hint: "Average growing-season temperature",
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    icon: "water_drop",
    min: 0, max: 100, step: 1, defaultValue: 60,
    hint: "Average relative humidity",
  },
  {
    key: "rainfall",
    label: "Rainfall",
    unit: "mm",
    icon: "grain",
    min: 0, max: 500, step: 5, defaultValue: 200,
    hint: "Seasonal total rainfall",
  },
];

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

const DEFAULT_FORM = {
  temperature: 25,
  humidity: 60,
  rainfall: 200,
  soil_type: "Loamy",
  crop_type: "Tomato",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A labelled range slider with live value readout */
function SliderField({ config, value, onChange, disabled }) {
  const { key, label, unit, icon, min, max, step, hint } = config;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-emerald-700">
            {icon}
          </span>
          <label htmlFor={key} className="text-sm font-semibold text-emerald-900">
            {label}
          </label>
        </div>
        <span className="text-sm font-black text-emerald-900 tabular-nums">
          {value}{unit}
        </span>
      </div>

      {/* Native range styled via appearance-none + custom thumb */}
      <input
        id={key}
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(key, parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50"
        style={{
          background: `linear-gradient(to right, #174413 0%, #2f5c28 ${pct}%, #e6e9e7 ${pct}%, #e6e9e7 100%)`,
        }}
      />

      <p className="text-xs text-on-surface-variant">{hint}</p>
    </div>
  );
}

/** Select dropdown styled to match the design system */
function SelectField({ id, label, icon, value, options, onChange, disabled }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-emerald-700">{icon}</span>
        <label htmlFor={id} className="text-sm font-semibold text-emerald-900">{label}</label>
      </div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        disabled={disabled}
        className="w-full bg-surface-container-low text-emerald-900 font-medium text-sm rounded-xl px-4 py-3 border-0 outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

/** The result card shown after a successful prediction */
function YieldResultCard({ result }) {
  return (
    <div className="space-y-6">
      {/* Headline yield value */}
      <div className="text-center py-6 bg-primary-container/10 rounded-xl">
        {result._isFallback && (
          <span className="inline-block mb-3 px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full tracking-widest">
            Demo data
          </span>
        )}
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Predicted Yield
        </p>
        <p className="text-5xl font-black text-emerald-900 tracking-tighter leading-none mb-1">
          {result.predicted_yield}
        </p>
      </div>

      <ConfidenceBar value={result.confidence} label="Model Confidence" />

      {/* Supplementary insight */}
      <div className="bg-secondary-container rounded-xl p-5 flex items-start gap-3">
        <span className="material-symbols-outlined text-on-secondary-container shrink-0 mt-0.5">
          lightbulb
        </span>
        <div>
          <p className="text-sm font-bold text-on-secondary-container mb-1">
            AI Strategy
          </p>
          <p className="text-xs text-on-secondary-container/80 leading-relaxed">
            Based on your inputs, consider optimising irrigation timing and
            applying nitrogen-rich fertiliser 3 weeks before harvest to
            maximise your yield potential.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * @param {{ toast: { success, error, info } }} props
 */
export default function YieldPrediction({ toast }) {
  const [form, setForm]         = useState(DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult]     = useState(null);

  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear previous result when user changes inputs
    setResult(null);
  }, []);

  const handlePredict = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setResult(null);

    try {
      const data = await predictYield(form);
      setResult(data);

      if (data._isFallback) {
        toast?.error("Backend unavailable — showing demo forecast.");
      } else {
        toast?.success(`Yield forecast complete: ${data.predicted_yield}`);
      }
    } catch (err) {
      toast?.error("Prediction failed. Please try again.");
      console.error("[YieldPrediction] Unhandled error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [form, isLoading, toast]);

  const handleReset = useCallback(() => {
    setForm(DEFAULT_FORM);
    setResult(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-emerald-900 tracking-tighter mb-2">
          Yield Prediction
        </h1>
        <p className="text-on-surface-variant text-lg">
          Enter your field conditions and let the AI forecast your harvest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Left: inputs (3/5) ── */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl p-7 shadow-[0_40px_40px_-15px_rgba(23,68,19,0.05)] space-y-7">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-emerald-700">tune</span>
            <h2 className="font-bold text-emerald-900 text-base uppercase tracking-wider">
              Environmental Inputs
            </h2>
          </div>

          {/* Sliders */}
          {FIELD_CONFIG.map((cfg) => (
            <SliderField
              key={cfg.key}
              config={cfg}
              value={form[cfg.key]}
              onChange={handleChange}
              disabled={isLoading}
            />
          ))}

          {/* Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <SelectField
              id="soil_type"
              label="Soil Type"
              icon="layers"
              value={form.soil_type}
              options={SOIL_TYPES}
              onChange={handleChange}
              disabled={isLoading}
            />
            <SelectField
              id="crop_type"
              label="Crop Type"
              icon="grass"
              value={form.crop_type}
              options={CROP_TYPES}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePredict}
              disabled={isLoading}
              className={`
                flex-1 flex items-center justify-center gap-3 px-6 py-4
                font-headline font-bold rounded-xl transition-all duration-300
                ${!isLoading
                  ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                  : "bg-surface-container text-on-surface-variant cursor-not-allowed"
                }
              `}
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running model…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">trending_up</span>
                  Predict Yield
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={isLoading}
              className="px-5 py-4 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-semibold"
              aria-label="Reset to defaults"
              title="Reset to defaults"
            >
              <span className="material-symbols-outlined">restart_alt</span>
            </button>
          </div>
        </div>

        {/* ── Right: result panel (2/5) ── */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-7 shadow-[0_40px_40px_-15px_rgba(23,68,19,0.05)] flex flex-col justify-center min-h-[300px]">
          {isLoading && (
            <div className="text-center space-y-4">
              {/* Organic pulsing loading indicator matching design spec */}
              <div className="flex items-center justify-center gap-1.5 my-4">
                {["bg-primary", "bg-secondary", "bg-primary-container"].map(
                  (color, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${color} animate-ping`}
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  )
                )}
              </div>
              <p className="text-sm font-semibold text-on-surface-variant">
                Model ready for inference…
              </p>
            </div>
          )}

          {!isLoading && result && <YieldResultCard result={result} />}

          {!isLoading && !result && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-outline-variant block mb-3">
                bar_chart
              </span>
              <p className="text-on-surface-variant font-medium">
                Configure your field inputs and click Predict Yield
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
