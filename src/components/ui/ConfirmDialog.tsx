"use client";

import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utilities/cn";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "brand" | "danger";
}

/** Confirm/cancel dialog built on Modal. Callers own what onConfirm does — no logic here. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "brand",
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "focus-ring rounded-lg px-3.5 py-2 text-sm font-medium text-white",
              tone === "danger" ? "bg-danger-600 hover:bg-danger-700" : "bg-brand-600 hover:bg-brand-700",
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    />
  );
}
