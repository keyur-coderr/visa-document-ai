import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utilities/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("skeleton-shimmer rounded-md bg-neutral-200/80", className)} {...props} />;
}
