import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import styles from "./field.module.css";

type FieldControlSize = "sm" | "md";
type FieldControlSurface = "default" | "muted" | "warm";
type FieldLabelVariant = "default" | "item";

type FieldProps = {
  htmlFor: string;
  label: ReactNode;
  description?: ReactNode;
  descriptionId?: string;
  error?: ReactNode;
  errorId?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  labelVariant?: FieldLabelVariant;
  labelHidden?: boolean;
  children: ReactNode;
} & Omit<LabelHTMLAttributes<HTMLLabelElement>, "htmlFor" | "children" | "className" | "required">;

type SharedFieldControlProps = {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  errorId?: string;
  className?: string;
  fieldClassName?: string;
  labelClassName?: string;
  labelVariant?: FieldLabelVariant;
  labelHidden?: boolean;
  size?: FieldControlSize;
  surface?: FieldControlSurface;
};

type InputFieldProps = SharedFieldControlProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id" | "size"> & {
    id: string;
    inputClassName?: string;
  };

type SelectFieldProps = SharedFieldControlProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "id" | "size"> & {
    id: string;
    selectClassName?: string;
    icon?: ReactNode;
  };

type TextareaFieldProps = SharedFieldControlProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id"> & {
    id: string;
    textareaClassName?: string;
    resize?: "vertical" | "none";
  };

function describedByIds(...ids: Array<string | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value.length > 0 ? value : undefined;
}

function controlClassName({
  className,
  invalid,
  size = "md",
  surface = "default",
}: {
  className?: string;
  invalid?: boolean;
  size?: FieldControlSize;
  surface?: FieldControlSurface;
}) {
  return cn(
    styles.control,
    size === "sm" && styles.controlSm,
    surface === "muted" && styles.controlMuted,
    surface === "warm" && styles.controlWarm,
    invalid && styles.controlInvalid,
    className,
  );
}

export function RequiredBadge({
  children = "Obrigatório",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <span className={cn(styles.requiredBadge, className)}>{children}</span>;
}

export function FieldError({
  id,
  children,
  className,
}: {
  id?: string;
  children?: ReactNode;
  className?: string;
}) {
  if (!children) return null;

  return (
    <span id={id} className={cn(styles.error, className)}>
      {children}
    </span>
  );
}

export function Field({
  htmlFor,
  label,
  description,
  descriptionId,
  error,
  errorId,
  required = false,
  className,
  labelClassName,
  labelVariant = "default",
  labelHidden = false,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={cn(styles.field, className)}>
      <label
        className={cn(
          styles.label,
          labelVariant === "item" && styles.labelItem,
          labelHidden && styles.labelHidden,
          labelClassName,
        )}
        htmlFor={htmlFor}
        {...props}
      >
        {label}
        {required ? <RequiredBadge /> : null}
      </label>
      {children}
      {description ? (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

export function InputField({
  id,
  label,
  description,
  error,
  errorId = `${id}-error`,
  className,
  fieldClassName,
  labelClassName,
  labelVariant,
  labelHidden,
  inputClassName,
  size = "md",
  surface = "default",
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const invalid = Boolean(error) || ariaInvalid === true || ariaInvalid === "true";

  return (
    <Field
      htmlFor={id}
      label={label}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={error ? errorId : undefined}
      required={required}
      className={cn(fieldClassName, className)}
      labelClassName={labelClassName}
      labelVariant={labelVariant}
      labelHidden={labelHidden}
    >
      <input
        id={id}
        required={required}
        aria-describedby={describedByIds(ariaDescribedBy, descriptionId, error ? errorId : undefined)}
        aria-invalid={invalid || undefined}
        className={controlClassName({ className: inputClassName, invalid, size, surface })}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  id,
  label,
  description,
  error,
  errorId = `${id}-error`,
  className,
  fieldClassName,
  labelClassName,
  labelVariant,
  labelHidden,
  selectClassName,
  size = "md",
  surface = "default",
  required,
  icon,
  children,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: SelectFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const invalid = Boolean(error) || ariaInvalid === true || ariaInvalid === "true";

  return (
    <Field
      htmlFor={id}
      label={label}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={error ? errorId : undefined}
      required={required}
      className={cn(fieldClassName, className)}
      labelClassName={labelClassName}
      labelVariant={labelVariant}
      labelHidden={labelHidden}
    >
      <div className={styles.selectWrapper}>
        <select
          id={id}
          required={required}
          aria-describedby={describedByIds(ariaDescribedBy, descriptionId, error ? errorId : undefined)}
          aria-invalid={invalid || undefined}
          className={cn(controlClassName({ className: selectClassName, invalid, size, surface }), styles.select)}
          {...props}
        >
          {children}
        </select>
        {icon ? (
          <span className={styles.selectIcon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

export function TextareaField({
  id,
  label,
  description,
  error,
  errorId = `${id}-error`,
  fieldClassName,
  className,
  labelClassName,
  labelVariant,
  labelHidden,
  textareaClassName,
  size = "md",
  surface = "default",
  required,
  resize = "none",
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const invalid = Boolean(error) || ariaInvalid === true || ariaInvalid === "true";

  return (
    <Field
      htmlFor={id}
      label={label}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={error ? errorId : undefined}
      required={required}
      className={cn(fieldClassName, className)}
      labelClassName={labelClassName}
      labelVariant={labelVariant}
      labelHidden={labelHidden}
    >
      <textarea
        id={id}
        required={required}
        aria-describedby={describedByIds(ariaDescribedBy, descriptionId, error ? errorId : undefined)}
        aria-invalid={invalid || undefined}
        className={cn(
          controlClassName({ className: textareaClassName, invalid, size, surface }),
          styles.textarea,
          resize === "none" && styles.textareaResizeNone,
        )}
        {...props}
      />
    </Field>
  );
}
