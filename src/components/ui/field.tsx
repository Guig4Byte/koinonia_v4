import type { LabelHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldProps = {
  htmlFor: string;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
} & Omit<LabelHTMLAttributes<HTMLLabelElement>, "htmlFor" | "children" | "className">;

export function Field({
  htmlFor,
  label,
  description,
  className,
  labelClassName,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={className}>
      <label
        className={cn(
          "mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]",
          labelClassName,
        )}
        htmlFor={htmlFor}
        {...props}
      >
        {label}
      </label>
      {children}
      {description ? <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{description}</p> : null}
    </div>
  );
}

export function TextareaField({
  id,
  label,
  description,
  className,
  textareaClassName,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  textareaClassName?: string;
}) {
  return (
    <Field htmlFor={id} label={label} description={description} className={className}>
      <textarea
        id={id}
        className={cn(
          "w-full resize-none rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-brand)]",
          textareaClassName,
        )}
        {...props}
      />
    </Field>
  );
}
