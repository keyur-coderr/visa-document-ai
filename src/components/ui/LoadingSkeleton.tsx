import { cn } from "@/lib/utilities/cn";

export interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  variant?: "line" | "card" | "table";
}

/** Shared loading placeholder. `variant="table"` renders a set of row-shaped bars. */
export function LoadingSkeleton({ className, rows = 4, variant = "line" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("animate-pulse rounded-xl border border-neutral-200 p-5 dark:border-neutral-800", className)}>
        <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-3 h-6 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-2 h-2.5 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("animate-pulse divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-3 w-1/4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3 w-1/6 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3 w-1/6 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="ml-auto h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("animate-pulse space-y-2.5", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-3 rounded bg-neutral-200 dark:bg-neutral-800" style={{ width: `${100 - index * 12}%` }} />
      ))}
    </div>
  );
}
