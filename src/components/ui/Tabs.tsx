"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utilities/cn";

export interface TabsItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  value: string;
  items: TabsItem[];
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ value, items, onChange, className }: TabsProps) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabledItems = items.filter((item) => !item.disabled);
    if (enabledItems.length === 0) return;
    const currentEnabledIndex = enabledItems.findIndex((item) => item.key === value);
    if (currentEnabledIndex < 0) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = enabledItems[(currentEnabledIndex + 1) % enabledItems.length];
      if (next) onChange(next.key);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const next = enabledItems[(currentEnabledIndex - 1 + enabledItems.length) % enabledItems.length];
      if (next) onChange(next.key);
    }

    if (event.key === "Home") {
      event.preventDefault();
      const next = enabledItems[0];
      if (next) onChange(next.key);
    }

    if (event.key === "End") {
      event.preventDefault();
      const next = enabledItems[enabledItems.length - 1];
      if (next) onChange(next.key);
    }
  }

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cn("inline-flex rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white p-1", className)}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`tab-panel-${item.key}`}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.key)}
            className={cn(
              "focus-ring rounded-[calc(var(--radius-lg)-4px)] px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[color:var(--color-surface-subtle)] text-[color:var(--color-text-primary)]"
                : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]",
              item.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
