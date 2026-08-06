"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  side?: "right" | "left";
  className?: string;
}

/** Side-panel primitive, used for detail views (e.g. a case or document preview) in later phases. */
export function Drawer({ open, onClose, title, description, children, side = "right", className }: DrawerProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex fade-in">
      <div className="absolute inset-0 bg-neutral-950/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-md)]",
          side === "right" ? "ml-auto border-l" : "mr-auto border-r",
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <h2 id={titleId} className="text-h4 text-[color:var(--color-text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="focus-ring rounded-md p-1 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {description ? <p className="mt-1 text-body text-[color:var(--color-text-secondary)]">{description}</p> : null}
        {children ? <div className="mt-4 flex-1">{children}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
