import { cn } from "@/lib/utilities/cn";

export interface MiniChartPlaceholderProps {
  className?: string;
}

export function MiniChartPlaceholder({ className }: MiniChartPlaceholderProps) {
  return (
    <div className={cn("relative h-20 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)]", className)} aria-label="Mini chart placeholder">
      <svg viewBox="0 0 200 80" className="h-full w-full text-brand-500" aria-hidden="true">
        <polyline
          points="0,60 25,48 50,54 75,34 100,40 125,25 150,32 175,18 200,22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
