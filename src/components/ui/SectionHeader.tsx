import { cn } from "@/lib/utilities/cn";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h2 className="text-h3 text-[color:var(--color-text-primary)]">{title}</h2>
        {description ? <p className="mt-1 text-body text-[color:var(--color-text-secondary)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
