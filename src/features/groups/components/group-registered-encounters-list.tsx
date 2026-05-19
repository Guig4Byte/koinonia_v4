import { UsersRound } from "lucide-react";
import { EmptyState, SectionTitle } from "@/components/shared/base-cards";
import { metricTextClass } from "@/components/shared/presence-metric";
import { AttendanceStatus } from "@/generated/prisma/client";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { CardLink } from "@/components/ui/card-link";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { summarizeEventPresence } from "@/features/events/presence-summary";
import { countLabel, formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import styles from "./group-registered-encounters-list.module.css";

export type GroupRegisteredEncounter = {
  id: string;
  startsAt: Date;
  status: string;
  attendances: Array<{
    status: AttendanceStatus;
  }>;
};

export function GroupRegisteredEncountersList({ events }: { events: GroupRegisteredEncounter[] }) {
  return (
    <section>
      <SectionTitle>Últimos encontros registrados</SectionTitle>
      <div>
        <ProgressiveList
          initialCount={4}
          step={4}
          moreLabel="Ver mais encontros"
          lessLabel="Mostrar menos encontros"
        >
          {events.map((event) => {
            const metrics = summarizeEventPresence(event);
            const presenceBadgeTone = presenceTone(metrics.hasPresenceData, metrics.presenceRate);
            const presenceLabel = formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate, "Sem registro");
            return (
              <CardLink
                key={event.id}
                href={ROUTES.event(event.id)}
                padding="sm"
                radius="sm"
                containment="hidden"
                className={styles.encounterCard}
              >
                <span className={styles.encounterMain}>
                  <span className={styles.encounterDate}>
                    {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)}
                  </span>
                  <span className={styles.encounterMeta}>
                    <strong className={cn(styles.presenceValue, metricTextClass(presenceBadgeTone))}>
                      {presenceLabel}
                    </strong>
                    <span className={styles.divider} aria-hidden="true" />
                    <span className={styles.visitors}>
                      <UsersRound className={styles.visitorsIcon} strokeWidth={1.8} aria-hidden="true" />
                      {countLabel(metrics.visitorCount, "visitante", "visitantes")}
                    </span>
                  </span>
                </span>
                <span className={styles.action}>
                  Abrir →
                </span>
              </CardLink>
            );
          })}
        </ProgressiveList>
        {events.length === 0 ? (
          <EmptyState compact>Ainda não há encontros registrados para resumir presença.</EmptyState>
        ) : null}
      </div>
    </section>
  );
}
