import { cn } from "@/lib/utilities/cn";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}

export function ProgressBar({ value, max = 100, className, label }: ProgressBarProps) {
  const safeMax = max <= 0 ? 100 : max;
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return (
    <div className={cn("space-y-1", className)}>
      {label ? <div className="text-xs text-[color:var(--color-text-secondary)]">{label}</div> : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-subtle)]" role="progressbar" aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={value}>
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
