/**
 * ToastContainer — renders active toast notifications.
 * Place once at the top of your component tree (e.g. in App.jsx).
 */

import React from "react";

const TYPE_STYLES = {
  success: "bg-primary-container text-white",
  error:   "bg-error text-white",
  info:    "bg-surface-container-high text-on-surface",
};

const TYPE_ICONS = {
  success: "check_circle",
  error:   "error",
  info:    "info",
};

/**
 * @param {{ toasts: Array, dismiss: (id:number)=>void }} props
 */
export default function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl
            pointer-events-auto min-w-[260px] max-w-sm
            animate-[slideUp_0.25s_ease-out]
            ${TYPE_STYLES[t.type] || TYPE_STYLES.info}
          `}
        >
          <span className="material-symbols-outlined text-xl shrink-0">
            {TYPE_ICONS[t.type] || "info"}
          </span>
          <p className="text-sm font-semibold flex-1 leading-snug">
            {t.message}
          </p>
          <button
            onClick={() => dismiss(t.id)}
            className="opacity-70 hover:opacity-100 transition-opacity ml-2"
            aria-label="Dismiss notification"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
