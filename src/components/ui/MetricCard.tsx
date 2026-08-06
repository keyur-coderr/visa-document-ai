import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utilities/cn";

export interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trendTone?: "positive" | "neutral" | "negative";
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const trendClass = {
  positive: "text-success-600",
  neutral: "text-[color:var(--color-text-secondary)]",
  negative: "text-danger-600",
};

export function MetricCard({ title, value, change, trendTone = "neutral", icon, footer, className }: MetricCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-small text-[color:var(--color-text-secondary)]">{title}</p>
          {icon ? <div className="rounded-[var(--radius-md)] bg-brand-50 p-2 text-brand-600">{icon}</div> : null}
        </div>
        <p className="text-2xl font-semibold text-[color:var(--color-text-primary)]">{value}</p>
        {change ? <p className={cn("text-small", trendClass[trendTone])}>{change}</p> : null}
        {footer ? <div>{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
