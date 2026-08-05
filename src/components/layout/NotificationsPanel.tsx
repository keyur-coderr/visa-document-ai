"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";

/** Placeholder mock notifications — no real notification delivery in Phase 1. */
const mockNotifications = [
  { id: "n1", title: "New flag on Singh case", time: "12m ago" },
  { id: "n2", title: "Document approved on Sharma case", time: "1h ago" },
];

export function NotificationsPanel() {
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
        aria-label="Notifications"
        className="focus-ring relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      >
        <BellIcon className="h-5 w-5" />
        {mockNotifications.length > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500" aria-hidden="true" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Notifications</p>
          {mockNotifications.length === 0 ? (
            <EmptyState title="No new notifications" className="border-none p-4" />
          ) : (
            <ul className="mt-1 space-y-1">
              {mockNotifications.map((notification) => (
                <li key={notification.id} className="rounded-md px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <p className="text-neutral-800 dark:text-neutral-200">{notification.title}</p>
                  <p className="text-xs text-neutral-400">{notification.time}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
