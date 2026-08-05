import { cn } from "@/lib/utilities/cn";

export interface PageContainerProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** Standard page wrapper: title + description + optional actions, above page content. */
export function PageContainer({ title, description, actions, children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
          {description ? <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
