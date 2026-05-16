import { ROUTES } from "@/lib/routes";
import type { EventConsultationMode, EventPeriod } from "@/features/events/events-page-view";

export const EVENTS_CONSULTATION_SECTION_ID = "eventos-consulta";

export function eventsConsultationSectionHref(mode: EventConsultationMode, period: EventPeriod) {
  return `${ROUTES.eventsConsultation(mode, period)}#${EVENTS_CONSULTATION_SECTION_ID}`;
}
