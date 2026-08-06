import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utilities/cn";

export interface AICardProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function AICard({ title, description, action, className }: AICardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <span className="rounded-full bg-brand-50 p-2 text-brand-600" aria-hidden="true">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-body text-[color:var(--color-text-secondary)]">{description}</p>
        {action ? <div>{action}</div> : null}
      </CardContent>
    </Card>
  );
}
