import { CalendarClock, ClipboardCheck, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/base-cards";
import { PageHero } from "@/components/shared/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { buildEventsConsultationView, type EventConsultationMode, type EventListEvent, type EventPeriod } from "@/features/events/events-page-view";
import type { PermissionUser } from "@/features/permissions/permissions";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { EVENTS_CONSULTATION_SECTION_ID, eventsConsultationSectionHref } from "./event-consultation-routes";
import { EventList } from "./event-list";
import { PeriodChips } from "./event-period-chips";
import styles from "./events-page-sections.module.css";

type ConsultationModeTabProps = {
  mode: EventConsultationMode;
  activeMode: EventConsultationMode;
  period: EventPeriod;
  count: number;
  icon: LucideIcon;
  label: string;
};

function ConsultationModeTab({ mode, activeMode, period, count, icon: Icon, label }: ConsultationModeTabProps) {
  const active = mode === activeMode;

  return (
    <ButtonLink
      href={eventsConsultationSectionHref(mode, period)}
      variant="quiet"
      size="sm"
      shape="rounded"
      aria-current={active ? "page" : undefined}
      className={cn(styles.consultationModeTab, active && styles.consultationModeTabActive)}
    >
      <Icon className={styles.consultationModeIcon} aria-hidden="true" />
      <span className={styles.consultationModeLabel}>{label}</span>
      <span className={styles.consultationModeCount}>{count}</span>
    </ButtonLink>
  );
}

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
  const pendingView = buildEventsConsultationView({ mode: "sem-presenca", period, events, now });
  const historyView = buildEventsConsultationView({ mode: "historico", period, events, now });

  return (
    <>
      <PageHero
        compact
        eyebrow="Consulta"
        title="Consulta de encontros"
        description="Pendências e histórico ficam juntos nesta consulta."
      />
      <section id={EVENTS_CONSULTATION_SECTION_ID} className="scroll-mt-6">
        <nav className={styles.consultationModeTabs} aria-label="Tipo de consulta">
          <ConsultationModeTab
            mode="sem-presenca"
            activeMode={mode}
            period={period}
            count={pendingView.filteredEvents.length}
            icon={ClipboardCheck}
            label="Aguardando registro"
          />
          <ConsultationModeTab
            mode="historico"
            activeMode={mode}
            period={period}
            count={historyView.filteredEvents.length}
            icon={CalendarClock}
            label="Histórico"
          />
        </nav>

        <div className={styles.consultationPeriodChips}>
          <PeriodChips mode={mode} activePeriod={period} />
        </div>
        {view.filteredEvents.length > 0 ? (
          <EventList
            events={view.filteredEvents}
            user={user}
            now={now}
            variant={mode === "sem-presenca" ? "pendingConsultation" : "default"}
          />
        ) : (
          <EmptyState
            title={mode === "historico" ? "Nenhum histórico neste período" : "Tudo em dia neste período"}
            action={(
              <ButtonLink href={ROUTES.events} variant="quiet" size="sm" shape="pill">
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
