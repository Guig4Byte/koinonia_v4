import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  attendanceLabels,
  attendanceTone,
  recentPresenceCountLabel,
  recentPresenceTrendLabel,
  type PersonPresenceView,
} from "@/features/people/person-detail-view";
import { formatPresenceRate } from "@/features/events/presence-display";
import { PresenceMetricDisplay } from "@/components/shared/presence-metric";
import { countLabel, formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import styles from "./person-presence-card.module.css";

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
    <Card surface="heroGlow">
      <div className={styles.presenceHeader}>
        <div className={styles.presenceCopy}>
          <p className={styles.presenceTitle}>Presença recente</p>
          <p className={styles.presenceDetail}>
            {recentPresence.hasPresenceData
              ? "Ritmo dos últimos encontros registrados."
              : "Sem presença registrada em encontros recentes."}
          </p>
          {trend ? (
            <p className={styles.trendText}>
              {recentPresenceTrendLabel(trend, tone)}
            </p>
          ) : null}
        </div>
        <div className={styles.metricBlock} data-tone={tone}>
          <PresenceMetricDisplay
            hasPresenceData={recentPresence.hasPresenceData}
            presenceRate={recentPresence.presenceRate}
            tone={tone}
            value={formatPresenceRate(recentPresence.hasPresenceData, recentPresence.presenceRate)}
            context="person"
            size="lg"
            weight="light"
            showValue={false}
            showValueInside
            insideValueClassName="text-[length:var(--text-sm)]"
          />
          {trend ? (
            <p
              className={styles.metricTrend}
              data-direction={trend.direction}
              data-tone={tone}
              aria-label={`${trend.direction === "up" ? "subiu" : "caiu"} ${trend.delta} pontos em relação aos encontros anteriores`}
              title={`${trend.direction === "up" ? "Subiu" : "Caiu"} ${trend.delta} pontos em relação aos encontros anteriores`}
            >
              {trend.direction === "up" ? "↑" : "↓"} {countLabel(trend.delta, "ponto", "pontos")}
            </p>
          ) : null}
        </div>
      </div>

      {recentAttendances.length > 0 ? (
        <div className={styles.historyBlock}>
          <div className={styles.historyHeader}>
            <p className={styles.historyTitle}>Últimos encontros</p>
            <p className={styles.historyDetail}>
              {recentPresenceCountLabel(recentPresence.presentCount, recentPresence.accountableCount)}
            </p>
          </div>

          <div className={styles.attendanceGrid}>
            {recentAttendances.map((attendance) => {
              const currentAttendanceTone = attendanceTone(attendance.status);

              return (
                <Link
                  key={attendance.id}
                  href={ROUTES.event(attendance.event.id)}
                  className={styles.attendanceCard}
                >
                  <span className={styles.attendanceCopy}>
                    <span className={styles.attendanceDate}>
                      {formatShortDate(attendance.event.startsAt)} · {formatTime(attendance.event.startsAt)}
                    </span>
                    <span className={styles.attendanceGroup}>
                      {attendance.event.group?.name ?? "Encontro"}
                    </span>
                  </span>
                  <Badge tone={currentAttendanceTone} size="sm">
                    {attendanceLabels[attendance.status]}
                  </Badge>
                </Link>
              );
            })}
          </div>
          {trend ? (
            <p className={styles.footerNote}>
              Tendência comparada com os {previousPresence.accountableCount} encontros anteriores.
            </p>
          ) : hasPartialTrendHistory ? (
            <p className={styles.footerNote}>
              Ainda sem histórico suficiente para comparar tendência.
            </p>
          ) : hiddenAttendancesCount > 0 ? (
            <p className={styles.footerNote}>
              Mais {countLabel(hiddenAttendancesCount, "encontro recente fica", "encontros recentes ficam")} fora da lista resumida.
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
