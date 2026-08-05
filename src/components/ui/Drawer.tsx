"use client";

import { createPortal } from "react-dom";
import { XIcon } from "@/components/ui/icons";
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
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-neutral-950/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900",
          side === "right" ? "ml-auto border-l" : "mr-auto border-r",
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <h2 id="drawer-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="focus-ring rounded-md p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {description ? <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p> : null}
        {children ? <div className="mt-4 flex-1">{children}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
