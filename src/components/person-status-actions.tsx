"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CARE_COPY } from "@/features/care/care-copy";
import { cn } from "@/lib/cn";
import { useApiAction } from "@/lib/use-api-action";
import { API_ROUTES } from "@/lib/api-routes";

export function PersonStatusActions({ personId }: { personId: string }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const { isPending, errorMessage, runApiAction } = useApiAction();

  function markActive() {
    runApiAction(
      () =>
        fetch(API_ROUTES.markPersonActive(personId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      {
        fallbackErrorMessage: CARE_COPY.errors.markActiveFallback,
        onSuccess: () => {
          setIsConfirming(false);
          router.refresh();
        },
      },
    );
  }

  const buttonBase =
    "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-semibold leading-tight transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

  return (
    <div className="mt-3 rounded-2xl border border-[var(--color-badge-cuidado-border)] bg-[var(--color-badge-cuidado-bg)] p-3 text-sm text-[var(--color-text-primary)]">
      <p className="font-semibold text-[var(--color-badge-cuidado-text)]">{CARE_COPY.statusActions.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        {CARE_COPY.statusActions.description}
      </p>

      {errorMessage ? (
        <p className="mt-2 rounded-xl border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-badge-risco-text)]">
          {errorMessage}
        </p>
      ) : null}

      {isConfirming ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={isPending}
            onClick={markActive}
            className={cn(buttonBase, "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]")}
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
            {CARE_COPY.statusActions.confirmLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIsConfirming(false)}
            className={cn(buttonBase, "border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] text-[var(--color-btn-secondary-text)]")}
          >
            {CARE_COPY.statusActions.keepInCareLabel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => setIsConfirming(true)}
          className={cn(buttonBase, "mt-3 border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] text-[var(--color-btn-secondary-text)]")}
        >
          {CARE_COPY.statusActions.startLabel}
        </button>
      )}
    </div>
  );
}
