/**
 * Dashboard — AgriAI Assist home screen.
 * Shows KPI stats, recent insights, weather correlation mini-chart,
 * and the AI recommendation callout.
 */

import React from "react";
import { useNavigate } from "react-router-dom";

const STATS = [
  {
    icon: "data_exploration",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-900",
    badge: "+12% vs last month",
    label: "Total Predictions",
    value: "1,234",
  },
  {
    icon: "verified",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    badge: null,
    label: "AI Accuracy",
    value: "98.2%",
    bar: true,
  },
  {
    icon: "potted_plant",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-900",
    badge: null,
    label: "Crops Analysed",
    value: "15+",
    avatars: ["W", "M", "R"],
  },
];

const INSIGHTS = [
  {
    img: "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c10?w=80&q=70",
    alt: "Tomato leaf",
    title: "Tomato Leaf Analysis",
    subtitle: "Early Blight detected in Sector 4",
    badge: "High Alert",
    badgeClass: "bg-error-container text-on-error-container",
    time: "2 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=80&q=70",
    alt: "Wheat field",
    title: "Wheat Yield Projection",
    subtitle: "Expected +15% increase vs last season",
    badge: "Optimal",
    badgeClass: "bg-primary-container text-white",
    time: "Yesterday",
  },
];

const BAR_HEIGHTS = ["40%", "60%", "80%", "100%", "50%"];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20">
      {/* Hero */}
      <section className="relative mb-12 rounded-xl overflow-hidden min-h-[380px] flex items-center bg-primary-container">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=70"
            alt="Agricultural fields"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 px-8 md:px-16 py-12 max-w-2xl">
          <h2 className="text-white text-4xl md:text-5xl font-extrabold tracking-tighter leading-tight mb-4">
            AI Crop Disease Detection &amp; Yield Prediction
          </h2>
          <p className="text-emerald-50 text-lg font-medium opacity-90 mb-8 leading-relaxed">
            Detect plant diseases instantly &amp; predict crop yield using our
            advanced neural arboretum.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/detect")}
              className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold rounded-lg shadow-xl hover:scale-[1.04] transition-all duration-300 flex items-center gap-3"
            >
              <span className="material-symbols-outlined">biotech</span>
              Detect Disease
            </button>
            <button
              onClick={() => navigate("/yield")}
              className="px-8 py-4 bg-secondary-container text-on-secondary-container font-headline font-bold rounded-lg hover:scale-[1.04] transition-all duration-300 flex items-center gap-3"
            >
              <span className="material-symbols-outlined">trending_up</span>
              Predict Yield
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {STATS.map((s, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_40px_40px_-15px_rgba(23,68,19,0.04)] hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${s.iconBg} rounded-lg`}>
                <span className={`material-symbols-outlined ${s.iconColor}`}>
                  {s.icon}
                </span>
              </div>
              {s.badge && (
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                  {s.badge}
                </span>
              )}
              {s.bar && (
                <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-3">
                  <div className="w-[98%] h-full bg-gradient-to-r from-primary to-secondary" />
                </div>
              )}
              {s.avatars && (
                <div className="flex -space-x-2">
                  {s.avatars.map((a, j) => (
                    <div
                      key={j}
                      className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-800"
                    >
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest mb-1">
              {s.label}
            </p>
            <h3 className="text-4xl font-black text-emerald-900 tracking-tighter">
              {s.value}
            </h3>
          </div>
        ))}
      </section>

      {/* Bento grid */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent insights (3/5) */}
        <div className="lg:col-span-3 bg-surface-container-low p-8 rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-bold text-emerald-900 tracking-tight">
              Recent Insights
            </h4>
            <button className="text-sm font-bold text-emerald-700 hover:underline">
              View History
            </button>
          </div>
          <div className="space-y-4">
            {INSIGHTS.map((ins, i) => (
              <div
                key={i}
                className="glass-panel p-6 rounded-lg flex items-center gap-6 border border-white/40"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                  <img
                    src={ins.img}
                    alt={ins.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-emerald-900">{ins.title}</h5>
                  <p className="text-sm text-on-surface-variant">{ins.subtitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${ins.badgeClass}`}
                  >
                    {ins.badge}
                  </span>
                  <p className="text-xs text-on-surface-variant mt-1">{ins.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side panels (2/5) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Weather chart */}
          <div className="bg-surface-container-high p-8 rounded-xl flex-1">
            <h4 className="text-lg font-bold text-emerald-900 mb-1">
              Weather Correlation
            </h4>
            <p className="text-sm text-on-surface-variant mb-6">
              Soil moisture at 64% – Ideal for nitrogen application.
            </p>
            <div className="flex items-end gap-2 h-24">
              {BAR_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-md transition-all ${
                    i === 3
                      ? "bg-primary-container"
                      : "bg-emerald-900/10 hover:bg-emerald-900/20"
                  }`}
                  style={{ height: h }}
                />
              ))}
            </div>
          </div>

          {/* AI recommendation */}
          <div className="bg-secondary-container p-8 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-on-secondary-container">
                lightbulb
              </span>
              <h4 className="text-lg font-bold text-on-secondary-container tracking-tight">
                AI Recommendation
              </h4>
            </div>
            <p className="text-sm text-on-secondary-container/80 font-medium leading-relaxed">
              Current humidity levels favour fungal growth. Preventive spraying
              for Vineyard Block A recommended within 48 hours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
