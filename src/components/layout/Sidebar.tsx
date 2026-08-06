"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";
import { ChevronRight, Sparkles, UserCircle2, X } from "lucide-react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utilities/cn";

export interface SidebarProps {
  desktopCollapsed: boolean;
  onToggleDesktop: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarLinks({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = [
    { label: "Operations", start: 0 },
    { label: "Intelligence", start: 4 },
    { label: "Administration", start: 8 },
  ];

  return (
    <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
      {navItems.map((item, index) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const groupLabel = groups.find((group) => group.start === index)?.label;
        return (
          <div key={item.href} className="space-y-1.5">
            {!collapsed && groupLabel ? (
              <p className={cn("px-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]", index === 0 && "pt-0")}>{groupLabel}</p>
            ) : null}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "focus-ring relative flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                active
                  ? "bg-gradient-to-r from-brand-50 to-brand-50/60 text-brand-700 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7),var(--shadow-xs)]"
                  : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]",
              )}
            >
              {active ? <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-brand-500 shadow-[0_0_12px_rgba(37,99,235,0.5)]" aria-hidden="true" /> : null}
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ collapsed, onToggleDesktop }: { collapsed?: boolean; onToggleDesktop: () => void }) {
  return (
    <div className="border-t border-[color:var(--color-border)] p-3">
      <div className={cn("mb-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-gradient-to-br from-brand-50 via-white to-violet-50 p-3", collapsed && "px-2") }>
        <div className={cn("flex items-center justify-between gap-2", collapsed && "justify-center") }>
          <Sparkles className="h-4 w-4 text-brand-600" />
          {collapsed ? null : (
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">Pro Plan</p>
              <p className="text-xs font-semibold text-[color:var(--color-text-primary)]">AI Credits</p>
            </div>
          )}
        </div>
        {collapsed ? null : (
          <>
            <div className="mt-2 flex items-center justify-between text-[10px] text-[color:var(--color-text-secondary)]">
              <span>260 used</span>
              <span>1,240 left</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/80">
              <div className="h-1.5 w-4/5 rounded-full bg-brand-500" />
            </div>
            <button
              type="button"
              className="focus-ring mt-2 inline-flex h-8 w-full items-center justify-center rounded-[12px] border border-brand-100 bg-white/90 px-2 text-xs font-medium text-brand-700 transition-colors hover:bg-white"
            >
              Upgrade Plan
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        className={cn(
          "focus-ring flex w-full items-center gap-2 rounded-[14px] border border-[color:var(--color-border)] bg-white px-2.5 py-2 text-left transition-colors hover:bg-[color:var(--color-surface-subtle)]",
          collapsed && "justify-center",
        )}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-100 text-brand-700">
          <UserCircle2 className="h-4.5 w-4.5" />
        </span>
        {collapsed ? <span className="sr-only">User profile</span> : (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-xs text-[color:var(--color-text-secondary)]">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[color:var(--color-text-primary)]">Priya Nair</span>
              <span className="inline-flex items-center rounded-full bg-[color:var(--color-surface-subtle)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">Practitioner</span>
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 flex-shrink-0" />
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onToggleDesktop}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "focus-ring mt-2 flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-2.5 py-2 text-left text-xs font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-subtle)]",
          collapsed && "justify-center",
        )}
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", collapsed ? "rotate-0" : "rotate-180")} />
        {collapsed ? <span className="sr-only">Toggle sidebar</span> : <span>Collapse Sidebar</span>}
      </button>
    </div>
  );
}

/** Responsive sidebar: static column on desktop, overlay drawer on mobile. */
export function Sidebar({ desktopCollapsed, onToggleDesktop, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "hidden flex-shrink-0 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition-[width] duration-300 ease-out lg:flex",
          desktopCollapsed ? "w-[72px]" : "w-[240px]",
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-[color:var(--color-border)]", desktopCollapsed ? "justify-center px-2" : "gap-2 px-4")}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            VD
          </span>
          {!desktopCollapsed ? (
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[color:var(--color-text-primary)]">Visa Document AI</span>
              <span className="block truncate text-xs text-[color:var(--color-text-secondary)]">Default Workspace</span>
            </div>
          ) : null}
        </div>

        <div className={cn("px-2 pt-2", desktopCollapsed ? "flex justify-center" : "flex justify-start") }>
          {desktopCollapsed ? null : <p className="px-2 text-caption uppercase tracking-wide">Navigation</p>}
        </div>
        <SidebarLinks collapsed={desktopCollapsed} />
        <SidebarFooter collapsed={desktopCollapsed} onToggleDesktop={onToggleDesktop} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-950/50" onClick={onMobileClose} aria-hidden="true" />
          <aside className="relative z-10 flex h-full w-72 flex-col bg-[color:var(--color-surface)] shadow-[var(--shadow-md)]">
            <div className="flex h-16 items-center justify-between border-b border-[color:var(--color-border)] px-5">
              <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">Visa Document AI</span>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close navigation"
                className="focus-ring rounded-md p-1 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarLinks onNavigate={onMobileClose} />
            <SidebarFooter onToggleDesktop={onMobileClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
