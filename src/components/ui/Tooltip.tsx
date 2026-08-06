"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utilities/cn";

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute -top-2 left-1/2 z-40 -translate-x-1/2 -translate-y-full rounded-md bg-neutral-900 px-2 py-1 text-xs text-white shadow-[var(--shadow-sm)]"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
