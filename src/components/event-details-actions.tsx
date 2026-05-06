"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GhostButton } from "@/components/ui/button";
import { readJsonResponse, isRecord } from "@/lib/json";

type EventActionStatus = "SCHEDULED" | "CHECKIN_OPEN" | "COMPLETED" | "CANCELLED";

function responseError(payload: unknown) {
  if (isRecord(payload) && typeof payload.error === "string") return payload.error;
  return "Não foi possível salvar o encontro.";
}

export function EventDetailsActions({
  eventId,
  status,
  locationName,
  defaultLocationName,
  hasPresenceData,
}: {
  eventId: string;
  status: EventActionStatus;
  locationName?: string | null;
  defaultLocationName?: string | null;
  hasPresenceData: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localLocationName, setLocalLocationName] = useState(locationName ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isCancelled = status === "CANCELLED";

  async function patchEvent(payload: { locationName?: string | null; status?: "SCHEDULED" | "CANCELLED" }, successMessage: string) {
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

  function saveLocation() {
    startTransition(() => {
      void patchEvent({ locationName: localLocationName }, "Local do encontro atualizado.");
    });
  }

  function markAsCancelled() {
    const confirmed = window.confirm("Marcar este encontro como não realizado? Use apenas quando a célula não se reuniu nesta data.");
    if (!confirmed) return;

    startTransition(() => {
      void patchEvent({ status: "CANCELLED" }, "Encontro marcado como não realizado.");
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
        Ajuste só o que mudou nesta semana. O local salvo aqui vale apenas para este encontro.
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
        />
        <GhostButton type="button" onClick={saveLocation} disabled={isPending} className="w-full rounded-xl">
          Salvar local
        </GhostButton>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Aconteceu nesta semana?</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          Use esta opção quando a célula não se reuniu. Isso evita tratar o encontro como presença atrasada.
        </p>
        {isCancelled ? (
          <GhostButton type="button" onClick={reopenMeeting} disabled={isPending} className="mt-3 w-full rounded-xl">
            Marcar que houve encontro
          </GhostButton>
        ) : (
          <GhostButton
            type="button"
            onClick={markAsCancelled}
            disabled={isPending || hasPresenceData}
            className="mt-3 w-full rounded-xl"
          >
            Não houve encontro
          </GhostButton>
        )}
        {hasPresenceData ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Este encontro já tem presença registrada. Para corrigir, use Ajustar presença.
          </p>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm font-semibold text-[var(--color-metric-presenca)]">{message}</p> : null}
      {errorMessage ? <p className="mt-3 text-sm font-semibold text-[var(--color-badge-risco-text)]">{errorMessage}</p> : null}
    </section>
  );
}
