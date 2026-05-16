import { FilterChip } from "@/components/ui/filter-chip";
import { eventPeriodLabel, type EventConsultationMode, type EventPeriod } from "@/features/events/events-page-view";
import { eventsConsultationSectionHref } from "./event-consultation-routes";

export function PeriodChips({ mode, activePeriod }: { mode: EventConsultationMode; activePeriod: EventPeriod }) {
  const periods: EventPeriod[] = mode === "historico" ? ["semana", "semana-passada", "30d"] : ["semana", "30d"];

  return (
    <div className="k-filter-row">
      {periods.map((period) => {
        const active = period === activePeriod;
        return (
          <FilterChip
            key={period}
            href={eventsConsultationSectionHref(mode, period)}
            active={active}
            variant="period"
          >
            {eventPeriodLabel(period)}
          </FilterChip>
        );
      })}
    </div>
  );
}
