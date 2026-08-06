import { cn } from "@/lib/utilities/cn";
import { PageHeader } from "@/components/ui/PageHeader";

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
    <div className={cn("mx-auto flex w-full max-w-[var(--layout-content-max)] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8", className)}>
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}
