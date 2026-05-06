"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GhostButton } from "@/components/ui/button";
import { readJsonResponse, isRecord } from "@/lib/json";

type EventActionStatus = "SCHEDULED" | "CHECKIN_OPEN" | "COMPLETED" | "CANCELLED" | "NO_MEETING";

function responseError(payload: unknown) {
  if (isRecord(payload) && typeof payload.error === "string") return payload.error;
  return "Não foi possível salvar o encontro.";
}

const BRASILIA_UTC_OFFSET_HOURS = 3;
const BRASILIA_UTC_OFFSET_MS = BRASILIA_UTC_OFFSET_HOURS * 60 * 60 * 1000;

function padDatePart(part: number) {
  return String(part).padStart(2, "0");
}

function toBrasiliaDateTimeParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  const brasiliaTime = new Date(date.getTime() - BRASILIA_UTC_OFFSET_MS);

  return {
    date: [
      brasiliaTime.getUTCFullYear(),
      padDatePart(brasiliaTime.getUTCMonth() + 1),
      padDatePart(brasiliaTime.getUTCDate()),
    ].join("-"),
    time: [padDatePart(brasiliaTime.getUTCHours()), padDatePart(brasiliaTime.getUTCMinutes())].join(":"),
  };
}

function parseBrasiliaDateTime(dateValue: string, timeValue: string) {
  const rawDate = dateValue.trim();
  const isoDateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brDateMatch = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const timeMatch = timeValue.trim().match(/^(\d{2}):(\d{2})$/);

  if ((!isoDateMatch && !brDateMatch) || !timeMatch) return null;

  const year = Number(isoDateMatch?.[1] ?? brDateMatch?.[3]);
  const month = Number(isoDateMatch?.[2] ?? brDateMatch?.[2]);
  const day = Number(isoDateMatch?.[3] ?? brDateMatch?.[1]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

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
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isClosedWithoutPresence = status === "CANCELLED" || status === "NO_MEETING";
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
              <div className="event-datetime-field">
                <CalendarDays className="event-datetime-icon h-4 w-4" aria-hidden="true" />
                <input
                  id="event-start-date"
                  type="date"
                  lang="pt-BR"
                  value={localDate}
                  onChange={(event) => setLocalDate(event.target.value)}
                  className="event-datetime-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] pr-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor="event-start-time">
                Novo horário
              </label>
              <div className="event-datetime-field">
                <Clock3 className="event-datetime-icon h-4 w-4" aria-hidden="true" />
                <input
                  id="event-start-time"
                  type="time"
                  lang="pt-BR"
                  value={localTime}
                  onChange={(event) => setLocalTime(event.target.value)}
                  step="300"
                  className="event-datetime-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] pr-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                />
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
