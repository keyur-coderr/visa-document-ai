import { cn } from "@/lib/utilities/cn";

export interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClass = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-[3px]",
};

export function Spinner({ className, size = "md", label = "Loading" }: SpinnerProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-live="polite">
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-[color:var(--color-border)] border-t-brand-600",
          sizeClass[size],
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
