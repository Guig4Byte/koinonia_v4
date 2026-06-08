import type { MouseEvent } from "react";
import { ArrowLeft, CheckCircle2, MessageCircleMore, NotebookPen, Phone } from "lucide-react";
import { CARE_NOTE_MAX_LENGTH, type CareContactLinks, type CareContactMethod } from "@/features/care/care-actions-view";
import { CARE_COPY, careConfirmContactCopy } from "@/features/care/care-copy";
import { ActionTextareaPanel } from "@/components/shared/action-textarea-panel";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button, buttonClassName } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

const disabledLinkClass = "pointer-events-none cursor-not-allowed saturate-75";

export function CareDoneMessage({ savedMessage, resolvedMessage }: { savedMessage: string; resolvedMessage?: string }) {
  return (
    <Feedback tone="care" title={savedMessage} ariaLive="polite" className="mt-3">
      {resolvedMessage || CARE_COPY.feedback.recentCareRegistered}
    </Feedback>
  );
}

export function CareErrorMessage({ message }: { message: string }) {
  return (
    <Feedback tone="error" role="alert" ariaLive="assertive" className="font-semibold">
      {message}
    </Feedback>
  );
}

export function CareContactStart({
  links,
  hasPhone,
  displayPhone,
  canRegisterCare,
  isPending,
  onContactAttempt,
  onExistingContact,
}: {
  links: CareContactLinks;
  hasPhone: boolean;
  displayPhone?: string;
  canRegisterCare: boolean;
  isPending: boolean;
  onContactAttempt: (method: CareContactMethod) => void;
  onExistingContact: () => void;
}) {
  function handleContactClick(event: MouseEvent<HTMLAnchorElement>, method: CareContactMethod) {
    if (!hasPhone) {
      event.preventDefault();
      return;
    }

    onContactAttempt(method);
  }

  return (
    <>
      {hasPhone ? (
        <div className="space-y-2.5">
          {displayPhone ? (
            <p
              className="flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-[length:var(--text-sm)] font-semibold text-[color:var(--color-text-secondary)]"
              style={{
                backgroundColor: "color-mix(in srgb, var(--brown-400) 6%, transparent)",
                borderColor: "color-mix(in srgb, var(--brown-400) 18%, var(--color-border-card))",
              }}
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2.2} />
              <span className="shrink-0">{CARE_COPY.contactActions.phoneLabel}</span>
              <span className="min-w-0 truncate text-[color:var(--color-text-primary)]">{displayPhone}</span>
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!hasPhone}
              className={cn(buttonClassName({ fullWidth: true }), "border", !hasPhone && disabledLinkClass)}
              style={{
                backgroundColor: "var(--color-action-whatsapp-bg)",
                borderColor: "var(--color-action-whatsapp-border)",
                color: "var(--color-action-whatsapp-text)",
              }}
              onClick={(event) => handleContactClick(event, "whatsapp")}
            >
              <MessageCircleMore className="h-4 w-4" strokeWidth={2.3} />
              {CARE_COPY.contactActions.whatsappLabel}
            </a>

            <a
              href={links.tel}
              aria-disabled={!hasPhone}
              className={cn(buttonClassName({ fullWidth: true }), "border", !hasPhone && disabledLinkClass)}
              style={{
                backgroundColor: "var(--color-action-call-bg)",
                borderColor: "var(--color-action-call-border)",
                color: "var(--color-action-call-text)",
              }}
              onClick={(event) => handleContactClick(event, "call")}
            >
              <Phone className="h-4 w-4" strokeWidth={2.3} />
              {CARE_COPY.contactActions.callLabel}
            </a>
          </div>

          <p className="text-[length:var(--text-xs)] font-medium leading-relaxed text-[color:var(--color-text-secondary)]">
            {CARE_COPY.contactActions.whatsappHint}
          </p>
        </div>
      ) : (
        <Feedback tone="info" title={CARE_COPY.contactActions.noPhoneTitle} compact>
          {CARE_COPY.contactActions.noPhoneDescription}
        </Feedback>
      )}

      {canRegisterCare ? (
        <div className="pt-2.5">
          <Button type="button" size="md" fullWidth disabled={isPending} onClick={onExistingContact}>
            {hasPhone ? CARE_COPY.contactActions.existingContactLabel : CARE_COPY.contactActions.registerWithoutPhoneLabel}
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function CareConfirmCard({
  variant,
  method,
  canRegisterCare,
  isPending,
  onConfirm,
  onCancel,
}: {
  variant: "contact" | "existing";
  method?: CareContactMethod;
  canRegisterCare: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const content = variant === "contact" ? careConfirmContactCopy(method) : CARE_COPY.confirmExistingContact;

  return (
    <ActionPanel title={content.title} description={content.description}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" fullWidth disabled={!canRegisterCare || isPending} onClick={onConfirm}>
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
          {content.confirmLabel}
        </Button>
        <Button type="button" variant="secondary" fullWidth disabled={isPending} onClick={onCancel}>
          {content.cancelLabel}
        </Button>
      </div>
    </ActionPanel>
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
    <ActionPanel title={CARE_COPY.notePrompt.title} description={CARE_COPY.notePrompt.description}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" fullWidth disabled={isPending} onClick={onAddNote}>
          <NotebookPen className="h-4 w-4" strokeWidth={2.2} />
          {CARE_COPY.notePrompt.addNoteLabel}
        </Button>
        <Button type="button" variant="secondary" fullWidth disabled={isPending} onClick={onSaveWithoutNote}>
          {isPending ? CARE_COPY.noteForm.savingLabel : CARE_COPY.notePrompt.saveWithoutNoteLabel}
        </Button>
      </div>
      <Button type="button" variant="ghost" size="sm" density="compact" fullWidth disabled={isPending} onClick={onCancel} className="mt-2">
        {CARE_COPY.notePrompt.cancelLabel}
      </Button>
    </ActionPanel>
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
    <ActionTextareaPanel
      title={CARE_COPY.notePrompt.title}
      fieldId={noteId}
      fieldLabel={CARE_COPY.noteForm.label}
      value={note}
      onValueChange={onNoteChange}
      maxLength={CARE_NOTE_MAX_LENGTH}
      placeholder={CARE_COPY.noteForm.placeholder}
      actions={[
        {
          id: "back",
          label: CARE_COPY.noteForm.backLabel,
          icon: <ArrowLeft className="h-4 w-4" aria-hidden="true" />,
          variant: "secondary",
          disabled: isPending,
          onClick: onBack,
        },
        {
          id: "save",
          label: isPending ? CARE_COPY.noteForm.savingLabel : CARE_COPY.noteForm.saveLabel,
          disabled: !hasNote || isPending,
          onClick: onSave,
        },
      ]}
    />
  );
}
