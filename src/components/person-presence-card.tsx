import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  attendanceLabels,
  attendanceTone,
  presenceToneClass,
  presenceTrendToneClass,
  recentPresenceCountLabel,
  recentPresenceTrendLabel,
  type PersonPresenceView,
} from "@/features/people/person-detail-view";
import { formatPresenceRate } from "@/features/events/presence-display";
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
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Presença recente</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {recentPresence.hasPresenceData
              ? "Ritmo dos últimos encontros registrados. Ajuda a perceber se vale se aproximar."
              : "Ainda sem presença registrada em encontros recentes."}
          </p>
          {trend ? (
            <p className={`mt-1 text-xs leading-relaxed ${presenceTrendToneClass(trend.direction, tone)}`}>
              {recentPresenceTrendLabel(trend, tone)}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-[21px] font-bold leading-none tracking-[-0.02em] ${presenceToneClass(tone)}`}>
            {formatPresenceRate(recentPresence.hasPresenceData, recentPresence.presenceRate)}
          </p>
          {trend ? (
            <p
              className={`mt-1 text-[13px] font-bold leading-none ${presenceTrendToneClass(trend.direction, tone)}`}
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
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Últimos encontros</p>
            <p className="shrink-0 text-xs text-[var(--color-text-secondary)]">
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
                  <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                    {formatShortDate(attendance.event.startsAt)} · {formatTime(attendance.event.startsAt)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">
                    {attendance.event.group?.name ?? "Encontro"}
                  </span>
                </span>
                <Badge tone={attendanceTone(attendance.status)} className="px-2 py-0.5 text-[11px]">
                  {attendanceLabels[attendance.status]}
                </Badge>
              </Link>
            ))}
          </div>
          {trend ? (
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Tendência comparada com os {previousPresence.accountableCount} encontros anteriores.
            </p>
          ) : hasPartialTrendHistory ? (
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Ainda sem histórico suficiente para comparar tendência.
            </p>
          ) : hiddenAttendancesCount > 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Mais {countLabel(hiddenAttendancesCount, "encontro recente fica", "encontros recentes ficam")} fora da lista resumida.
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
