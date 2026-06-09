import { UsersRound } from "lucide-react";
import { EmptyState } from "@/components/shared/base-cards";
import { SectionHeader } from "@/components/ui/section-header";
import { metricTextClass } from "@/components/shared/presence-metric";
import { AttendanceStatus } from "@/generated/prisma/client";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { EMPTY_STATE_COPY } from "@/features/empty-states/empty-state-copy";
import { CardActionCue } from "@/components/ui/card-action-cue";
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
      <SectionHeader title="Últimos encontros registrados" />
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
            const presenceLabel = formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate, "Sem presença");
            return (
              <CardLink
                key={event.id}
                href={ROUTES.event(event.id)}
                padding="sm"
                radius="sm"
                containment="hidden"
                minHeight="sm"
                accent="left"
                surface="brand"
                layout="split"
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
                <CardActionCue tone="decorative" enhanceOnGroupHover>
                  Abrir
                </CardActionCue>
              </CardLink>
            );
          })}
        </ProgressiveList>
        {events.length === 0 ? (
          <EmptyState compact title={EMPTY_STATE_COPY.events.noRegisteredYetTitle}>{EMPTY_STATE_COPY.events.noRegisteredYetDetail}</EmptyState>
        ) : null}
      </div>
    </section>
  );
}
