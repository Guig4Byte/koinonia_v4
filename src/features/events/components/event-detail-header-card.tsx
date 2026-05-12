import Link from "next/link";
import { CardHeader } from "@/components/ui/card-header";
import { Card } from "@/components/ui/card";
import { ContextSummary } from "@/components/shared/base-cards";
import type { BadgeTone } from "@/components/ui/badge";
import type { MetricTone } from "@/components/shared/presence-metric";
import { formatPresenceRate } from "@/features/events/presence-display";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export function EventDetailHeaderCard({
  title,
  groupId,
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
      <CardHeader
        as="h2"
        eyebrow={checkInLabel}
        title={title}
        subtitle={`${formatShortDate(startsAt)}, ${formatTime(startsAt)}`}
        detail={locationName || (groupId && showGroupLink) ? (
          <>
            {locationName ? <p className="k-item-meta">{locationName}</p> : null}
            {groupId && showGroupLink ? (
              <Link href={ROUTES.group(groupId)} className="mt-3 inline-flex text-[length:var(--text-sm)] font-semibold text-[color:var(--color-brand)]">
                Ver célula →
              </Link>
            ) : null}
          </>
        ) : undefined}
        badgeLabel={eventStatusLabel}
        badgeTone={eventStatusTone}
        titleClassName="mt-1 text-[length:var(--text-2xl)]"
        subtitleClassName="k-item-meta"
        detailClassName=""
      />

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
