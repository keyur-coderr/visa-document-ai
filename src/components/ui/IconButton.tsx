import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utilities/cn";

const iconButtonVariants = cva(
  "focus-ring inline-flex items-center justify-center rounded-[var(--radius-md)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        ghost: "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]",
        outline: "border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-primary)]",
      },
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

export function IconButton({ variant, size, className, ...props }: IconButtonProps) {
  return <button className={cn(iconButtonVariants({ variant, size }), className)} {...props} />;
}
