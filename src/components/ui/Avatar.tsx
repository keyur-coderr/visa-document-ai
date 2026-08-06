import { UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] font-medium text-[color:var(--color-text-primary)]",
        sizeClass[size],
        className,
      )}
      aria-label={name ? `${name} avatar` : "User avatar"}
    >
      {src ? <img src={src} alt={name ?? "User"} className="h-full w-full object-cover" /> : <span>{initials(name)}</span>}
      {!src && !name ? <UserCircle2 className="h-4 w-4 text-[color:var(--color-text-secondary)]" aria-hidden="true" /> : null}
    </span>
  );
}
