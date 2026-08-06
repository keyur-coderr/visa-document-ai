import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utilities/cn";

const statusPillVariants = cva("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", {
  variants: {
    status: {
      ready: "border-brand-200 bg-brand-50 text-brand-700",
      reviewing: "border-warning-200 bg-warning-50 text-warning-700",
      processing: "border-info-100 bg-info-50 text-info-700",
      submitted: "border-brand-200 bg-brand-50 text-brand-700",
      waiting_client: "border-neutral-300 bg-neutral-100 text-neutral-700",
      flagged: "border-danger-200 bg-danger-50 text-danger-700",
      completed: "border-success-200 bg-success-50 text-success-700",
      draft: "border-neutral-300 bg-neutral-100 text-neutral-700",
      approved: "border-success-200 bg-success-50 text-success-700",
      rejected: "border-danger-200 bg-danger-50 text-danger-700",
    },
  },
  defaultVariants: {
    status: "draft",
  },
});

export interface StatusPillProps extends VariantProps<typeof statusPillVariants> {
  className?: string;
  children: React.ReactNode;
}

export function StatusPill({ status, className, children }: StatusPillProps) {
  return (
    <span className={cn(statusPillVariants({ status }), className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
