import { cn } from "@/lib/utilities/cn";
import { Skeleton } from "@/components/ui/Skeleton";

export interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  variant?: "line" | "card" | "table";
}

/** Shared loading placeholder. `variant="table"` renders a set of row-shaped bars. */
export function LoadingSkeleton({ className, rows = 4, variant = "line" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("rounded-[var(--radius-xl)] border border-[color:var(--color-border)] p-5", className)}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-6 w-16" />
        <Skeleton className="mt-2 h-2.5 w-32" />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("divide-y divide-[color:var(--color-border)] rounded-[var(--radius-xl)] border border-[color:var(--color-border)]", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/6" />
            <Skeleton className="h-3 w-1/6" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-3" style={{ width: `${100 - index * 12}%` }} />
      ))}
    </div>
  );
}
