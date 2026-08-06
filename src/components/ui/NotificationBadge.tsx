import { cn } from "@/lib/utilities/cn";

export interface NotificationBadgeProps {
  count?: number;
  className?: string;
}

export function NotificationBadge({ count = 0, className }: NotificationBadgeProps) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 py-0.5 text-[10px] font-semibold text-white",
        className,
      )}
      aria-label={`${label} notifications`}
    >
      {label}
    </span>
  );
}
