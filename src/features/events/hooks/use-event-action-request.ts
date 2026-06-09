"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { eventActionResponseError, type EventPatchPayload } from "@/features/events/event-actions-view";
import { API_ROUTES } from "@/lib/api-routes";
import { readJsonResponse } from "@/lib/json";

export function useEventActionRequest(eventId: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function clearFeedback() {
    setMessage(null);
    setErrorMessage(null);
  }

  function showValidationError(message: string) {
    setMessage(null);
    setErrorMessage(message);
  }

  async function patchEvent(payload: EventPatchPayload, successMessage: string) {
    clearFeedback();

    const response = await fetch(API_ROUTES.event(eventId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await readJsonResponse(response);

    if (!response.ok) {
      setErrorMessage(eventActionResponseError(body));
      return;
    }

    setMessage(successMessage);
    router.refresh();
  }

  function runPatch(payload: EventPatchPayload, successMessage: string) {
    startTransition(() => {
      void patchEvent(payload, successMessage);
    });
  }

  return {
    errorMessage,
    isPending,
    message,
    runPatch,
    showValidationError,
  };
}
