"use client";

import { CheckCircle2, MessageCircleMore, NotebookPen, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/cn";

type ContactKind = "CALL" | "WHATSAPP";
type FlowStage = "idle" | "confirm" | "confirm-existing" | "ask-note" | "note" | "done";

function digitsOnly(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

export function CareActions({ personId, phone }: { personId?: string; phone?: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<FlowStage>("idle");
  const [note, setNote] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [resolvedMessage, setResolvedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastContactKind, setLastContactKind] = useState<ContactKind | null>(null);
  const digits = digitsOnly(phone);
  const hasPhone = digits.length >= 10;

  const links = useMemo(
    () => ({
      tel: hasPhone ? `tel:+${digits}` : undefined,
      whatsapp: hasPhone ? `https://wa.me/${digits}` : undefined,
    }),
    [digits, hasPhone],
  );

  function resetFlow() {
    setStage("idle");
    setNote("");
    setErrorMessage("");
    setLastContactKind(null);
  }

  function registerContact(noteValue?: string) {
    if (!personId) return;

    setErrorMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/care/${personId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: lastContactKind ?? "MARKED_CARED",
          note: noteValue?.trim() || undefined,
          resolveOpenSignals: true,
        }),
      });

      const responseBody = await response.json().catch(() => null) as { error?: string; message?: string } | null;

      if (!response.ok) {
        setErrorMessage(responseBody?.error ?? "Não foi possível registrar o cuidado agora.");
        return;
      }

      setSavedMessage(noteValue?.trim() ? "Cuidado realizado com anotação." : "Cuidado realizado.");
      setResolvedMessage(responseBody?.message ?? "Os motivos de atenção foram atualizados sem formalizar acompanhamento.");
      setErrorMessage("");
      setStage("done");
      setNote("");
      setLastContactKind(null);
      router.refresh();
    });
  }

  const buttonBase =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold leading-none tracking-[-0.01em] shadow-card transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]";
  const secondaryButton =
    "inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98]";
  const disabled = "pointer-events-none cursor-not-allowed opacity-50";

  if (stage === "done") {
    return (
      <div aria-live="polite" className="mt-3 rounded-2xl border border-[var(--color-badge-cuidado-border)] bg-[var(--color-badge-cuidado-bg)] p-3 text-sm text-[var(--color-text-primary)]">
        <div className="flex items-center gap-2 font-semibold text-[var(--color-badge-cuidado-text)]">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
          {savedMessage}
        </div>
        <p className="mt-1 text-[var(--color-text-secondary)]">{resolvedMessage || "Registrado no cuidado recente."}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2.5">
      {errorMessage ? (
        <div aria-live="assertive" className="rounded-2xl border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] p-3 text-sm font-semibold text-[var(--color-badge-risco-text)]">
          {errorMessage}
        </div>
      ) : null}

      {stage === "idle" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={links.tel}
              aria-disabled={!hasPhone}
              className={cn(buttonBase, "border", !hasPhone && disabled)}
              style={{
                backgroundColor: "var(--color-action-call-bg)",
                borderColor: "var(--color-action-call-border)",
                color: "var(--color-action-call-text)",
              }}
              onClick={(event) => {
                if (!hasPhone) {
                  event.preventDefault();
                  return;
                }

                setErrorMessage("");
                setLastContactKind("CALL");
                setStage("confirm");
              }}
            >
              <Phone className="h-4 w-4" strokeWidth={2.3} />
              Ligar
            </a>

            <a
              href={links.whatsapp}
              target={hasPhone ? "_blank" : undefined}
              rel={hasPhone ? "noreferrer" : undefined}
              aria-disabled={!hasPhone}
              className={cn(buttonBase, "border", !hasPhone && disabled)}
              style={{
                backgroundColor: "var(--color-action-whatsapp-bg)",
                borderColor: "var(--color-action-whatsapp-border)",
                color: "var(--color-action-whatsapp-text)",
              }}
              onClick={(event) => {
                if (!hasPhone) {
                  event.preventDefault();
                  return;
                }

                setErrorMessage("");
                setLastContactKind("WHATSAPP");
                setStage("confirm");
              }}
            >
              <MessageCircleMore className="h-4 w-4" strokeWidth={2.3} />
              WhatsApp
            </a>
          </div>

          {personId ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setErrorMessage("");
                setLastContactKind(null);
                setStage("confirm-existing");
              }}
              className={cn(secondaryButton, "w-full", isPending && disabled)}
            >
              Já houve contato?
            </button>
          ) : null}
        </>
      ) : null}

      {stage === "confirm" ? (
        <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">O contato aconteceu?</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Nada será registrado se você ainda não conseguiu falar com a pessoa.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!personId || isPending}
              onClick={() => setStage("ask-note")}
              className={cn(buttonBase, "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]", (!personId || isPending) && disabled)}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
              Sim, houve contato
            </button>
            <button type="button" disabled={isPending} onClick={resetFlow} className={cn(secondaryButton, isPending && disabled)}>
              Ainda não
            </button>
          </div>
        </div>
      ) : null}

      {stage === "confirm-existing" ? (
        <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">O cuidado já aconteceu?</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Use quando você já ligou, mandou mensagem ou conversou fora do Koinonia. A atenção só será fechada depois da próxima confirmação.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!personId || isPending}
              onClick={() => setStage("ask-note")}
              className={cn(buttonBase, "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]", (!personId || isPending) && disabled)}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
              Sim, já houve
            </button>
            <button type="button" disabled={isPending} onClick={resetFlow} className={cn(secondaryButton, isPending && disabled)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {stage === "ask-note" ? (
        <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Quer deixar uma anotação?</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Salvar sem anotação também registra o cuidado e atualiza os motivos de atenção no seu escopo.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStage("note")}
              className={cn(buttonBase, "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]", isPending && disabled)}
            >
              <NotebookPen className="h-4 w-4" strokeWidth={2.2} />
              Anotar
            </button>
            <button type="button" disabled={isPending} onClick={() => registerContact()} className={cn(secondaryButton, isPending && disabled)}>
              {isPending ? "Salvando..." : "Salvar sem anotação"}
            </button>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={resetFlow}
            className={cn("mt-2 min-h-9 w-full text-xs font-semibold text-[var(--color-text-secondary)] transition active:scale-[0.98]", isPending && disabled)}
          >
            Cancelar e não registrar agora
          </button>
        </div>
      ) : null}

      {stage === "note" ? (
        <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor={`note-${personId ?? "person"}`}>
            Observação opcional
          </label>
          <textarea
            id={`note-${personId ?? "person"}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ex.: Orei com ele. Está melhor. Pediu ajuda pela família."
            className="w-full resize-none rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-brand)]"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setStage("ask-note");
                setNote("");
              }}
              className={cn(secondaryButton, isPending && disabled)}
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={!note.trim() || isPending}
              onClick={() => registerContact(note)}
              className={cn(buttonBase, "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]", (!note.trim() || isPending) && disabled)}
            >
              {isPending ? "Salvando..." : "Salvar cuidado"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
