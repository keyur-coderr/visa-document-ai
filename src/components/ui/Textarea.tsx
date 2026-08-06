import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utilities/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-24 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text-primary)] shadow-[var(--shadow-xs)] transition-colors placeholder:text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-strong)] dark:bg-neutral-900",
        className,
      )}
      {...props}
    />
  );
}
