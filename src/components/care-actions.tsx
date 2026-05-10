"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CareAskNoteCard,
  CareConfirmCard,
  CareContactStart,
  CareDoneMessage,
  CareErrorMessage,
  CareNoteCard,
} from "@/components/care-action-cards";
import { careContactInfo, careNoteId, careSavedMessage, type CareFlowStage } from "@/features/care/care-actions-view";
import { CARE_COPY } from "@/features/care/care-copy";
import { useApiAction } from "@/hooks/use-api-action";
import { API_ROUTES } from "@/lib/api-routes";

export function CareActions({ personId, phone }: { personId?: string; phone?: string | null }) {
  const router = useRouter();
  const [stage, setStage] = useState<CareFlowStage>("idle");
  const [note, setNote] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [resolvedMessage, setResolvedMessage] = useState("");
  const { isPending, errorMessage, clearError, runApiAction } = useApiAction();
  const contactInfo = useMemo(() => careContactInfo(phone), [phone]);
  const canRegisterCare = Boolean(personId);

  function resetFlow() {
    setStage("idle");
    setNote("");
    clearError();
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
            kind: "MARKED_CARED",
            note: trimmedNote || undefined,
            resolveOpenSignals: true,
          }),
        }),
      {
        fallbackErrorMessage: CARE_COPY.errors.registerFallback,
        onSuccess: (responseBody) => {
          setSavedMessage(careSavedMessage(Boolean(trimmedNote)));
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
    <div className="mt-3 space-y-2.5">
      {errorMessage ? <CareErrorMessage message={errorMessage} /> : null}

      {stage === "idle" ? (
        <CareContactStart
          links={contactInfo.links}
          hasPhone={contactInfo.hasPhone}
          canRegisterCare={canRegisterCare}
          isPending={isPending}
          onContactAttempt={() => {
            clearError();
            setStage("confirm");
          }}
          onExistingContact={() => {
            clearError();
            setStage("confirm-existing");
          }}
        />
      ) : null}

      {stage === "confirm" ? <CareConfirmCard variant="contact" canRegisterCare={canRegisterCare} isPending={isPending} onConfirm={() => setStage("ask-note")} onCancel={resetFlow} /> : null}

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
