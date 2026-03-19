/**
 * Analytics — platform-level insights and prediction history.
 */

import React, { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BAR_DATA = [65, 78, 55, 90, 72, 48, 83];

const DISEASE_DIST = [
  { label: "Early Blight",  pct: 38, color: "bg-primary" },
  { label: "Late Blight",   pct: 24, color: "bg-secondary" },
  { label: "Wheat Rust",    pct: 18, color: "bg-primary-container" },
  { label: "Rice Blast",    pct: 12, color: "bg-secondary-container" },
  { label: "Other",         pct: 8,  color: "bg-surface-container-high" },
];

const RECENT = [
  { crop: "Tomato",  disease: "Early Blight",        conf: 0.92, status: "alert",   time: "2h ago" },
  { crop: "Wheat",   disease: "Healthy",              conf: 0.96, status: "ok",      time: "5h ago" },
  { crop: "Rice",    disease: "Rice Blast",           conf: 0.88, status: "alert",   time: "Yesterday" },
  { crop: "Maize",   disease: "Healthy",              conf: 0.94, status: "ok",      time: "Yesterday" },
  { crop: "Soybean", disease: "Bacterial Leaf Spot",  conf: 0.81, status: "warning", time: "2 days ago" },
];

const STATUS_BADGE = {
  alert:   "bg-error-container text-on-error-container",
  warning: "bg-secondary-container text-on-secondary-container",
  ok:      "bg-primary-container/20 text-primary",
};

export default function Analytics() {
  const [activeDay, setActiveDay] = useState(3);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-emerald-900 tracking-tighter mb-2">
          Platform Analytics &amp; Insights
        </h1>
        <p className="text-on-surface-variant text-lg">
          Comprehensive overview of your digital arboretum's health and predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Predictions over time */}
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_40px_40px_-15px_rgba(23,68,19,0.06)]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-emerald-900">
                Predictions Over Time
              </h3>
              <p className="text-on-surface-variant text-sm mt-0.5">
                Daily analysis frequency
              </p>
            </div>
            <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">
              trending_up
            </span>
          </div>

          {/* Bar chart */}
          <div className="h-40 flex items-end gap-3 pb-2 px-1 mt-8">
            {BAR_DATA.map((h, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`
                  flex-1 rounded-t-lg transition-all duration-300
                  ${i === activeDay
                    ? "bg-primary shadow-lg shadow-primary/30 relative"
                    : "bg-secondary-container/40 hover:bg-secondary-container"
                  }
                `}
                style={{ height: `${h}%` }}
                title={`${DAYS[i]}: ${h} predictions`}
              >
                {i === activeDay && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                    {h}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest px-1">
            {DAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        {/* Disease distribution */}
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_40px_40px_-15px_rgba(23,68,19,0.06)]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold text-emerald-900">
                Disease Distribution
              </h3>
              <p className="text-on-surface-variant text-sm mt-0.5">
                Last 30 days
              </p>
            </div>
            <span className="material-symbols-outlined text-secondary bg-secondary/5 p-2 rounded-lg">
              donut_small
            </span>
          </div>

          {/* Donut ring (CSS border trick) */}
          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
            <div className="relative w-40 h-40 shrink-0">
              <div className="absolute inset-0 rounded-full border-[24px] border-surface-container-low" />
              <div
                className="absolute inset-0 rounded-full border-[24px] border-primary border-r-transparent border-b-transparent"
                style={{ transform: "rotate(-45deg)" }}
              />
              <div
                className="absolute inset-0 rounded-full border-[24px] border-secondary border-t-transparent border-l-transparent"
                style={{ transform: "rotate(-45deg)" }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-primary leading-none">84%</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">
                  Accuracy
                </span>
              </div>
            </div>

            <div className="space-y-3 w-full max-w-xs">
              {DISEASE_DIST.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-xs font-semibold text-emerald-900 mb-1">
                    <span>{d.label}</span>
                    <span>{d.pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full transition-all duration-700`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent predictions table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_40px_40px_-15px_rgba(23,68,19,0.06)] overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center">
          <h3 className="text-lg font-bold text-emerald-900">
            Recent Predictions Activity
          </h3>
          <button className="text-sm font-bold text-emerald-700 hover:underline">
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-8 py-4">Crop</th>
                <th className="text-left px-4 py-4">Disease Detected</th>
                <th className="text-left px-4 py-4">Confidence</th>
                <th className="text-left px-4 py-4">Status</th>
                <th className="text-left px-4 py-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map((r, i) => (
                <tr
                  key={i}
                  className="border-t border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="px-8 py-4 font-semibold text-emerald-900">
                    {r.crop}
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant">{r.disease}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{ width: `${r.conf * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-emerald-900 tabular-nums">
                        {Math.round(r.conf * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_BADGE[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant text-xs">
                    {r.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
