import { cn } from "@/lib/cn";
import styles from "./toggle-card-field.module.css";

export function ToggleCardField({
  name,
  title,
  description,
  defaultChecked,
  disabled = false,
  className,
  includeHiddenWhenDisabled = false,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
  disabled?: boolean;
  className?: string;
  includeHiddenWhenDisabled?: boolean;
}) {
  return (
    <label className={cn(styles.option, disabled && styles.optionDisabled, className)}>
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className={styles.checkbox}
      />
      {includeHiddenWhenDisabled && disabled && defaultChecked ? (
        <input type="hidden" name={name} value="on" />
      ) : null}
      <span className={styles.visual} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      <span className={styles.copy}>
        <span className={styles.title}>{title}</span>
        <span className={styles.description}>{description}</span>
      </span>
    </label>
  );
}
