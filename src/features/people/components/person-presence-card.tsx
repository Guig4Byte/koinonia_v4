import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  attendanceLabels,
  attendanceTone,
  presenceTrendToneClass,
  recentPresenceCountLabel,
  recentPresenceTrendLabel,
  type PersonPresenceView,
} from "@/features/people/person-detail-view";
import { formatPresenceRate } from "@/features/events/presence-display";
import { PresenceMetricDisplay } from "@/components/shared/presence-metric";
import { cn } from "@/lib/cn";
import { countLabel, formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export function PersonPresenceCard({ view }: { view: PersonPresenceView }) {
  const {
    recentAttendances,
    recentPresence,
    previousPresence,
    trend,
    tone,
    hiddenAttendancesCount,
    hasPartialTrendHistory,
  } = view;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="k-item-title-sm">Presença recente</p>
          <p className="k-item-detail-tight">
            {recentPresence.hasPresenceData
              ? "Ritmo dos últimos encontros registrados. Ajuda a perceber se vale se aproximar."
              : "Ainda sem presença registrada em encontros recentes."}
          </p>
          {trend ? (
            <p className={cn("mt-1 text-[length:var(--text-xs)] leading-relaxed", presenceTrendToneClass(trend.direction, tone))}>
              {recentPresenceTrendLabel(trend, tone)}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-center">
          <PresenceMetricDisplay
            hasPresenceData={recentPresence.hasPresenceData}
            presenceRate={recentPresence.presenceRate}
            tone={tone}
            value={formatPresenceRate(recentPresence.hasPresenceData, recentPresence.presenceRate)}
            context="person"
            size="lg"
            showValue={false}
            showValueInside
            insideValueClassName="text-[length:var(--text-lg)]"
          />
          {trend ? (
            <p
              className={cn("mt-1 text-[length:var(--text-sm)] font-bold leading-none", presenceTrendToneClass(trend.direction, tone))}
              aria-label={`${trend.direction === "up" ? "subiu" : "caiu"} ${trend.delta} pontos em relação aos encontros anteriores`}
              title={`${trend.direction === "up" ? "Subiu" : "Caiu"} ${trend.delta} pontos em relação aos encontros anteriores`}
            >
              {trend.direction === "up" ? "↑" : "↓"} {trend.delta} pts
            </p>
          ) : null}
        </div>
      </div>

      {recentAttendances.length > 0 ? (
        <div className="mt-3 border-t border-[var(--color-border-divider)] pt-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="k-section-kicker">Últimos encontros</p>
            <p className="shrink-0 text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
              {recentPresenceCountLabel(recentPresence.presentCount, recentPresence.accountableCount)}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recentAttendances.map((attendance) => (
              <Link
                key={attendance.id}
                href={ROUTES.event(attendance.event.id)}
                className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-[var(--surface-alt)] px-3 py-2 transition active:scale-[0.99]"
              >
                <span className="min-w-0">
                  <span className="k-item-title-sm block">
                    {formatShortDate(attendance.event.startsAt)} · {formatTime(attendance.event.startsAt)}
                  </span>
                  <span className="k-item-caption-truncate">
                    {attendance.event.group?.name ?? "Encontro"}
                  </span>
                </span>
                <Badge tone={attendanceTone(attendance.status)} size="sm">
                  {attendanceLabels[attendance.status]}
                </Badge>
              </Link>
            ))}
          </div>
          {trend ? (
            <p className="mt-3 text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]">
              Tendência comparada com os {previousPresence.accountableCount} encontros anteriores.
            </p>
          ) : hasPartialTrendHistory ? (
            <p className="mt-3 text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]">
              Ainda sem histórico suficiente para comparar tendência.
            </p>
          ) : hiddenAttendancesCount > 0 ? (
            <p className="mt-3 text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]">
              Mais {countLabel(hiddenAttendancesCount, "encontro recente fica", "encontros recentes ficam")} fora da lista resumida.
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
