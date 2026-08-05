import { cn } from "@/lib/utilities/cn";
import { AlertTriangleIcon, InboxIcon } from "@/components/ui/icons";

export interface EmptyStateProps {
  variant?: "empty" | "error";
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/** Shared empty/error placeholder used by every Phase 1 page. */
export function EmptyState({ variant = "empty", title, description, action, className }: EmptyStateProps) {
  const isError = variant === "error";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center",
        isError
          ? "border-danger-200 bg-danger-50 dark:border-danger-500/20 dark:bg-danger-500/5"
          : "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full",
          isError
            ? "bg-danger-100 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500"
            : "bg-neutral-200/70 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
        )}
      >
        {isError ? <AlertTriangleIcon className="h-5 w-5" /> : <InboxIcon className="h-5 w-5" />}
      </span>
      <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="focus-ring mt-4 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
