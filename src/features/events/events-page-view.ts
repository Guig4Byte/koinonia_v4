import { isAfter } from "date-fns";
import { type AttendanceStatus } from "@/generated/prisma/client";
import { eventEffectiveLocation, isClosedWithoutPresenceStatus, closedWithoutPresenceLabel as closedStatusLabel } from "@/features/events/event-display";
import { summarizeEventPresence, type EventPresenceSummary } from "@/features/events/presence-summary";
import { canCheckInEvent, type PermissionUser } from "@/features/permissions/permissions";
import { formatShortDate, formatTime } from "@/lib/format";
import { normalizeSearchText } from "@/lib/text";
import { addBrasiliaDays, endOfBrasiliaWeek, isTodayInBrasilia, startOfBrasiliaDay, startOfBrasiliaWeek } from "@/lib/brasilia-time";

export const EVENT_LIST_LIMIT = 4;
export const EVENTS_PAGE_HISTORY_LOOKBACK_DAYS = 60;
export const EVENTS_PAGE_QUERY_LIMIT = 120;

export type EventConsultationMode = "sem-presenca" | "historico";
export type EventPeriod = "semana" | "semana-passada" | "30d";

export type EventListEvent = {
  id: string;
  churchId: string;
  title: string;
  startsAt: Date;
  status: string;
  locationName?: string | null;
  group?: {
    id: string;
    name?: string | null;
    churchId: string;
    isActive?: boolean | null;
    locationName?: string | null;
    responsibilities?: {
      userId: string;
      role: string;
      activeUntil?: Date | string | null;
    }[];
  } | null;
  attendances: { status: AttendanceStatus }[];
};

export type EventListBadgeTone = "neutral" | "ok" | "warn" | "risk" | "info";

export type EventListCardState = {
  metrics: EventPresenceSummary;
  recordedPresence: boolean;
  isPendingEvent: boolean;
  canRegisterPresence: boolean;
  label: string;
  badgeTone: EventListBadgeTone;
  actionLabel: string;
  locationName: string | null;
  pendingAgeLabel: string | null;
};

export function readEventConsultationMode(value?: string | null): EventConsultationMode | null {
  return value === "sem-presenca" || value === "historico" ? value : null;
}

export function readEventPeriod(value?: string | null): EventPeriod {
  return value === "semana-passada" || value === "30d" ? value : "semana";
}

export function eventDateTimeLabel(event: Pick<EventListEvent, "startsAt">) {
  return `${formatShortDate(event.startsAt)}, ${formatTime(event.startsAt)}`;
}

export function eventPendingAgeLabel(event: Pick<EventListEvent, "startsAt">, now: Date) {
  const elapsedDays = Math.max(0, Math.floor((startOfBrasiliaDay(now).getTime() - startOfBrasiliaDay(event.startsAt).getTime()) / 86_400_000));

  if (elapsedDays === 0) return "hoje";
  if (elapsedDays === 1) return "há 1 dia";

  return `há ${elapsedDays} dias`;
}

export function eventMeta(event: EventListEvent) {
  const dateTime = eventDateTimeLabel(event);
  const groupName = event.group?.name;

  if (!groupName) return `Encontro geral · ${dateTime}`;

  const normalizedTitle = normalizeSearchText(event.title);
  const normalizedGroup = normalizeSearchText(groupName);
  const titleAlreadyIdentifiesGroup = normalizedTitle === normalizedGroup || normalizedTitle.includes(normalizedGroup);

  return titleAlreadyIdentifiesGroup ? dateTime : `${groupName} · ${dateTime}`;
}

export function hasRecordedPresence(event: EventListEvent) {
  return summarizeEventPresence(event).hasPresenceData;
}

