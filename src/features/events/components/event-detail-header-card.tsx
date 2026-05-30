import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { ContextSummary } from "@/components/shared/base-cards";
import { Badge, type BadgeTone } from "@/components/ui/badge";
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
  const dateTimeLabel = `${formatShortDate(startsAt)}, ${formatTime(startsAt)}`;
  const hasDetail = Boolean(locationName || (groupId && showGroupLink));

  return (
    <Card tone="featured">
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <p className={styles.eyebrow}>{checkInLabel}</p>
          <Badge tone={eventStatusTone} maxWidth="none" elevation="soft" responsive="fullBelowXs">
            {eventStatusLabel}
          </Badge>
        </div>

        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{dateTimeLabel}</p>

        {hasDetail ? (
          <div className={styles.detail}>
            {locationName ? <p className={styles.location}>{locationName}</p> : null}
            {groupId && showGroupLink ? (
              <ButtonLink href={ROUTES.group(groupId)} variant="warmSoft" size="sm" shape="pill" density="inlineCompact">
                Abrir célula
                <ArrowRight className={styles.groupLinkIcon} aria-hidden="true" />
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
      </div>

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
                detail: visitorsCount > 0 ? "Irmãos novos ou visitantes marcados." : "Nenhum visitante marcado neste encontro.",
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
