import { cn } from "@/lib/utilities/cn";

export interface ContentContainerProps {
  children: React.ReactNode;
  width?: "narrow" | "default" | "wide";
  className?: string;
}

const widthClass = {
  narrow: "max-w-[var(--layout-narrow-max)]",
  default: "max-w-[var(--layout-content-max)]",
  wide: "max-w-[var(--layout-wide-max)]",
};

export function ContentContainer({ children, width = "default", className }: ContentContainerProps) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widthClass[width], className)}>{children}</div>;
}
