/**
 * ConfidenceBar — animated AI confidence progress indicator.
 * Matches the "Digital Arboretum" design system spec.
 */

import React from "react";

/**
 * @param {{ value: number, label?: string }} props
 *   value — 0 to 1 (e.g. 0.92 → 92%)
 */
export default function ConfidenceBar({ value, label = "AI Confidence" }) {
  const pct = Math.round(value * 100);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
        <span className="text-sm font-black text-emerald-900">{pct}%</span>
      </div>
      {/* Track */}
      <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
        {/* Fill — gradient with glow on leading edge */}
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          {/* Leading-edge glow */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-fixed blur-sm opacity-80" />
        </div>
      </div>
    </div>
  );
}
