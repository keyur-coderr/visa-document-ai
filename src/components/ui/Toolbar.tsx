import { cn } from "@/lib/utilities/cn";

export interface ToolbarProps {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export function Toolbar({ leading, trailing, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 shadow-[var(--shadow-xs)] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">{leading}</div>
      <div className="flex items-center gap-2">{trailing}</div>
    </div>
  );
}
