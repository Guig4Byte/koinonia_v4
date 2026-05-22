import { ArrowRight } from "lucide-react";
import { CardHeader } from "@/components/ui/card-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { ContextSummary } from "@/components/shared/base-cards";
import type { BadgeTone } from "@/components/ui/badge";
import type { MetricTone } from "@/components/shared/presence-metric";
import { formatPresenceRate } from "@/features/events/presence-display";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import styles from "./event-detail-header-card.module.css";

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
  showContextSummary = true,
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
  showContextSummary?: boolean;
}) {
  return (
    <Card tone="featured">
      <CardHeader
        as="h2"
        eyebrow={checkInLabel}
        title={title}
        subtitle={`${formatShortDate(startsAt)}, ${formatTime(startsAt)}`}
        detail={locationName || (groupId && showGroupLink) ? (
          <>
            {locationName ? <p className="k-item-meta">{locationName}</p> : null}
            {groupId && showGroupLink ? (
              <ButtonLink href={ROUTES.group(groupId)} variant="quiet" size="sm" shape="pill" density="compact" className={styles.groupLink}>
                Abrir célula
                <ArrowRight className={styles.groupLinkIcon} aria-hidden="true" />
              </ButtonLink>
            ) : null}
          </>
        ) : undefined}
        badgeLabel={eventStatusLabel}
        badgeTone={eventStatusTone}
        titleClassName="mt-1 text-[length:var(--text-2xl)]"
        subtitleClassName="k-item-meta"
        detailClassName=""
      />

      {showContextSummary ? (
        <div className="mt-4">
          <ContextSummary
            surface="inset"
            variant="compact"
            presenceContext="event"
            presenceMetricSize="sm"
            presenceIndicatorWeight="light"
            presenceIndicatorMode="plain"
            presenceValueClassName="text-[length:var(--text-sm)] font-extrabold"
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
      ) : null}
    </Card>
  );
}
