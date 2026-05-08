import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ContextSummary } from "@/components/cards";
import type { BadgeTone } from "@/components/ui/badge";
import type { PresenceTone } from "@/features/events/presence-display";
import { formatShortDate, formatTime } from "@/lib/format";

export function EventDetailHeaderCard({
  title,
  groupId,
  groupName,
  startsAt,
  locationName,
  checkInLabel,
  eventStatusLabel,
  eventStatusTone,
  hasPresenceData,
  presenceRate,
  presenceTone,
  visitorsCount,
  membersCount,
  showGroupLink,
}: {
  title: string;
  groupId?: string | null;
  groupName?: string | null;
  startsAt: Date;
  locationName?: string | null;
  checkInLabel: string;
  eventStatusLabel: string;
  eventStatusTone: BadgeTone;
  hasPresenceData: boolean;
  presenceRate: number;
  presenceTone: PresenceTone;
  visitorsCount: number;
  membersCount: number;
  showGroupLink: boolean;
}) {
  return (
    <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            {checkInLabel}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {groupName ?? "Encontro geral"} · {formatShortDate(startsAt)}, {formatTime(startsAt)}
          </p>
          {locationName ? (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{locationName}</p>
          ) : null}
          {groupId && showGroupLink ? (
            <Link href={`/celulas/${groupId}`} className="mt-3 inline-flex text-sm font-semibold text-[var(--color-brand)]">
              Ver célula →
            </Link>
          ) : null}
        </div>
        <Badge tone={eventStatusTone}>{eventStatusLabel}</Badge>
      </div>

      <div className="mt-4">
        <ContextSummary
          surface="inset"
          variant="balanced"
          items={[
            {
              label: "Presença",
              detail: hasPresenceData ? "Ritmo do encontro registrado." : "Ainda sem presença registrada.",
              value: hasPresenceData ? `${presenceRate}%` : "—",
              tone: presenceTone,
            },
            {
              label: "Visitantes",
              detail: visitorsCount > 0 ? "Pessoas novas ou visitantes marcados." : "Nenhum visitante marcado neste encontro.",
              value: String(visitorsCount),
              tone: "neutral",
            },
            {
              label: "Membros da célula",
              detail: "Base do encontro, sem contar visitantes.",
              value: String(membersCount),
              tone: "neutral",
            },
          ]}
        />
      </div>
    </section>
  );
}
