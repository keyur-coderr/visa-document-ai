import { cn } from "@/lib/utilities/cn";
import { toneClasses, type StatusTone } from "@/lib/utilities/status";

export interface StatusChipProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

/** Status indicator with a colored dot, used for case status, document status, and AI confidence bands. */
export function StatusChip({ label, tone, className }: StatusChipProps) {
  const classes = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        classes.bg,
        classes.text,
        classes.border,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", classes.dot)} aria-hidden="true" />
      {label}
    </span>
  );
}
