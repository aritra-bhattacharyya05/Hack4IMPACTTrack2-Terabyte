/**
 * App.jsx — root application shell.
 * React Router setup, shared navigation, global toast context.
 */

import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { useToast }        from "./hooks/useToast";
import ToastContainer      from "./components/ToastContainer";
import Dashboard           from "./pages/Dashboard";
import DiseaseDetection    from "./pages/DiseaseDetection";
import YieldPrediction     from "./pages/YieldPrediction";
import Analytics           from "./pages/Analytics";

const NAV_ITEMS = [
  { to: "/",          icon: "dashboard",        label: "Dashboard" },
  { to: "/detect",    icon: "center_focus_weak", label: "Detection" },
  { to: "/yield",     icon: "grass",             label: "Yield"     },
  { to: "/analytics", icon: "analytics",         label: "Analytics" },
];

function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col gap-2 p-6 h-screen sticky top-0 bg-surface-container-low w-64 shrink-0">
      <div className="mb-10 px-4">
        <h1 className="text-xl font-black text-emerald-900 tracking-tighter">AgriAI Assist</h1>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800/50 mt-1">Digital Arboretum</p>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all
               ${isActive ? "bg-white text-emerald-900 shadow-sm" : "text-emerald-800/70 hover:translate-x-1 hover:text-emerald-900"}`
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4 bg-primary-container/10 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-900/60">AI Core Active</span>
        </div>
        <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">Model v4.2 calibrated for seasonal soil moisture.</p>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="flex justify-between items-center px-6 md:px-8 py-4">
        <span className="md:hidden text-lg font-black text-emerald-900 tracking-tighter">AgriAI Assist</span>
        <nav className="hidden md:flex gap-8 items-center">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium tracking-tight transition-colors
                 ${isActive ? "text-emerald-900 border-b-2 border-emerald-900 pb-0.5" : "text-emerald-800/60 hover:text-emerald-900"}`
              }
            >{label}</NavLink>
          ))}
        </nav>
        <button className="p-2 rounded-full hover:bg-emerald-50 transition-all">
          <span className="material-symbols-outlined text-emerald-900">account_circle</span>
        </button>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl flex justify-around items-center py-3 px-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink key={to} to={to} end={to === "/"}
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? "text-emerald-900" : "text-emerald-800/50"}`}
        >
          <span className="material-symbols-outlined">{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const { toasts, toast, dismiss } = useToast();
  return (
    <BrowserRouter>
      <div className="bg-background text-on-background min-h-screen flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
          <TopBar />
          <main className="flex-1">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/detect"    element={<DiseaseDetection toast={toast} />} />
              <Route path="/yield"     element={<YieldPrediction  toast={toast} />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </div>
    </BrowserRouter>
  );
}
