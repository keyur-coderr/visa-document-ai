"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@/components/ui/icons";

/** Placeholder user card; auth profile binding is completed in a later phase. */
const mockCurrentUser = {
  name: "Priya Nair",
  role: "Practitioner (RCIC)",
  initials: "PN",
};

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring flex min-h-10 items-center gap-2 rounded-[14px] border border-[color:var(--color-border)] bg-white px-2.5 py-1.5 transition-colors hover:bg-[color:var(--color-surface-subtle)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-100 text-xs font-semibold text-brand-700">
          {mockCurrentUser.initials}
        </span>
        <span className="hidden min-w-0 text-left lg:block">
          <span className="block truncate text-sm font-medium text-[color:var(--color-text-primary)]">{mockCurrentUser.name}</span>
          <span className="inline-flex items-center rounded-full bg-[color:var(--color-surface-subtle)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-text-secondary)]">
            Practitioner
          </span>
        </span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-[color:var(--color-text-secondary)]" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Settings
          </Link>
          <Link
            href="/auth/logout"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-t border-neutral-200 px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Sign out
          </Link>
        </div>
      ) : null}
    </div>
  );
}
