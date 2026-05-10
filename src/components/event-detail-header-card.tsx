import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ContextSummary } from "@/components/base-cards";
import type { BadgeTone } from "@/components/ui/badge";
import type { MetricTone } from "@/components/presence-metric";
import { formatPresenceRate } from "@/features/events/presence-display";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

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
  presenceTone: MetricTone;
  visitorsCount: number;
  membersCount: number;
  showGroupLink: boolean;
}) {
  return (
    <Card>
      <div className="k-card-header-row">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            {checkInLabel}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <p className="k-item-meta">
            {groupName ?? "Encontro geral"} · {formatShortDate(startsAt)}, {formatTime(startsAt)}
          </p>
          {locationName ? (
            <p className="k-item-meta">{locationName}</p>
          ) : null}
          {groupId && showGroupLink ? (
            <Link href={ROUTES.group(groupId)} className="mt-3 inline-flex text-sm font-semibold text-[var(--color-brand)]">
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
              value: formatPresenceRate(hasPresenceData, presenceRate),
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
    </Card>
  );
}
