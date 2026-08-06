import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

const alertVariants = cva("flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm", {
  variants: {
    tone: {
      info: "border-brand-200 bg-brand-50 text-brand-800",
      success: "border-success-100 bg-success-50 text-success-700",
      warning: "border-warning-100 bg-warning-50 text-warning-700",
      danger: "border-danger-100 bg-danger-50 text-danger-700",
    },
  },
  defaultVariants: {
    tone: "info",
  },
});

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
}

export function Alert({ title, tone, className, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
      </div>
    </div>
  );
}
