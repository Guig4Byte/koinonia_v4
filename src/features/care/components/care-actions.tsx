"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CareAskNoteCard,
  CareConfirmCard,
  CareContactStart,
  CareDoneMessage,
  CareErrorMessage,
  CareNoteCard,
  CarePhoneFormCard,
} from "@/features/care/components/care-action-cards";
import {
  careContactInfo,
  careKindForContactMethod,
  careNoteId,
  carePhoneId,
  careSavedMessage,
  type CareContactMethod,
  type CareFlowStage,
} from "@/features/care/care-actions-view";
import { CARE_COPY } from "@/features/care/care-copy";
import { personPhoneErrorMessage, validatePersonPhoneValue } from "@/features/people/person-phone";
import { useApiAction } from "@/hooks/use-api-action";
import { API_ROUTES } from "@/lib/api-routes";
import { cn } from "@/lib/cn";

export function CareActions({
  personId,
  personName,
  phone,
  startWithPhoneForm = false,
  className,
}: {
  personId?: string;
  personName?: string | null;
  phone?: string | null;
  startWithPhoneForm?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const actionsRef = useRef<HTMLDivElement>(null);
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [stage, setStage] = useState<CareFlowStage>(() => (startWithPhoneForm && !phone?.trim() ? "phone" : "idle"));
  const [note, setNote] = useState("");
  const [phoneDraft, setPhoneDraft] = useState(phone?.trim() ?? "");
  const [phoneError, setPhoneError] = useState("");
  const [phoneSavedMessage, setPhoneSavedMessage] = useState("");
  const [contactMethod, setContactMethod] = useState<CareContactMethod>("existing");
  const [savedMessage, setSavedMessage] = useState("");
  const [resolvedMessage, setResolvedMessage] = useState("");
  const { isPending, errorMessage, clearError, runApiAction } = useApiAction();
  const currentPhone = savedPhone ?? phone ?? "";
  const contactInfo = useMemo(() => careContactInfo(currentPhone, { personName }), [currentPhone, personName]);
  const canRegisterCare = Boolean(personId);

  useEffect(() => {
    if (!startWithPhoneForm) return undefined;

    const frame = window.requestAnimationFrame(() => {
      actionsRef.current?.closest("section")?.scrollIntoView({ block: "center", behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [startWithPhoneForm]);

  function clearPhoneFeedback() {
    setPhoneError("");
    setPhoneSavedMessage("");
  }

  function resetFlow() {
    setStage("idle");
    setNote("");
    setContactMethod("existing");
    setPhoneDraft(currentPhone.trim());
    clearPhoneFeedback();
    clearError();
  }

  function openPhoneForm() {
    clearError();
    clearPhoneFeedback();
    setPhoneDraft(currentPhone.trim());
    setStage("phone");
  }

  function updatePhoneDraft(value: string) {
    setPhoneDraft(value);
    setPhoneError("");
    setPhoneSavedMessage("");
  }

  function savePhone() {
    if (!personId) return;

    const parsed = validatePersonPhoneValue(phoneDraft);
    if (!parsed.ok) {
      setPhoneError(personPhoneErrorMessage(parsed.error) ?? "Telefone inválido.");
      return;
    }

    runApiAction(
      () =>
        fetch(API_ROUTES.personPhone(personId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: parsed.phone }),
        }),
      {
        fallbackErrorMessage: CARE_COPY.errors.phoneUpdateFallback,
        onSuccess: (responseBody) => {
          setSavedPhone(parsed.phone);
          setPhoneDraft(parsed.phone);
          setPhoneSavedMessage(responseBody?.message ?? CARE_COPY.feedback.phoneSaved);
          setStage("idle");
          router.refresh();
        },
      },
    );
  }

  function registerContact(noteValue?: string) {
    if (!personId) return;

    const trimmedNote = noteValue?.trim();

    runApiAction(
      () =>
        fetch(API_ROUTES.care(personId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: careKindForContactMethod(contactMethod),
            note: trimmedNote || undefined,
            resolveOpenSignals: true,
          }),
        }),
      {
        fallbackErrorMessage: CARE_COPY.errors.registerFallback,
        onSuccess: (responseBody) => {
          setSavedMessage(careSavedMessage(Boolean(trimmedNote), contactMethod));
          setResolvedMessage(responseBody?.message ?? CARE_COPY.feedback.noFormalFollowUp);
          setStage("done");
          setNote("");
          router.refresh();
        },
      },
    );
  }

  if (stage === "done") {
    return <CareDoneMessage savedMessage={savedMessage} resolvedMessage={resolvedMessage} />;
  }

  return (
    <div ref={actionsRef} className={cn("space-y-2.5", className)}>
      {errorMessage ? <CareErrorMessage message={errorMessage} /> : null}
      {phoneSavedMessage ? <CareDoneMessage savedMessage={phoneSavedMessage} resolvedMessage="WhatsApp e ligação já podem ser usados neste perfil." /> : null}

      {stage === "idle" ? (
        <CareContactStart
          links={contactInfo.links}
          hasPhone={contactInfo.hasPhone}
          displayPhone={contactInfo.displayPhone}
          canRegisterCare={canRegisterCare}
          isPending={isPending}
          onContactAttempt={(method) => {
            clearError();
            clearPhoneFeedback();
            setContactMethod(method);
            setStage("confirm");
          }}
          onExistingContact={() => {
            clearError();
            clearPhoneFeedback();
            setContactMethod("existing");
            setStage("confirm-existing");
          }}
          onAddPhone={openPhoneForm}
        />
      ) : null}

      {stage === "phone" ? (
        <CarePhoneFormCard
          phoneId={carePhoneId(personId)}
          phone={phoneDraft}
          error={phoneError}
          isPending={isPending}
          isEditing={contactInfo.hasPhone}
          onPhoneChange={updatePhoneDraft}
          onSave={savePhone}
          onCancel={resetFlow}
        />
      ) : null}

      {stage === "confirm" ? (
        <CareConfirmCard
          variant="contact"
          method={contactMethod}
          canRegisterCare={canRegisterCare}
          isPending={isPending}
          onConfirm={() => setStage("ask-note")}
          onCancel={resetFlow}
        />
      ) : null}

      {stage === "confirm-existing" ? <CareConfirmCard variant="existing" canRegisterCare={canRegisterCare} isPending={isPending} onConfirm={() => setStage("ask-note")} onCancel={resetFlow} /> : null}

      {stage === "ask-note" ? <CareAskNoteCard isPending={isPending} onAddNote={() => setStage("note")} onSaveWithoutNote={() => registerContact()} onCancel={resetFlow} /> : null}

      {stage === "note" ? (
        <CareNoteCard
          noteId={careNoteId(personId)}
          note={note}
          isPending={isPending}
          onNoteChange={setNote}
          onBack={() => {
            setStage("ask-note");
            setNote("");
          }}
          onSave={() => registerContact(note)}
        />
      ) : null}
    </div>
  );
}
