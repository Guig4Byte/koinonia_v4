import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./form-hero.module.css";

export function FormHero({
  eyebrow,
  title,
  description,
  icon,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(styles.hero, icon && styles.heroDecorated, className)}>
      <div className={styles.copy}>
        <p className={styles.kicker}>{eyebrow}</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      {icon ? (
        <span className={styles.decoration} aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </section>
  );
}
