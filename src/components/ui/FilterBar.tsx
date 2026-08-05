"use client";

import { FilterIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utilities/cn";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterBarProps {
  filters: {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  className?: string;
}

/** Row of simple select-based filters. Presentation only — filtering logic is Phase 2. */
export function FilterBar({ filters, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <FilterIcon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      {filters.map((filter) => (
        <label key={filter.id} className="sr-only" htmlFor={`filter-${filter.id}`}>
          {filter.label}
        </label>
      ))}
      {filters.map((filter) => (
        <select
          key={filter.id}
          id={`filter-${filter.id}`}
          value={filter.value}
          onChange={(event) => filter.onChange(event.target.value)}
          className="focus-ring rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
