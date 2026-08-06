import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utilities/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "focus-ring h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-text-primary)] shadow-[var(--shadow-xs)] transition-colors hover:border-[color:var(--color-border-strong)] dark:bg-neutral-900",
        className,
      )}
      {...props}
    />
  );
}
