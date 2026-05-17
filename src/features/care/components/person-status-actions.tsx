"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { CARE_COPY } from "@/features/care/care-copy";
import { useApiAction } from "@/hooks/use-api-action";
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

  return (
    <Card tone="inset" padding="sm" radius="sm" statusTone="care" className="mt-3 text-[length:var(--text-sm)] text-[color:var(--color-text-primary)]">
      <p className="font-semibold text-[color:var(--color-badge-cuidado-text)]">{CARE_COPY.statusActions.title}</p>
      <p className="mt-1 text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]">
        {CARE_COPY.statusActions.description}
      </p>

      {errorMessage ? (
        <Feedback tone="error" compact role="alert" ariaLive="assertive" className="mt-2 font-semibold">
          {errorMessage}
        </Feedback>
      ) : null}

      {isConfirming ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" size="sm" fullWidth disabled={isPending} onClick={markActive}>
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
            {CARE_COPY.statusActions.confirmLabel}
          </Button>
          <Button type="button" variant="secondary" size="sm" fullWidth disabled={isPending} onClick={() => setIsConfirming(false)}>
            {CARE_COPY.statusActions.keepInCareLabel}
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" size="sm" fullWidth disabled={isPending} onClick={() => setIsConfirming(true)} className="mt-3">
          {CARE_COPY.statusActions.startLabel}
        </Button>
      )}
    </Card>
  );
}
