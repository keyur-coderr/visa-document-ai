"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utilities/cn";

export type PageStatus = "loading" | "empty" | "error" | "ready";

export interface PageStateProps {
  status: PageStatus;
  onStatusChange?: (status: PageStatus) => void;
  emptyTitle: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  skeletonVariant?: "line" | "card" | "table";
  children: React.ReactNode;
  className?: string;
}

const statuses: PageStatus[] = ["loading", "ready", "empty", "error"];

/**
 * Renders the loading / ready / empty / error state required on every page.
 * Includes a small preview switcher so each state can be inspected without a
 * real backend (Phase 1 has no data fetching to trigger these naturally).
 */
export function PageState({
  status,
  onStatusChange,
  emptyTitle,
  emptyDescription,
  errorTitle = "Something went wrong",
  errorDescription = "We couldn't load this data. Try again in a moment.",
  onRetry,
  skeletonVariant = "line",
  children,
  className,
}: PageStateProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {onStatusChange ? (
        <div className="flex items-center gap-1 self-start rounded-lg border border-neutral-200 bg-white p-1 text-xs dark:border-neutral-800 dark:bg-neutral-900">
          {statuses.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onStatusChange(option)}
              className={cn(
                "focus-ring rounded-md px-2.5 py-1 font-medium capitalize",
                status === option
                  ? "bg-brand-600 text-white"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {status === "loading" ? <LoadingSkeleton variant={skeletonVariant} rows={5} /> : null}
      {status === "empty" ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}
      {status === "error" ? (
        <EmptyState
          variant="error"
          title={errorTitle}
          description={errorDescription}
          action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
        />
      ) : null}
      {status === "ready" ? children : null}
    </div>
  );
}

export function useDemoPageState(initial: PageStatus = "ready") {
  return useState<PageStatus>(initial);
}
