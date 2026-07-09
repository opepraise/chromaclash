"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { msg: string; color: string };

const ToastContext = createContext<{ showToast: (msg: string, color?: string) => void }>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string, color = "#4ADE80") => {
    clearTimeout(timer.current);
    setToast({ msg, color });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className="animate-pop fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border2)", color: "var(--text)" }}
        >
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: toast.color }} />
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
