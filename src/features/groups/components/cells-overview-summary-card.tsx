import type { ReactNode } from "react";
import { CalendarClock, ChartNoAxesCombined, Check, Heart, UsersRound } from "lucide-react";
import {
  clampPresenceRate,
  metricTextClass,
  presenceIndicatorStyle,
  type MetricTone,
} from "@/components/shared/presence-metric";
import {
  weeklyPresenceDetail,
  weeklyPresenceTone,
  type WeeklyPresenceSummary,
} from "@/features/dashboard/presence-health";
import { formatPresenceRate } from "@/features/events/presence-display";
import { cn } from "@/lib/cn";
import { NO_RECENT_PRESENCE_LABEL } from "@/lib/filter-param";

function summaryValueTextClass(tone: MetricTone): string {
  return tone === "neutral" ? "text-[color:var(--color-text-primary)]" : metricTextClass(tone);
}

function presenceStatusLabel(hasPresenceData: boolean, tone: MetricTone): string {
  if (!hasPresenceData) return "Sem dados";
  if (tone === "risk") return "Presença baixa";
  if (tone === "warn") return "Em atenção";
  return "Boa presença";
}

function MetricIcon({ children, tone = "neutral" }: { children: ReactNode; tone?: MetricTone }) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-2xl border bg-[var(--color-bg-metric-card)]",
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

function HeaderMetric({ cellsCount }: { cellsCount: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <MetricIcon>
          <UsersRound className="h-4 w-4" strokeWidth={2.35} absoluteStrokeWidth />
        </MetricIcon>
        <div className="min-w-0">
          <p className="k-item-title">Células acompanhadas</p>
          <p className="mt-0.5 text-[length:var(--text-sm)] leading-snug text-[color:var(--color-text-muted)]">
            Sob sua supervisão.
          </p>
        </div>
      </div>
      <p className="shrink-0 text-[length:var(--text-2xl)] font-extrabold leading-none tracking-[-0.03em] text-[color:var(--color-text-primary)] tabular-nums">
        {cellsCount}
      </p>
    </div>
  );
}

function WeeklyPresenceSpotlight({ weeklyPresence }: { weeklyPresence: WeeklyPresenceSummary }) {
  const tone = weeklyPresenceTone(weeklyPresence.hasPresenceData, weeklyPresence.presenceRate);
  const safeRate = clampPresenceRate(weeklyPresence.presenceRate);
  const value = formatPresenceRate(weeklyPresence.hasPresenceData, weeklyPresence.presenceRate);
  const statusLabel = presenceStatusLabel(weeklyPresence.hasPresenceData, tone);
  const style = {
    ...presenceIndicatorStyle(tone, weeklyPresence.hasPresenceData),
    background: "linear-gradient(135deg, color-mix(in srgb, var(--presence-ring) 10%, var(--color-bg-card)), var(--color-bg-metric-card))",
    borderColor: "color-mix(in srgb, var(--presence-ring) 24%, var(--color-border-card))",
  };

  return (
    <div className="rounded-2xl border px-3.5 py-3 shadow-[var(--color-shadow-metric-card)]" style={style}>
      <div className="grid grid-cols-[auto_1fr] gap-3 min-[390px]:grid-cols-[auto_1fr_auto] min-[390px]:items-center">
        <MetricIcon tone={tone}>
          <ChartNoAxesCombined className="h-4 w-4" strokeWidth={2.35} absoluteStrokeWidth />
        </MetricIcon>

        <div className="min-w-0">
          <p className="k-item-title text-[length:var(--text-base)]">Presença da semana</p>
          <p className="mt-0.5 text-[length:var(--text-sm)] leading-snug text-[color:var(--color-text-muted)]">
            {weeklyPresenceDetail(weeklyPresence)}
          </p>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 min-[390px]:col-span-1 min-[390px]:block min-[390px]:text-right">
          <p
            className={cn(
              "font-extrabold leading-none tabular-nums",
              weeklyPresence.hasPresenceData
                ? "text-[length:var(--text-2xl)] tracking-[-0.04em]"
                : "text-[length:var(--text-xs)] uppercase tracking-[0.08em]",
              weeklyPresence.hasPresenceData ? metricTextClass(tone) : "text-[color:var(--color-text-muted)]",
            )}
          >
            {weeklyPresence.hasPresenceData ? value : "Sem dados"}
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[length:var(--text-xs)] font-bold leading-none",
              weeklyPresence.hasPresenceData
                ? "border-[var(--presence-ring-track)] text-[color:var(--presence-ring)]"
                : "border-[var(--color-border-divider)] text-[color:var(--color-text-muted)]",
            )}
          >
            {weeklyPresence.hasPresenceData ? <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" /> : null}
            {statusLabel}
          </span>
        </div>
      </div>

      {weeklyPresence.hasPresenceData ? (
        <span
          className="mt-3 block h-2 overflow-hidden rounded-full"
          style={{ background: "var(--presence-ring-track)" }}
          aria-label={`Presença da semana: ${value}`}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeRate}
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${safeRate}%`, background: "var(--presence-ring)" }}
          />
        </span>
      ) : null}
    </div>
  );
}

function FooterMetric({
  icon,
  label,
  detail,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  value: number;
  tone: MetricTone;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <MetricIcon tone={tone}>{icon}</MetricIcon>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="k-item-title leading-tight">{label}</p>
          <p className={cn("shrink-0 text-[length:var(--text-xl)] font-extrabold leading-none tracking-[-0.03em] tabular-nums", summaryValueTextClass(tone))}>
            {value}
          </p>
        </div>
        <p className="mt-1 text-[length:var(--text-sm)] leading-snug text-[color:var(--color-text-muted)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

export function CellsOverviewSummaryCard({
  cellsCount,
  weeklyPresence,
  groupsNeedingAttentionCount,
  groupsWithoutPresenceCount,
}: {
  cellsCount: number;
  weeklyPresence: WeeklyPresenceSummary;
  groupsNeedingAttentionCount: number;
  groupsWithoutPresenceCount: number;
}) {
  return (
    <section className="mb-5 rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <HeaderMetric cellsCount={cellsCount} />

      <div className="mt-4 border-t border-[var(--color-border-divider)] pt-4">
        <WeeklyPresenceSpotlight weeklyPresence={weeklyPresence} />
      </div>

      <div className="mt-4 grid gap-4 border-t border-[var(--color-border-divider)] pt-4 min-[440px]:grid-cols-2 min-[440px]:gap-5">
        <FooterMetric
          icon={<Heart className="h-4 w-4" strokeWidth={2.35} absoluteStrokeWidth />}
          label="Pedem cuidado mais próximo"
          detail={groupsNeedingAttentionCount > 0 ? "Prioridade no acompanhamento." : "Sem alerta aberto agora."}
          value={groupsNeedingAttentionCount}
          tone={groupsNeedingAttentionCount > 0 ? "warn" : "ok"}
        />
        <FooterMetric
          icon={<CalendarClock className="h-4 w-4" strokeWidth={2.35} absoluteStrokeWidth />}
          label={NO_RECENT_PRESENCE_LABEL}
          detail={groupsWithoutPresenceCount > 0 ? "Confira encontros pendentes." : "Todas com registro recente."}
          value={groupsWithoutPresenceCount}
          tone={groupsWithoutPresenceCount > 0 ? "neutral" : "ok"}
        />
      </div>
    </section>
  );
}
