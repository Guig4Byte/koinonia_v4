import Link from "next/link";
import { ChevronRight, HeartPulse } from "lucide-react";
import type { CSSProperties } from "react";
import type { PastoralHealthOverview, PastoralHealthSegment, PastoralHealthTone } from "@/features/dashboard/pastoral-health";
import { cn } from "@/lib/cn";

const toneClass: Record<PastoralHealthTone, string> = {
  ok: "bg-[var(--color-metric-presenca)]",
  warn: "bg-[var(--color-badge-atencao-text)]",
  neutral: "bg-[var(--color-text-muted)]",
  support: "bg-[var(--color-badge-apoio-text)]",
  risk: "bg-[var(--color-metric-atencoes)]",
};

const toneTextClass: Record<PastoralHealthTone, string> = {
  ok: "text-[color:var(--color-metric-presenca)]",
  warn: "text-[color:var(--color-badge-atencao-text)]",
  neutral: "text-[color:var(--color-text-muted)]",
  support: "text-[color:var(--color-badge-apoio-text)]",
  risk: "text-[color:var(--color-metric-atencoes)]",
};

function segmentFlexStyle(segment: PastoralHealthSegment, totalGroups: number): CSSProperties {
  return {
    flexBasis: `${(segment.count / totalGroups) * 100}%`,
    flexGrow: segment.count,
    minWidth: totalGroups > segment.count ? 8 : undefined,
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
      className={cn(
        "mb-5 rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card",
        className,
      )}
      aria-label={`${title}: ${overview.summary}`}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[color:var(--color-brand)]"
          aria-hidden="true"
        >
          <HeartPulse className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="k-item-title">{title}</p>
          <p className="mt-1 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
            {description}
          </p>
          <p className="mt-3 text-[length:var(--text-sm)] font-semibold leading-snug text-[color:var(--color-text-primary)]">
            {overview.summary}
          </p>
        </div>
      </div>

      <div
        className="mt-4 flex h-3 overflow-hidden rounded-full bg-[var(--surface-alt)]"
        role="img"
        aria-label={overview.summary}
      >
        {hasGroups ? (
          activeSegments.map((segment) => (
            <span
              key={segment.key}
              className={cn("h-full", toneClass[segment.tone])}
              style={segmentFlexStyle(segment, overview.totalGroups)}
              title={`${segment.label}: ${segment.count}`}
            />
          ))
        ) : (
          <span className="h-full w-full bg-[var(--color-border-divider)]" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {overview.segments.map((segment) => (
          <Link
            key={segment.key}
            href={segment.href}
            className={cn(
              "group flex min-w-0 items-center justify-between gap-3 rounded-[0.85rem] px-2.5 py-2 text-[length:var(--text-sm)] leading-tight transition-colors hover:bg-[var(--surface-alt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]",
              segment.count === 0 && "opacity-65",
            )}
            aria-label={`Ver células: ${segment.label}, ${segment.count}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn("h-3 w-3 shrink-0 rounded-full", toneClass[segment.tone])} aria-hidden="true" />
              <span className="truncate text-[color:var(--color-text-secondary)]">{segment.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <strong className={cn("text-[length:var(--text-sm)] font-bold tabular-nums", toneTextClass[segment.tone])}>{segment.count}</strong>
              <ChevronRight className="h-4 w-4 text-[color:var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
