"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utilities/cn";

export interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
            )}
          >
            <Icon className="h-4.5 w-4.5 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Responsive sidebar: static column on desktop, overlay drawer on mobile. */
export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5 dark:border-neutral-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            VD
          </span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Visa Document AI</span>
        </div>
        <SidebarLinks />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-950/50" onClick={onMobileClose} aria-hidden="true" />
          <aside className="relative z-10 flex h-full w-72 flex-col bg-white shadow-xl dark:bg-neutral-900">
            <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-5 dark:border-neutral-800">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Visa Document AI</span>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close navigation"
                className="focus-ring rounded-md p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarLinks onNavigate={onMobileClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
