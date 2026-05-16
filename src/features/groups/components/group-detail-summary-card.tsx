import type { ReactNode } from "react";
import { Heart, UsersRound } from "lucide-react";
import {
  PresenceIndicator,
  PresenceTrendDelta,
  clampPresenceRate,
  metricTextClass,
  presenceIndicatorStyle,
  type MetricTone,
  type PresenceTrend,
} from "@/components/shared/presence-metric";
import { cn } from "@/lib/cn";

function summaryValueTextClass(tone: MetricTone): string {
  return tone === "neutral" ? "text-[color:var(--color-text-primary)]" : metricTextClass(tone);
}

export type GroupDetailSummaryCardData = {
  members: {
    count: number;
    detail: string;
  };
  presence: {
    hasPresenceData: boolean;
    presenceRate: number;
    value: string;
    detail: string;
    tone: MetricTone;
    trend: PresenceTrend | null;
  };
  attention: {
    label: string;
    count: number;
    detail: string;
    tone: MetricTone;
  };
};

function SummaryIcon({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: MetricTone;
}) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-[var(--color-bg-metric-card)]",
        tone === "ok" && "border-[var(--color-badge-estavel-border)] text-[color:var(--color-metric-presenca)]",
        tone === "warn" && "border-[var(--color-badge-atencao-border)] text-[color:var(--color-badge-atencao-text)]",
        tone === "risk" && "border-[var(--color-badge-risco-border)] text-[color:var(--color-metric-atencoes)]",
        tone === "neutral" && "border-[var(--color-border-card)] text-[color:var(--color-brand)]",
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function SummaryMetricRow({
  icon,
  label,
  detail,
  value,
  valueTone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  value: number;
  valueTone?: MetricTone;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <SummaryIcon tone={valueTone}>{icon}</SummaryIcon>
        <div className="min-w-0">
          <p className="k-item-title">{label}</p>
          <p className="mt-0.5 text-[length:var(--text-xs)] leading-snug text-[color:var(--color-text-muted)]">
            {detail}
          </p>
        </div>
      </div>
      <p className={cn("shrink-0 text-[length:var(--text-xl)] font-extrabold leading-none tracking-[-0.03em] tabular-nums", summaryValueTextClass(valueTone))}>
        {value}
      </p>
    </div>
  );
}

function PresenceSpotlight({ presence }: { presence: GroupDetailSummaryCardData["presence"] }) {
  const safeRate = clampPresenceRate(presence.presenceRate);
  const hasPresenceData = presence.hasPresenceData;
  const style = {
    ...presenceIndicatorStyle(presence.tone, hasPresenceData),
    background: "linear-gradient(135deg, color-mix(in srgb, var(--presence-ring) 10%, var(--color-bg-card)), var(--color-bg-metric-card))",
    borderColor: "color-mix(in srgb, var(--presence-ring) 22%, var(--color-border-card))",
  };

  return (
    <div
      className="rounded-2xl border px-3 py-2.5 shadow-[var(--color-shadow-metric-card)]"
      style={style}
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <PresenceIndicator
          hasPresenceData={hasPresenceData}
          presenceRate={presence.presenceRate}
          tone={presence.tone}
          context="cell"
          size="sm"
          className="h-14 w-14"
        />

        <div className="min-w-0">
          <p className="k-item-title text-[length:var(--text-sm)] text-[color:var(--presence-ring)]">Presença recente</p>

          <div className="mt-1 flex items-end justify-between gap-3">
            <p
              className={cn(
                "font-extrabold leading-none tracking-[-0.04em] tabular-nums",
                hasPresenceData ? "text-[length:var(--text-2xl)]" : "text-[length:var(--text-sm)] uppercase tracking-[0.08em]",
                hasPresenceData ? metricTextClass(presence.tone) : "text-[color:var(--color-text-muted)]",
              )}
            >
              {hasPresenceData ? presence.value : "Sem dados"}
            </p>
            {presence.trend ? (
              <PresenceTrendDelta
                trend={presence.trend}
                tone={presence.tone}
                className="pb-1 text-[length:var(--text-sm)] leading-none"
              />
            ) : null}
          </div>

          {hasPresenceData ? (
            <span
              className="mt-2 block h-1.5 overflow-hidden rounded-full"
              style={{ background: "var(--presence-ring-track)" }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{ width: `${safeRate}%`, background: "var(--presence-ring)" }}
              />
            </span>
          ) : null}

          <p className="mt-1.5 text-[length:var(--text-xs)] leading-snug text-[color:var(--color-text-muted)]">
            {presence.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

export function GroupDetailSummaryCard({ summary }: { summary: GroupDetailSummaryCardData }) {
  return (
    <section className="mb-4 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card">
      <div className="space-y-3">
        <SummaryMetricRow
          icon={<UsersRound className="h-4 w-4" strokeWidth={2.35} absoluteStrokeWidth />}
          label="Membros acompanhados"
          detail={summary.members.detail}
          value={summary.members.count}
        />

        <div className="border-t border-[var(--color-border-divider)] pt-3">
          <PresenceSpotlight presence={summary.presence} />
        </div>

        <div className="border-t border-[var(--color-border-divider)] pt-3">
          <SummaryMetricRow
            icon={<Heart className="h-4 w-4" strokeWidth={2.35} absoluteStrokeWidth />}
            label={summary.attention.label}
            detail={summary.attention.detail}
            value={summary.attention.count}
            valueTone={summary.attention.tone}
          />
        </div>
      </div>
    </section>
  );
}