export function isWithinEventPeriod(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function eventPeriodRange(period: EventPeriod, now: Date) {
  const today = startOfBrasiliaDay(now);
  const currentWeekStart = startOfBrasiliaWeek(today, 1);
  const currentWeekEnd = endOfBrasiliaWeek(today, 1);

  if (period === "semana-passada") {
    const lastWeekStart = addBrasiliaDays(currentWeekStart, -7);
    const lastWeekEnd = addBrasiliaDays(currentWeekEnd, -7);
    return { start: lastWeekStart, end: lastWeekEnd };
  }

  if (period === "30d") {
    return { start: addBrasiliaDays(today, -30), end: now };
  }

  return { start: currentWeekStart, end: currentWeekEnd };
}

export function eventPeriodLabel(period: EventPeriod) {
  if (period === "semana-passada") return "Semana passada";
  if (period === "30d") return "Últimos 30 dias";
  return "Esta semana";
}

export function buildEventListCardState(event: EventListEvent, user: PermissionUser, now: Date): EventListCardState {
  const metrics = summarizeEventPresence(event);
  const recordedPresence = metrics.hasPresenceData;
  const isCancelledEvent = isClosedWithoutPresenceStatus(event.status);
  const isFutureEvent = isAfter(event.startsAt, now);
  const isPendingEvent = !isCancelledEvent && !recordedPresence && !isFutureEvent;
  const canEditPresence = !isCancelledEvent && canCheckInEvent(user, event);
  const canRegisterPresence = canEditPresence && !recordedPresence;
  const label = isCancelledEvent
    ? closedStatusLabel(event.status, "Ver encontro")
    : recordedPresence
      ? "Presença registrada"
      : isFutureEvent
        ? "Agendado"
        : canRegisterPresence
          ? "Presença pendente"
          : "Aguardando registro";
  const badgeTone: EventListBadgeTone = isCancelledEvent ? "neutral" : recordedPresence ? "ok" : isFutureEvent ? "info" : "warn";
  const actionLabel = canRegisterPresence
    ? "Registrar presença"
    : recordedPresence
      ? "Ver detalhes"
      : "Ver encontro";

  return {
    metrics,
    recordedPresence,
    isPendingEvent,
    canRegisterPresence,
    label,
    badgeTone,
    actionLabel,
    locationName: eventEffectiveLocation(event),
    pendingAgeLabel: isPendingEvent ? eventPendingAgeLabel(event, now) : null,
  };
}

function pluralizeCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildEventsConsultationView({
  mode,
  period,
  events,
  now,
}: {
  mode: EventConsultationMode;
  period: EventPeriod;
  events: EventListEvent[];
  now: Date;
}) {
  const { start, end } = eventPeriodRange(period, now);
  const filteredEvents = events
    .filter((event) => isWithinEventPeriod(event.startsAt, start, end))
    .filter((event) => {
      const recordedPresence = hasRecordedPresence(event);
      if (mode === "historico") return recordedPresence;
      return !isClosedWithoutPresenceStatus(event.status) && !recordedPresence && !isAfter(event.startsAt, now);
    })
    .sort((a, b) => {
      if (mode === "sem-presenca") return a.startsAt.getTime() - b.startsAt.getTime();

      return b.startsAt.getTime() - a.startsAt.getTime();
    });

  const eventCountLabel = pluralizeCount(filteredEvents.length, "encontro", "encontros");

  return {
    filteredEvents,
    title: mode === "historico" ? "Histórico de presença" : "Presenças pendentes",
    description: mode === "historico"
      ? `${eventCountLabel} com presença registrada`
      : `${eventCountLabel} aguardando registro`,
    emptyMessage: mode === "historico"
      ? "Nenhuma presença registrada neste período. Troque o filtro para conferir outros recortes."
      : "Nenhum encontro pendente neste período. Os encontros deste recorte estão em dia.",
    periodLabel: eventPeriodLabel(period),
  };
}

export function buildEventsHomeSections(events: EventListEvent[], now: Date) {
  const today = startOfBrasiliaDay(now);
  const weekStart = startOfBrasiliaWeek(today, 1);
  const weekEnd = endOfBrasiliaWeek(today, 1);

  const todayEvents = events
    .filter((event) => isTodayInBrasilia(event.startsAt, now))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const weekEvents = events
    .filter((event) => {
      if (isTodayInBrasilia(event.startsAt, now) || !isWithinEventPeriod(event.startsAt, weekStart, weekEnd)) return false;

      return !isClosedWithoutPresenceStatus(event.status) && isAfter(event.startsAt, now) && !hasRecordedPresence(event);
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return { todayEvents, weekEvents };
}
