import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utilities/cn";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export function FormField({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5", className)} {...props} />;
}

export function FormLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-medium text-[color:var(--color-text-primary)]", className)} {...props} />;
}

export function FormInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <Input className={className} {...props} />;
}

export function FormTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Textarea className={className} {...props} />;
}

export function FormSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <Select className={className} {...props} />;
}

export interface FormCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormCheckbox({ label, className, ...props }: FormCheckboxProps) {
  return (
    <label className={cn("flex items-center gap-2 text-sm text-[color:var(--color-text-primary)]", className)}>
      <input
        type="checkbox"
        className="focus-ring h-4 w-4 rounded border-[color:var(--color-border)] text-brand-600"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function FormHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-[color:var(--color-text-secondary)]", className)} {...props} />;
}
