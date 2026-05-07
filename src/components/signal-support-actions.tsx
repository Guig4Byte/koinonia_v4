"use client";

import { ArrowLeft, LifeBuoy, NotebookPen, SendHorizontal, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { readApiMessage } from "@/lib/json";

type SupportAction = "REQUEST_SUPERVISOR" | "ESCALATE_PASTOR";
type FlowStage = "idle" | "request-supervisor" | "escalate-pastor";
type SignalSupportActionsProps = {
  signalId: string;
  assignmentMessage?: string | null;
  canRequestSupervisor?: boolean;
  canEscalatePastor?: boolean;
};

const actionCopy: Record<Exclude<FlowStage, "idle">, { action: SupportAction; title: string; detail: string; label: string; icon: LucideIcon }> = {
  "request-supervisor": {
    action: "REQUEST_SUPERVISOR",
    title: "Pedir apoio à supervisão?",
    detail: "A liderança continua acompanhando, mas a supervisão também verá este cuidado.",
    label: "Pedir apoio",
    icon: LifeBuoy,
  },
  "escalate-pastor": {
    action: "ESCALATE_PASTOR",
    title: "Encaminhar ao pastor?",
    detail: "Use quando este cuidado pede um olhar pastoral mais próximo.",
    label: "Encaminhar",
    icon: SendHorizontal,
  },
};

export function SignalSupportActions({
  signalId,
  assignmentMessage,
  canRequestSupervisor = false,
  canEscalatePastor = false,
}: SignalSupportActionsProps) {
  const router = useRouter();
  const noteId = useId();
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<FlowStage>("idle");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const label = assignmentMessage ?? null;

  function resetFlow() {
    setStage("idle");
    setNote("");
    setErrorMessage("");
  }

  function send(action: SupportAction, noteValue?: string) {
    setErrorMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/signals/${signalId}/support`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: noteValue?.trim() || undefined }),
      });

      const body = await readApiMessage(response);

      if (!response.ok) {
        setErrorMessage(body?.error ?? "Não foi possível pedir apoio agora.");
        return;
      }

      resetFlow();
      router.refresh();
    });
  }

  const buttonClass =
    "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
  const primaryButtonClass =
    "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-btn-primary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-primary-text)] transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

  if (!label && !canRequestSupervisor && !canEscalatePastor) return null;

  const currentActionCopy = stage === "idle" ? null : actionCopy[stage];
  const CurrentIcon = currentActionCopy?.icon ?? NotebookPen;

  return (
    <div className="mt-3 space-y-2 border-t border-[var(--color-border-divider)] pt-3">
      {canRequestSupervisor || canEscalatePastor ? (
        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
          Use apoio quando o próximo gesto precisa de outra liderança. A responsabilidade local continua simples.
        </p>
      ) : null}
      {label ? (
        <p className="rounded-2xl border border-[var(--color-badge-apoio-border)] bg-[var(--color-badge-apoio-bg)] px-3 py-2 text-xs font-semibold leading-relaxed text-[var(--color-badge-apoio-text)]">
          {label}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-2xl border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-badge-risco-text)]">
          {errorMessage}
        </p>
      ) : null}

      {stage === "idle" ? (
        <>
          {canRequestSupervisor ? (
            <button type="button" disabled={isPending} onClick={() => setStage("request-supervisor")} className={buttonClass}>
              <LifeBuoy className="h-4 w-4" strokeWidth={2.2} />
              Pedir apoio
            </button>
          ) : null}

          {canEscalatePastor ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStage("escalate-pastor")}
              className={cn(buttonClass, "border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[var(--color-badge-risco-text)]")}
            >
              <SendHorizontal className="h-4 w-4" strokeWidth={2.2} />
              Encaminhar ao pastor
            </button>
          ) : null}
        </>
      ) : null}

      {currentActionCopy ? (
        <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{currentActionCopy.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{currentActionCopy.detail}</p>

          <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor={noteId}>
            Contexto opcional
          </label>
          <textarea
            id={noteId}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ex.: Tentei contato, mas ainda não consegui falar."
            className="mt-2 w-full resize-none rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-brand)]"
          />

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" disabled={isPending} onClick={() => send(currentActionCopy.action, note)} className={primaryButtonClass}>
              <CurrentIcon className="h-4 w-4" strokeWidth={2.2} />
              {isPending ? "Salvando..." : currentActionCopy.label}
            </button>
            <button type="button" disabled={isPending} onClick={resetFlow} className={buttonClass}>
              <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
