import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utilities/cn";
import { toneClasses, type StatusTone } from "@/lib/utilities/status";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

/** Generic pill label. For entity status (case/document/AI confidence), prefer StatusChip. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  const classes = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        classes.bg,
        classes.text,
        classes.border,
        className,
      )}
      {...props}
    />
  );
}
