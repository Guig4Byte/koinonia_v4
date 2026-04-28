"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, GhostButton } from "@/components/ui/button";

type AttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED" | "VISITOR";

type Member = {
  personId: string;
  fullName: string;
  currentStatus?: AttendanceStatus | null;
};

const ATTENDANCE = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  JUSTIFIED: "JUSTIFIED",
  VISITOR: "VISITOR",
} as const satisfies Record<AttendanceStatus, AttendanceStatus>;

const labels: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
  VISITOR: "Visitante",
};

export function CheckInList({ eventId, members }: { eventId: string; members: Member[] }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState(
    members.map((member) => ({
      personId: member.personId,
      fullName: member.fullName,
      status: member.currentStatus ?? ATTENDANCE.ABSENT,
    })),
  );

  const presenceRate = useMemo(() => {
    const base = items.filter((item) => item.status !== ATTENDANCE.VISITOR);
    if (base.length === 0) return 0;
    return Math.round((base.filter((item) => item.status === ATTENDANCE.PRESENT).length / base.length) * 100);
  }, [items]);

  function setStatus(personId: string, status: AttendanceStatus) {
    setSaved(false);
    setItems((current) => current.map((item) => (item.personId === personId ? { ...item, status } : item)));
  }

  function save() {
    startTransition(async () => {
      const response = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendances: items.map(({ personId, status }) => ({ personId, status })) }),
      });

      if (!response.ok) {
        alert("Não foi possível salvar o check-in.");
        return;
      }
      setSaved(true);
    });
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Presença de hoje</p>
            <p className="text-3xl font-bold text-[var(--color-metric-presenca)]">{presenceRate}%</p>
          </div>
          <Button disabled={isPending} onClick={save}>{isPending ? "Salvando..." : saved ? "Salvo" : "Salvar"}</Button>
        </div>
      </div>

      {items.map((item) => (
        <article key={item.personId} className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card">
          <p className="mb-2 font-semibold text-[var(--color-text-primary)]">{item.fullName}</p>
          <div className="grid grid-cols-3 gap-2">
            {[ATTENDANCE.PRESENT, ATTENDANCE.ABSENT, ATTENDANCE.JUSTIFIED].map((status) => (
              <GhostButton
                key={status}
                onClick={() => setStatus(item.personId, status)}
                className={item.status === status ? "border-[var(--color-brand)] bg-[var(--accent-soft)] text-[var(--color-brand)]" : ""}
              >
                {labels[status]}
              </GhostButton>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
