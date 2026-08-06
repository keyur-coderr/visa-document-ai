import { cn } from "@/lib/utilities/cn";

export interface TimelineItemProps {
  title: string;
  description?: string;
  timestamp?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function TimelineItem({ title, description, timestamp, icon, className }: TimelineItemProps) {
  return (
    <div className={cn("flex gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3", className)}>
      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600" aria-hidden="true">
        {icon ?? <span className="h-2 w-2 rounded-full bg-brand-600" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[color:var(--color-text-primary)]">{title}</p>
        {description ? <p className="mt-0.5 text-small text-[color:var(--color-text-secondary)]">{description}</p> : null}
        {timestamp ? <p className="mt-1 text-caption">{timestamp}</p> : null}
      </div>
    </div>
  );
}
