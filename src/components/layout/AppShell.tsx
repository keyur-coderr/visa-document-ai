"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export interface AppShellProps {
  children: React.ReactNode;
}

const SIDEBAR_STORAGE_KEY = "visa-document-ai:sidebar-collapsed";

/** Top-level shell for the main application: sidebar + header + content region. */
export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "1") {
      setDesktopCollapsed(true);
    }
  }, []);

  const toggleDesktopSidebar = () => {
    setDesktopCollapsed((previous) => {
      const next = !previous;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-[color:var(--color-bg)]">
      <Sidebar
        desktopCollapsed={desktopCollapsed}
        onToggleDesktop={toggleDesktopSidebar}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          desktopSidebarCollapsed={desktopCollapsed}
          onToggleDesktopSidebar={toggleDesktopSidebar}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
