"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import type { StatusTone } from "@/lib/utilities/status";

export interface ToastPayload {
  title: string;
  description?: string;
  tone?: StatusTone;
}

interface ToastItem extends ToastPayload {
  id: string;
}

interface ToastContextValue {
  showToast: (payload: ToastPayload) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((payload: ToastPayload) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const next: ToastItem = { id, ...payload };

    setToasts((current) => [...current.slice(-3), next]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  const value = useMemo(() => ({ showToast, clearToasts }), [showToast, clearToasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,24rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            description={toast.description}
            tone={toast.tone}
            className="pointer-events-auto"
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
