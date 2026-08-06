import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utilities/cn";

export function FormField({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5", className)} {...props} />;
}

export function FormLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-medium text-neutral-700 dark:text-neutral-300", className)} {...props} />;
}

export function FormInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
        className,
      )}
      {...props}
    />
  );
}

export function FormTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-24 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
        className,
      )}
      {...props}
    />
  );
}

export function FormSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
        className,
      )}
      {...props}
    />
  );
}

export interface FormCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormCheckbox({ label, className, ...props }: FormCheckboxProps) {
  return (
    <label className={cn("flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300", className)}>
      <input
        type="checkbox"
        className="focus-ring h-4 w-4 rounded border-neutral-300 text-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function FormHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-neutral-500 dark:text-neutral-400", className)} {...props} />;
}
