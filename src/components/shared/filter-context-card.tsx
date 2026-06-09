import { HeartHandshake } from "lucide-react";
import type { FilterTone } from "@/lib/filter-param";
import { cn } from "@/lib/cn";
import styles from "./filter-context-card.module.css";

const toneClass: Partial<Record<FilterTone, string>> = {
  risk: styles.risk,
  support: styles.support,
  warn: styles.warn,
  care: styles.care,
  neutral: styles.neutral,
  ok: styles.ok,
};

export function FilterContextCard({
  title,
  detail,
  tone,
  className,
}: {
  title: string;
  detail: string;
  tone?: FilterTone;
  className?: string;
}) {
  return (
    <section className={cn(styles.card, tone && toneClass[tone], className)} aria-label={title}>
      <span className={styles.icon} aria-hidden="true">
        <HeartHandshake className="h-6 w-6" strokeWidth={1.9} />
      </span>
      <span className={styles.copy}>
        <span className={styles.title}>{title}</span>
        <span className={styles.detail}>{detail}</span>
      </span>
    </section>
  );
}
