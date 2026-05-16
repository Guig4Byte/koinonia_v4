import { EmptyState } from "@/components/shared/base-cards";
import { PageHero } from "@/components/shared/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { buildEventsConsultationView, type EventConsultationMode, type EventListEvent, type EventPeriod } from "@/features/events/events-page-view";
import type { PermissionUser } from "@/features/permissions/permissions";
import { ROUTES } from "@/lib/routes";
import { EVENTS_CONSULTATION_SECTION_ID } from "./event-consultation-routes";
import { EventList } from "./event-list";
import { PeriodChips } from "./event-period-chips";
import styles from "./events-page-sections.module.css";

export function EventsConsultationView({
  mode,
  period,
  events,
  user,
  now,
}: {
  mode: EventConsultationMode;
  period: EventPeriod;
  events: EventListEvent[];
  user: PermissionUser;
  now: Date;
}) {
  const view = buildEventsConsultationView({ mode, period, events, now });

  return (
    <>
      <PageHero
        compact
        eyebrow="Consulta"
        title={view.title}
        description={view.description}
      />
      <section id={EVENTS_CONSULTATION_SECTION_ID} className="scroll-mt-6">
        <div className={styles.consultationPeriodChips}>
          <PeriodChips mode={mode} activePeriod={period} />
        </div>
        {view.filteredEvents.length > 0 ? (
          <EventList
            events={view.filteredEvents}
            user={user}
            now={now}
            variant={mode === "sem-presenca" ? "pendingConsultation" : "historyConsultation"}
          />
        ) : (
          <EmptyState
            title={mode === "historico" ? "Nenhum histórico neste período" : "Tudo em dia neste período"}
            action={(
              <ButtonLink href={ROUTES.events} variant="quiet" size="sm" className="rounded-full">
                Voltar para encontros
              </ButtonLink>
            )}
          >
            {view.emptyMessage}
          </EmptyState>
        )}
      </section>
    </>
  );
}
