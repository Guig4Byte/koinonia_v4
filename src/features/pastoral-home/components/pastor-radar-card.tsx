import { HeartPulse } from "lucide-react";
import type { PastoralPulseMessage } from "@/features/pastoral-pulse";
import { cn } from "@/lib/cn";
import styles from "./pastor-radar-card.module.css";

function punctuateSummary(summary: string) {
  const trimmed = summary.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function PastorRadarCard({
  pulse,
  summary,
  className,
}: {
  pulse: PastoralPulseMessage;
  summary: string;
  className?: string;
}) {
  return (
    <section className={cn(styles.root, className)} aria-label={`Radar pastoral: ${pulse.title}`}>
      <div className={styles.content}>
        <div className={styles.copy}>
          <p className="k-eyebrow mb-2">Radar pastoral</p>
          <p className="font-serif-display text-[length:var(--text-2xl)] font-semibold leading-[1.08] tracking-[-0.02em] text-[color:var(--color-text-primary)] text-balance">
            {pulse.title}
          </p>
          <p className={styles.narrative}>{punctuateSummary(summary)}</p>
          {pulse.subtitle ? (
            <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
              {pulse.subtitle}
            </p>
          ) : null}
        </div>
        <div className={styles.iconScene} aria-hidden="true">
          <span className={styles.iconHalo} />
          <span className={styles.iconSweep} />
          <span className={styles.iconCore}>
            <HeartPulse className="h-8 w-8" strokeWidth={2.1} />
          </span>
        </div>
      </div>
    </section>
  );
}
