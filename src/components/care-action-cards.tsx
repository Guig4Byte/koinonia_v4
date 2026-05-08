import type { MouseEvent } from "react";
import { ArrowLeft, CheckCircle2, MessageCircleMore, NotebookPen, Phone } from "lucide-react";
import { cn } from "@/lib/cn";
import { CARE_NOTE_MAX_LENGTH, type CareContactLinks } from "@/features/care/care-actions-view";

const buttonBase =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-sm font-semibold leading-tight tracking-[-0.01em] shadow-card transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]";
const secondaryButton =
  "inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-4 py-3 text-center text-sm font-semibold leading-tight text-[var(--color-btn-secondary-text)] transition active:scale-[0.98]";
const disabled = "pointer-events-none cursor-not-allowed opacity-50";

export function CareDoneMessage({ savedMessage, resolvedMessage }: { savedMessage: string; resolvedMessage?: string }) {
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

export function CareErrorMessage({ message }: { message: string }) {
  return (
    <div aria-live="assertive" className="rounded-2xl border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] p-3 text-sm font-semibold text-[var(--color-badge-risco-text)]">
      {message}
    </div>
  );
}

export function CareContactStart({
  links,
  hasPhone,
  canRegisterCare,
  isPending,
  onContactAttempt,
  onExistingContact,
}: {
  links: CareContactLinks;
  hasPhone: boolean;
  canRegisterCare: boolean;
  isPending: boolean;
  onContactAttempt: () => void;
  onExistingContact: () => void;
}) {
  function handleContactClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!hasPhone) {
      event.preventDefault();
      return;
    }

    onContactAttempt();
  }

  return (
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
          onClick={handleContactClick}
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
          onClick={handleContactClick}
        >
          <MessageCircleMore className="h-4 w-4" strokeWidth={2.3} />
          WhatsApp
        </a>
      </div>

      {canRegisterCare ? (
        <button type="button" disabled={isPending} onClick={onExistingContact} className={cn(secondaryButton, isPending && disabled)}>
          Já houve contato?
        </button>
      ) : null}
    </>
  );
}

export function CareConfirmCard({
  variant,
  canRegisterCare,
  isPending,
  onConfirm,
  onCancel,
}: {
  variant: "contact" | "existing";
  canRegisterCare: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const content =
    variant === "contact"
      ? {
          title: "O contato aconteceu?",
          description: "Nada será registrado se você ainda não conseguiu falar com a pessoa.",
          confirmLabel: "Sim, houve contato",
          cancelLabel: "Ainda não",
        }
      : {
          title: "O cuidado já aconteceu?",
          description: "Use quando você já ligou, mandou mensagem ou conversou fora do Koinonia. A atenção só será fechada depois da próxima confirmação.",
          confirmLabel: "Sim, já houve",
          cancelLabel: "Cancelar",
        };

  return (
    <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{content.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{content.description}</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!canRegisterCare || isPending}
          onClick={onConfirm}
          className={cn(buttonBase, "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]", (!canRegisterCare || isPending) && disabled)}
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
          {content.confirmLabel}
        </button>
        <button type="button" disabled={isPending} onClick={onCancel} className={cn(secondaryButton, isPending && disabled)}>
          {content.cancelLabel}
        </button>
      </div>
    </div>
  );
}

export function CareAskNoteCard({
  isPending,
  onAddNote,
  onSaveWithoutNote,
  onCancel,
}: {
  isPending: boolean;
  onAddNote: () => void;
  onSaveWithoutNote: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Quer deixar uma anotação?</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Salvar sem anotação também registra o cuidado e mantém a pessoa no radar certo.</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" disabled={isPending} onClick={onAddNote} className={cn(buttonBase, "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]", isPending && disabled)}>
          <NotebookPen className="h-4 w-4" strokeWidth={2.2} />
          Anotar
        </button>
        <button type="button" disabled={isPending} onClick={onSaveWithoutNote} className={cn(secondaryButton, isPending && disabled)}>
          {isPending ? "Salvando..." : "Salvar sem anotação"}
        </button>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={onCancel}
        className={cn("mt-2 min-h-9 w-full text-center text-xs font-semibold leading-relaxed text-[var(--color-text-secondary)] transition active:scale-[0.98]", isPending && disabled)}
      >
        Cancelar e não registrar agora
      </button>
    </div>
  );
}

export function CareNoteCard({
  noteId,
  note,
  isPending,
  onNoteChange,
  onBack,
  onSave,
}: {
  noteId: string;
  note: string;
  isPending: boolean;
  onNoteChange: (value: string) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  const hasNote = Boolean(note.trim());

  return (
    <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor={noteId}>
        Observação opcional
      </label>
      <textarea
        id={noteId}
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        rows={3}
        maxLength={CARE_NOTE_MAX_LENGTH}
        placeholder="Ex.: Orei com ele. Está melhor. Pediu ajuda pela família."
        className="w-full resize-none rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-brand)]"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" disabled={isPending} onClick={onBack} className={cn(secondaryButton, isPending && disabled)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </button>
        <button type="button" disabled={!hasNote || isPending} onClick={onSave} className={cn(buttonBase, "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]", (!hasNote || isPending) && disabled)}>
          {isPending ? "Salvando..." : "Salvar cuidado"}
        </button>
      </div>
    </div>
  );
}
