"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utilities/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/** Base centered dialog primitive. Used directly, or composed by ConfirmDialog. */
export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900",
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <h2 id="modal-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="focus-ring rounded-md p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {description ? <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
