import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Shared className helper for conditional and conflict-safe class composition.
 * - clsx handles conditional values
 * - twMerge resolves Tailwind utility collisions
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values));
}
