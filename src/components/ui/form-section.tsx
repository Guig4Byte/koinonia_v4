import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./form-section.module.css";

export const formStackClassName = styles.stack;

export function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(styles.section, className)}>
      <p className={styles.title}>{title}</p>
      {children}
    </section>
  );
}

export function FormFieldStack({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn(styles.fields, className)} {...props}>
      {children}
    </div>
  );
}
