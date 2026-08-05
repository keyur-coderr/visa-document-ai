"use client";

import { cn } from "@/lib/utilities/cn";
import { ChevronDownIcon } from "@/components/ui/icons";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const clamp = (value: number) => Math.min(Math.max(value, 1), Math.max(totalPages, 1));

  return (
    <div className={cn("flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400", className)}>
      <span>
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(clamp(page - 1))}
          className="focus-ring flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700"
        >
          <ChevronDownIcon className="h-3.5 w-3.5 rotate-90" />
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(clamp(page + 1))}
          className="focus-ring flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700"
        >
          Next
          <ChevronDownIcon className="h-3.5 w-3.5 -rotate-90" />
        </button>
      </div>
    </div>
  );
}
