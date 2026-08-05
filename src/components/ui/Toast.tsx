import { cn } from "@/lib/utilities/cn";
import { toneClasses, type StatusTone } from "@/lib/utilities/status";

export interface ToastProps {
  title: string;
  description?: string;
  tone?: StatusTone;
  className?: string;
}

/**
 * Toast placeholder — static visual only. A real toast system (stacking,
 * auto-dismiss, a `useToast()` hook) is introduced when actions that need
 * confirmation feedback are built in a later phase.
 */
export function Toast({ title, description, tone = "neutral", className }: ToastProps) {
  const classes = toneClasses[tone];
  return (
    <div
      role="status"
      className={cn(
        "flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lg dark:bg-neutral-900",
        classes.border,
        className,
      )}
    >
      <span className={cn("mt-1 h-2 w-2 flex-shrink-0 rounded-full", classes.dot)} aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
        {description ? <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p> : null}
      </div>
    </div>
  );
}
