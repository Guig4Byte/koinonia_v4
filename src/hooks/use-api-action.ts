"use client";

import { useState, useTransition } from "react";
import { readApiMessage, type ApiMessage } from "@/lib/json";

type ApiActionOptions = {
  fallbackErrorMessage: string;
  onSuccess?: (body: ApiMessage | null) => void;
};

export function useApiAction() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  function clearError() {
    setErrorMessage("");
  }

  function runApiAction(action: () => Promise<Response>, options: ApiActionOptions) {
    clearError();

    startTransition(async () => {
      const response = await action();
      const body = await readApiMessage(response);

      if (!response.ok) {
        setErrorMessage(body?.error ?? options.fallbackErrorMessage);
        return;
      }

      options.onSuccess?.(body);
    });
  }

  return {
    isPending,
    errorMessage,
    clearError,
    runApiAction,
  };
}
