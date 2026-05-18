import Link from "next/link";
import { ChevronRight, HeartPulse } from "lucide-react";
import type { CSSProperties } from "react";
import type { PastoralHealthOverview, PastoralHealthSegment, PastoralHealthTone } from "@/features/dashboard/pastoral-health";
import { cn } from "@/lib/cn";
import styles from "./pastoral-health-card.module.css";

const toneClass: Record<PastoralHealthTone, string> = {
  ok: "bg-[var(--color-metric-presenca)]",
  warn: "bg-[var(--color-badge-atencao-text)]",
  neutral: "bg-[var(--color-text-muted)]",
  support: "bg-[var(--color-badge-apoio-text)]",
  risk: "bg-[var(--color-metric-atencoes)]",
};

const toneColor: Record<PastoralHealthTone, string> = {
  ok: "var(--color-metric-presenca)",
  warn: "var(--color-badge-atencao-text)",
  neutral: "var(--color-text-muted)",
  support: "var(--color-badge-apoio-text)",
  risk: "var(--color-metric-atencoes)",
};

function segmentFlexStyle(segment: PastoralHealthSegment, totalGroups: number): CSSProperties {
  return {
    flexBasis: `${(segment.count / totalGroups) * 100}%`,
    flexGrow: segment.count,
    minWidth: totalGroups > segment.count ? 8 : undefined,
  };
}

function segmentColorStyle(segment: PastoralHealthSegment): CSSProperties & { "--segment-color": string } {
  return {
    "--segment-color": toneColor[segment.tone],
  };
}

export function PastoralHealthCard({
  overview,
  title = "Saúde geral",
  description,
  className,
}: {
  overview: PastoralHealthOverview;
  title?: string;
  description: string;
  className?: string;
}) {
  const activeSegments = overview.segments.filter((segment) => segment.count > 0);
  const hasGroups = overview.totalGroups > 0;

  return (
    <section
      className={cn(styles.root, className)}
      aria-label={`${title}: ${overview.summary}`}
    >
      <div className={styles.header}>
        <span className={styles.iconWrap} aria-hidden="true">
          <HeartPulse className="h-7 w-7" strokeWidth={2.15} />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="font-serif-display text-[length:var(--text-xl)] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--color-text-primary)]">{title}</p>
          <p className="mt-1.5 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
            {description}
          </p>
        </div>
      </div>

      <div
        className={styles.bar}
        role="img"
        aria-label={overview.summary}
      >
        {hasGroups ? (
          activeSegments.map((segment) => (
            <span
              key={segment.key}
              className={cn(styles.segment, toneClass[segment.tone])}
              style={segmentFlexStyle(segment, overview.totalGroups)}
              title={`${segment.label}: ${segment.count}`}
            />
          ))
        ) : (
          <span className="h-full w-full bg-[var(--color-border-divider)]" />
        )}
      </div>

      <div className={styles.rows}>
        {overview.segments.map((segment) => (
          <Link
            key={segment.key}
            href={segment.href}
            className={cn(styles.row, segment.count === 0 && "opacity-70")}
            style={segmentColorStyle(segment)}
            aria-label={`Ver células: ${segment.label}, ${segment.count}`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className={styles.dot} aria-hidden="true" />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <strong className={styles.count}>{segment.count}</strong>
              <span className={styles.chevron} aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
