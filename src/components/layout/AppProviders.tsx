"use client";

import { ToastProvider } from "@/components/ui/ToastProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
