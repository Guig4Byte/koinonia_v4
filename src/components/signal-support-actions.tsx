"use client";

import { LifeBuoy, SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";

type SupportAction = "REQUEST_SUPERVISOR" | "ESCALATE_PASTOR";
type SignalSupportActionsProps = {
  signalId: string;
  assignedToName?: string | null;
  assignedToRole?: string | null;
  showAssignmentMessage?: boolean;
  canRequestSupervisor?: boolean;
  canEscalatePastor?: boolean;
};

function assignedLabel(assignedToName?: string | null, assignedToRole?: string | null) {
  if (!assignedToRole) return null;

  if (assignedToRole === "PASTOR" || assignedToRole === "ADMIN") {
    return `${assignedToName ?? "Pastor"} recebeu este caso para olhar mais de perto.`;
  }

  if (assignedToRole === "SUPERVISOR") {
    return `${assignedToName ?? "Supervisor"} recebeu este pedido de apoio.`;
  }

  return null;
}

export function SignalSupportActions({
  signalId,
  assignedToName,
  assignedToRole,
  showAssignmentMessage = true,
  canRequestSupervisor = false,
  canEscalatePastor = false,
}: SignalSupportActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const label = showAssignmentMessage ? assignedLabel(assignedToName, assignedToRole) : null;

  function send(action: SupportAction) {
    setErrorMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/signals/${signalId}/support`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const body = await response.json().catch(() => null) as { error?: string } | null;

      if (!response.ok) {
        setErrorMessage(body?.error ?? "Não foi possível atualizar o apoio agora.");
        return;
      }

      router.refresh();
    });
  }

  const buttonClass =
    "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

  if (!label && !canRequestSupervisor && !canEscalatePastor) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-[var(--color-border-divider)] pt-3">
      {label ? (
        <p className="rounded-2xl border border-[var(--color-badge-apoio-border)] bg-[var(--color-badge-apoio-bg)] px-3 py-2 text-xs font-semibold leading-relaxed text-[var(--color-badge-apoio-text)]">
          {label}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-2xl border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-badge-risco-text)]">
          {errorMessage}
        </p>
      ) : null}

      {canRequestSupervisor ? (
        <button type="button" disabled={isPending} onClick={() => send("REQUEST_SUPERVISOR")} className={buttonClass}>
          <LifeBuoy className="h-4 w-4" strokeWidth={2.2} />
          Pedir apoio ao supervisor
        </button>
      ) : null}

      {canEscalatePastor ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => send("ESCALATE_PASTOR")}
          className={cn(buttonClass, "border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[var(--color-badge-risco-text)]")}
        >
          <SendHorizontal className="h-4 w-4" strokeWidth={2.2} />
          Encaminhar ao pastor
        </button>
      ) : null}
    </div>
  );
}
