"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utilities/cn";

export interface DropdownItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useRef(`dropdown-menu-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const firstEnabled = items.findIndex((item) => !item.disabled);
    setActiveIndex(firstEnabled >= 0 ? firstEnabled : 0);
  }, [open, items]);

  const enabledItems = items.filter((item) => !item.disabled);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(Math.max(items.length - 1, 0));
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!open || enabledItems.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => {
        const next = enabledItems.findIndex((item) => item.id === items[prev]?.id);
        const wrapped = (next + 1) % enabledItems.length;
        const targetId = enabledItems[wrapped]?.id;
        return Math.max(items.findIndex((item) => item.id === targetId), 0);
      });
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => {
        const next = enabledItems.findIndex((item) => item.id === items[prev]?.id);
        const wrapped = (next - 1 + enabledItems.length) % enabledItems.length;
        const targetId = enabledItems[wrapped]?.id;
        return Math.max(items.findIndex((item) => item.id === targetId), 0);
      });
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = items[activeIndex];
      if (!item || item.disabled) return;
      item.onSelect();
      setOpen(false);
    }
    if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId.current}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        className="focus-ring rounded-[var(--radius-md)]"
      >
        {trigger}
      </button>
      {open ? (
        <div
          id={menuId.current}
          role="menu"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute z-40 mt-2 min-w-48 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white p-1 shadow-[var(--shadow-md)] transition duration-150 animate-in fade-in",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              aria-disabled={item.disabled ? "true" : undefined}
              disabled={item.disabled}
              tabIndex={activeIndex === items.findIndex((menuItem) => menuItem.id === item.id) ? 0 : -1}
              onMouseEnter={() => setActiveIndex(items.findIndex((menuItem) => menuItem.id === item.id))}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                setOpen(false);
              }}
              className={cn(
                "focus-ring flex w-full items-center rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[color:var(--color-text-primary)] transition-colors hover:bg-[color:var(--color-surface-subtle)]",
                activeIndex === items.findIndex((menuItem) => menuItem.id === item.id) && !item.disabled && "bg-[color:var(--color-surface-subtle)]",
                item.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
