/**
 * useToast — lightweight toast notification system.
 * Provides success / error / info toasts without external dependencies.
 */

import { useState, useCallback, useRef } from "react";

let _nextId = 0;

/**
 * @returns {{
 *   toasts: Array<{id:number, message:string, type:'success'|'error'|'info'}>,
 *   toast: { success(msg:string):void, error(msg:string):void, info(msg:string):void },
 *   dismiss: (id:number) => void
 * }}
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const add = useCallback((message, type = "info", duration = 4000) => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, type }]);

    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => add(msg, "success"),
    error: (msg) => add(msg, "error", 6000),
    info: (msg) => add(msg, "info"),
  };

  return { toasts, toast, dismiss };
}
