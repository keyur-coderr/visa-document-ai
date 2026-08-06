import { cn } from "@/lib/utilities/cn";

export interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function TableWrapper({ children, className }: TableWrapperProps) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white shadow-[var(--shadow-xs)]", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
