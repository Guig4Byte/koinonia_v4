"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GhostButton } from "@/components/ui/button";
import { isClosedWithoutPresenceStatus } from "@/features/events/event-display";
import { CELL_MEETING_TIME_OPTIONS } from "@/features/events/time-options";
import { cn } from "@/lib/cn";
import { readJsonResponse, isRecord } from "@/lib/json";

type EventActionStatus = "SCHEDULED" | "CHECKIN_OPEN" | "COMPLETED" | "CANCELLED" | "NO_MEETING";
type OpenPicker = "date" | "time" | null;
type DateParts = { year: number; month: number; day: number };
type CalendarMonth = { year: number; monthIndex: number };

function responseError(payload: unknown) {
  if (isRecord(payload) && typeof payload.error === "string") return payload.error;
  return "Não foi possível salvar o encontro.";
}

const BRASILIA_UTC_OFFSET_HOURS = 3;
const BRASILIA_UTC_OFFSET_MS = BRASILIA_UTC_OFFSET_HOURS * 60 * 60 * 1000;
const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
function padDatePart(part: number) {
  return String(part).padStart(2, "0");
}

function formatBrasiliaDate({ year, month, day }: DateParts) {
  return `${padDatePart(day)}/${padDatePart(month)}/${year}`;
}

function parseBrasiliaDateValue(dateValue: string): DateParts | null {
  const rawDate = dateValue.trim();
  const isoDateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brDateMatch = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!isoDateMatch && !brDateMatch) return null;

  const year = Number(isoDateMatch?.[1] ?? brDateMatch?.[3]);
  const month = Number(isoDateMatch?.[2] ?? brDateMatch?.[2]);
  const day = Number(isoDateMatch?.[3] ?? brDateMatch?.[1]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function shiftCalendarMonth(month: CalendarMonth, amount: number): CalendarMonth {
  const next = new Date(Date.UTC(month.year, month.monthIndex + amount, 1));
  return { year: next.getUTCFullYear(), monthIndex: next.getUTCMonth() };
}

function calendarDays(month: CalendarMonth) {
  const firstWeekday = new Date(Date.UTC(month.year, month.monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(month.year, month.monthIndex + 1, 0)).getUTCDate();

  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

function toBrasiliaDateTimeParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  const brasiliaTime = new Date(date.getTime() - BRASILIA_UTC_OFFSET_MS);

  return {
    date: formatBrasiliaDate({
      year: brasiliaTime.getUTCFullYear(),
      month: brasiliaTime.getUTCMonth() + 1,
      day: brasiliaTime.getUTCDate(),
    }),
    time: [padDatePart(brasiliaTime.getUTCHours()), padDatePart(brasiliaTime.getUTCMinutes())].join(":"),
  };
}

function parseBrasiliaDateTime(dateValue: string, timeValue: string) {
  const dateParts = parseBrasiliaDateValue(dateValue);
  const timeMatch = timeValue.trim().match(/^(\d{2}):(\d{2})$/);

  if (!dateParts || !timeMatch) return null;

  const { year, month, day } = dateParts;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (hour > 23 || minute > 59) return null;

  const utcTime = Date.UTC(year, month - 1, day, hour + BRASILIA_UTC_OFFSET_HOURS, minute);
  const parsed = new Date(utcTime);
  const brasiliaCheck = new Date(parsed.getTime() - BRASILIA_UTC_OFFSET_MS);

  if (
    brasiliaCheck.getUTCFullYear() !== year ||
    brasiliaCheck.getUTCMonth() !== month - 1 ||
    brasiliaCheck.getUTCDate() !== day ||
    brasiliaCheck.getUTCHours() !== hour ||
    brasiliaCheck.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return parsed.toISOString();
}

export function EventDetailsActions({
  eventId,
  status,
  startsAt,
  locationName,
  defaultLocationName,
  hasPresenceData,
  isFutureEvent,
}: {
  eventId: string;
  status: EventActionStatus;
  startsAt: string;
  locationName?: string | null;
  defaultLocationName?: string | null;
  hasPresenceData: boolean;
  isFutureEvent: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localLocationName, setLocalLocationName] = useState(locationName ?? defaultLocationName ?? "");
  const initialStartsAt = toBrasiliaDateTimeParts(startsAt);
  const [localDate, setLocalDate] = useState(initialStartsAt.date);
  const [localTime, setLocalTime] = useState(initialStartsAt.time);
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>(() => {
    const initialDateParts = parseBrasiliaDateValue(initialStartsAt.date);
    const fallbackDate = new Date();

    return {
      year: initialDateParts?.year ?? fallbackDate.getFullYear(),
      monthIndex: initialDateParts ? initialDateParts.month - 1 : fallbackDate.getMonth(),
    };
  });
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isClosedWithoutPresence = isClosedWithoutPresenceStatus(status);
  const canReschedule = !hasPresenceData && !isClosedWithoutPresence;
  const locationActionLabel = hasPresenceData ? "Ajustar local" : "Salvar local";
  const cancelActionLabel = isFutureEvent ? "Cancelar encontro" : "Não houve encontro";
  const cancelConfirmationMessage = isFutureEvent
    ? "Cancelar este encontro? Use quando a célula já sabe que não vai se reunir nesta data."
    : "Marcar este encontro como não realizado? Use quando a célula não se reuniu nesta data.";
  const cancelledHelperText = isFutureEvent
    ? "Este encontro foi cancelado. Ele não aparece como presença pendente."
    : "Este encontro foi marcado como não realizado. Ele não entra como presença atrasada.";

  async function patchEvent(
    payload: { locationName?: string; startsAt?: string; status?: "SCHEDULED" | "CANCELLED" | "NO_MEETING" },
    successMessage: string,
  ) {
    setMessage(null);
    setErrorMessage(null);

    const response = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await readJsonResponse(response);

    if (!response.ok) {
      setErrorMessage(responseError(body));
      return;
    }

    setMessage(successMessage);
    router.refresh();
  }

  function readRequiredLocation() {
    const nextLocationName = localLocationName.trim();

    if (!nextLocationName) {
      setMessage(null);
      setErrorMessage("Informe o local deste encontro antes de salvar.");
      return null;
    }

    return nextLocationName;
  }

  function saveLocation() {
    const nextLocationName = readRequiredLocation();
    if (!nextLocationName) return;

    startTransition(() => {
      void patchEvent({ locationName: nextLocationName }, "Local do encontro atualizado.");
    });
  }

  function rescheduleMeeting() {
    const nextLocationName = readRequiredLocation();
    if (!nextLocationName) return;

    const nextStartsAt = parseBrasiliaDateTime(localDate, localTime);
    if (!nextStartsAt) {
      setMessage(null);
      setErrorMessage("Informe uma data e horário válidos no horário de Brasília.");
      return;
    }

    startTransition(() => {
      void patchEvent(
        { startsAt: nextStartsAt, locationName: nextLocationName },
        "Encontro remarcado.",
      );
    });
  }

  function markAsCancelled() {
    const confirmed = window.confirm(cancelConfirmationMessage);
    if (!confirmed) return;

    startTransition(() => {
      void patchEvent(
        { status: isFutureEvent ? "CANCELLED" : "NO_MEETING" },
        isFutureEvent ? "Encontro cancelado." : "Encontro marcado como não realizado.",
      );
    });
  }

  function reopenMeeting() {
    startTransition(() => {
      void patchEvent({ status: "SCHEDULED" }, "Encontro reaberto.");
    });
  }

  const selectedDateParts = parseBrasiliaDateValue(localDate);
  const timeOptions = localTime && !CELL_MEETING_TIME_OPTIONS.includes(localTime)
    ? [localTime, ...CELL_MEETING_TIME_OPTIONS]
    : CELL_MEETING_TIME_OPTIONS;

  function updateLocalDate(value: string) {
    setLocalDate(value);

    const nextDateParts = parseBrasiliaDateValue(value);
    if (nextDateParts) {
      setCalendarMonth({ year: nextDateParts.year, monthIndex: nextDateParts.month - 1 });
    }
  }

  function selectCalendarDay(day: number) {
    const nextDate = formatBrasiliaDate({
      year: calendarMonth.year,
      month: calendarMonth.monthIndex + 1,
      day,
    });

    setLocalDate(nextDate);
    setOpenPicker(null);
  }

  function selectTime(time: string) {
    setLocalTime(time);
    setOpenPicker(null);
  }

  return (
    <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <p className="font-semibold text-[var(--color-text-primary)]">Ajustes do encontro</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        Ajuste só o que mudou nesta semana. Estas alterações valem apenas para este encontro.
      </p>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor="event-location-name">
        Local deste encontro
      </label>
      <div className="mt-2 flex flex-col gap-2">
        <input
          id="event-location-name"
          value={localLocationName}
          onChange={(event) => setLocalLocationName(event.target.value)}
          placeholder={defaultLocationName ? `Padrão: ${defaultLocationName}` : "Ex.: Casa da família Souza"}
          className="min-h-11 rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
          maxLength={160}
          required
        />
        <GhostButton type="button" onClick={saveLocation} disabled={isPending} className="w-full rounded-xl">
          {locationActionLabel}
        </GhostButton>
      </div>

      {canReschedule ? (
        <div className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Remarcar encontro</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Use quando a célula vai se reunir em outro dia ou horário. O local informado acima será salvo junto.
          </p>
          <div className="event-reschedule-fields mt-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor="event-start-date">
                Nova data
              </label>
              <div className="event-picker-field">
                <input
                  id="event-start-date"
                  value={localDate}
                  onChange={(event) => updateLocalDate(event.target.value)}
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  className="event-picker-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
                />
                <button
                  type="button"
                  className="event-picker-trigger"
                  aria-label="Escolher data"
                  aria-expanded={openPicker === "date"}
                  onClick={() => setOpenPicker(openPicker === "date" ? null : "date")}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                </button>
                {openPicker === "date" ? (
                  <div className="event-picker-popover event-calendar-popover">
                    <div className="event-calendar-header">
                      <button type="button" onClick={() => setCalendarMonth((current) => shiftCalendarMonth(current, -1))} aria-label="Mês anterior">
                        ‹
                      </button>
                      <span>{MONTH_NAMES[calendarMonth.monthIndex]} {calendarMonth.year}</span>
                      <button type="button" onClick={() => setCalendarMonth((current) => shiftCalendarMonth(current, 1))} aria-label="Próximo mês">
                        ›
                      </button>
                    </div>
                    <div className="event-calendar-weekdays">
                      {WEEKDAY_LABELS.map((label, index) => (
                        <span key={`${label}-${index}`}>{label}</span>
                      ))}
                    </div>
                    <div className="event-calendar-grid">
                      {calendarDays(calendarMonth).map((day, index) => {
                        const selected = Boolean(
                          day &&
                          selectedDateParts?.year === calendarMonth.year &&
                          selectedDateParts.month === calendarMonth.monthIndex + 1 &&
                          selectedDateParts.day === day,
                        );

                        return day ? (
                          <button
                            key={`${calendarMonth.year}-${calendarMonth.monthIndex}-${day}`}
                            type="button"
                            className={cn("event-calendar-day", selected && "event-calendar-day-selected")}
                            onClick={() => selectCalendarDay(day)}
                          >
                            {day}
                          </button>
                        ) : (
                          <span key={`empty-${index}`} className="event-calendar-empty" aria-hidden="true" />
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor="event-start-time">
                Novo horário
              </label>
              <div className="event-picker-field">
                <input
                  id="event-start-time"
                  value={localTime}
                  onChange={(event) => setLocalTime(event.target.value)}
                  inputMode="numeric"
                  placeholder="HH:mm"
                  maxLength={5}
                  className="event-picker-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
                />
                <button
                  type="button"
                  className="event-picker-trigger"
                  aria-label="Escolher horário"
                  aria-expanded={openPicker === "time"}
                  onClick={() => setOpenPicker(openPicker === "time" ? null : "time")}
                >
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </button>
                {openPicker === "time" ? (
                  <div className="event-picker-popover event-time-popover">
                    {timeOptions.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={cn("event-time-option", localTime === time && "event-time-option-selected")}
                        onClick={() => selectTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Data e horário seguem Brasília (UTC-3), em formato 24h.
          </p>
          <GhostButton type="button" onClick={rescheduleMeeting} disabled={isPending} className="mt-3 w-full rounded-xl">
            Remarcar encontro
          </GhostButton>
        </div>
      ) : null}

      {hasPresenceData ? (
        <p className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          Este encontro já tem presença registrada. O local ainda pode ser ajustado, mas o encontro não pode ser cancelado ou remarcado.
        </p>
      ) : isClosedWithoutPresence ? (
        <div className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Aconteceu nesta semana?</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{cancelledHelperText}</p>
          <GhostButton type="button" onClick={reopenMeeting} disabled={isPending} className="mt-3 w-full rounded-xl">
            Marcar que houve encontro
          </GhostButton>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {isFutureEvent ? "Este encontro vai acontecer?" : "Aconteceu nesta semana?"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {isFutureEvent
              ? "Use esta opção quando a célula já sabe que não vai se reunir nesta data."
              : "Use esta opção quando a célula não se reuniu. Isso evita tratar o encontro como presença atrasada."}
          </p>
          <GhostButton
            type="button"
            onClick={markAsCancelled}
            disabled={isPending}
            className="mt-3 w-full rounded-xl"
          >
            {cancelActionLabel}
          </GhostButton>
        </div>
      )}

      {message ? <p className="mt-3 text-sm font-semibold text-[var(--color-metric-presenca)]">{message}</p> : null}
      {errorMessage ? <p className="mt-3 text-sm font-semibold text-[var(--color-badge-risco-text)]">{errorMessage}</p> : null}
    </section>
  );
}
