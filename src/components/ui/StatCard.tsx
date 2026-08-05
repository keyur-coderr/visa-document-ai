import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utilities/cn";

export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  icon?: React.ReactNode;
}

const deltaToneClasses: Record<NonNullable<StatCardProps["deltaTone"]>, string> = {
  up: "text-success-600 dark:text-success-500",
  down: "text-danger-600 dark:text-danger-500",
  flat: "text-neutral-500 dark:text-neutral-400",
};

export function StatCard({ label, value, delta, deltaTone = "flat", icon }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
        {icon ? (
          <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
      {delta ? <p className={cn("mt-1 text-xs font-medium", deltaToneClasses[deltaTone])}>{delta}</p> : null}
    </Card>
  );
}
