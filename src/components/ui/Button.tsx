import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utilities/cn";

const buttonVariants = cva(
  "focus-ring inline-flex min-w-[2.5rem] items-center justify-center rounded-[var(--radius-md)] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md",
        secondary:
          "border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-subtle)]",
        outline:
          "border border-brand-200 bg-transparent text-brand-700 hover:border-brand-300 hover:bg-brand-50",
        ghost: "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]",
        danger: "bg-danger-600 text-white shadow-sm hover:bg-danger-700 hover:shadow-md",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-3.5 text-sm",
        lg: "h-11 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
