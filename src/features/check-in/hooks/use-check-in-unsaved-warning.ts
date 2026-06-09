"use client";

import { useCallback, useEffect } from "react";

const unsavedCheckInMessage =
  "Há alterações de presença não salvas. Deseja sair sem salvar?";

export function useCheckInUnsavedWarning({
  hasUnsavedChanges,
  isPending,
}: {
  hasUnsavedChanges: boolean;
  isPending: boolean;
}) {
  useEffect(() => {
    if (!hasUnsavedChanges || isPending) return undefined;

    function confirmBrowserLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", confirmBrowserLeave);

    return () => {
      window.removeEventListener("beforeunload", confirmBrowserLeave);
    };
  }, [hasUnsavedChanges, isPending]);

  return useCallback(() => {
    if (isPending || !hasUnsavedChanges) return true;
    return window.confirm(unsavedCheckInMessage);
  }, [hasUnsavedChanges, isPending]);
}
