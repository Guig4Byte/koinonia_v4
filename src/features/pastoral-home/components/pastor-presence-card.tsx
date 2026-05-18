import { ChartNoAxesCombined, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";
import { formatPresenceRate } from "@/features/events/presence-display";
import {
  WEEKLY_PRESENCE_LABEL,
  weeklyPresenceTone,
  weeklyPresenceTrendInsight,
  type WeeklyPresenceSummary,
  type WeeklyPresenceTrendDirection,
  type WeeklyPresenceTrendPoint,
} from "@/features/dashboard/presence-health";
import { cn } from "@/lib/cn";
import styles from "./pastor-presence-card.module.css";

const trendColor: Record<WeeklyPresenceTrendDirection | "neutral", string> = {
  up: "var(--color-metric-presenca)",
  stable: "var(--color-text-muted)",
  down: "var(--color-metric-atencoes)",
  neutral: "var(--color-text-muted)",
};

function clampRate(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function trendStyle(direction: WeeklyPresenceTrendDirection | "neutral"): CSSProperties & { "--trend-color": string } {
  return { "--trend-color": trendColor[direction] };
}

function buildSparkline(points: WeeklyPresenceTrendPoint[]) {
  const width = 320;
  const height = 84;
  const left = 8;
  const right = 8;
  const top = 12;
  const bottom = 24;
  const chartHeight = height - top - bottom;
  const usableWidth = width - left - right;
  const visiblePoints = points.map((point, index) => ({
    ...point,
    index,
    x: left + (usableWidth / Math.max(points.length - 1, 1)) * index,
    y: top + chartHeight - (clampRate(point.presenceRate) / 100) * chartHeight,
  })).filter((point) => point.hasPresenceData);

  if (visiblePoints.length === 0) {
    return {
      width,
      height,
      path: "",
      areaPath: "",
      visiblePoints,
    };
  }

  const path = visiblePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const first = visiblePoints[0];
  const last = visiblePoints.at(-1) ?? first;
  const areaPath = `${path} L ${last.x.toFixed(1)} ${height - bottom} L ${first.x.toFixed(1)} ${height - bottom} Z`;

  return { width, height, path, areaPath, visiblePoints };
}

function Sparkline({ points }: { points: WeeklyPresenceTrendPoint[] }) {
  const chart = buildSparkline(points);

  return (
    <svg className={styles.chart} viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Tendência de presença das últimas semanas">
      <line className={styles.chartTrack} x1="8" y1="58" x2="312" y2="58" />
      {chart.areaPath ? <path className={styles.chartArea} d={chart.areaPath} /> : null}
      {chart.path ? <path className={styles.chartLine} d={chart.path} /> : null}
      {chart.visiblePoints.map((point) => (
        <circle key={`${point.label}-${point.index}`} className={styles.chartPoint} cx={point.x} cy={point.y} r={point.index === points.length - 1 ? 5 : 3.5} />
      ))}
      {points.map((point, index) => {
        const x = 8 + (304 / Math.max(points.length - 1, 1)) * index;
        return <text key={point.label} className={styles.chartLabel} x={x} y="78" textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}>{point.label}</text>;
      })}
    </svg>
  );
}

function TrendSignal({ weeklyPresence }: { weeklyPresence: WeeklyPresenceSummary }) {
  const trend = weeklyPresence.monthTrend ?? null;
  const direction = trend?.direction ?? "neutral";

  if (!trend) {
    return (
      <div className={styles.trendMeta}>
        <span className={styles.trendSignal} style={trendStyle("neutral")}>
          <Minus className="h-4 w-4" aria-hidden="true" />
          Sem tendência suficiente
        </span>
      </div>
    );
  }

  if (trend.direction === "stable") {
    return (
      <div className={styles.trendMeta}>
        <span className={styles.trendSignal} style={trendStyle("stable")}>
          <Minus className="h-4 w-4" aria-hidden="true" />
          Sem mudança relevante
        </span>
        <span className={styles.trendContext}>em relação ao último mês</span>
      </div>
    );
  }

  return (
    <div className={styles.trendMeta}>
      <span className={styles.trendSignal} style={trendStyle(direction)}>
        {trend.direction === "up" ? <TrendingUp className="h-4 w-4" aria-hidden="true" /> : <TrendingDown className="h-4 w-4" aria-hidden="true" />}
        {trend.direction === "up" ? "+" : "-"}{trend.delta} pts
      </span>
      <span className={styles.trendContext}>em relação ao último mês</span>
    </div>
  );
}

export function PastorPresenceCard({ weeklyPresence, className }: { weeklyPresence: WeeklyPresenceSummary; className?: string }) {
  const value = formatPresenceRate(weeklyPresence.hasPresenceData, weeklyPresence.presenceRate);
  const tone = weeklyPresenceTone(weeklyPresence.hasPresenceData, weeklyPresence.presenceRate);
  const points = weeklyPresence.trendPoints ?? [];

  return (
    <section className={cn(styles.root, className)} aria-label={`${WEEKLY_PRESENCE_LABEL}: ${value}`}>
      <div className={styles.content}>
        <div className={styles.spotlight}>
          <span className={styles.iconWrap} aria-hidden="true">
            <ChartNoAxesCombined className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="k-eyebrow mb-1.5">Presença geral</p>
            <p className="font-serif-display text-[length:var(--text-xl)] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--color-text-primary)]">{WEEKLY_PRESENCE_LABEL}</p>
            <p className={cn(styles.value, !weeklyPresence.hasPresenceData && styles.valueMuted)}>{weeklyPresence.hasPresenceData ? value : "—"}</p>
          </div>
        </div>

        <div className="min-w-0">
          <TrendSignal weeklyPresence={weeklyPresence} />
          <p className={cn("mt-2.5", styles.trendCopy)}>{weeklyPresenceTrendInsight({
            hasPresenceData: weeklyPresence.hasPresenceData,
            recordedEventsCount: weeklyPresence.recordedEventsCount,
            monthTrend: weeklyPresence.monthTrend ?? null,
          })}</p>
          {points.length > 0 ? <div className="mt-2.5"><Sparkline points={points} /></div> : null}
          <span className="sr-only">Tom da presença: {tone}</span>
        </div>
      </div>
    </section>
  );
}
