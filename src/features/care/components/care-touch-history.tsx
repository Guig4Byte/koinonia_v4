"use client";

import { ChevronDown, ChevronUp, FileText, Heart, History, MapPin, MessageCircle, Phone, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import styles from "./care-touch-history.module.css";

export type CareTouchHistoryItem = {
  id: string;
  title: string;
  actorName: string;
  happenedAtLabel: string;
  contextLabel?: string | null;
  note?: string | null;
};

type HistoryVisual = {
  icon: LucideIcon;
  tone: "care" | "support" | "risk" | "attention" | "neutral";
};

function historyVisual(title: string): HistoryVisual {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("whatsapp") || normalizedTitle.includes("conversa")) {
    return { icon: MessageCircle, tone: "care" };
  }

  if (normalizedTitle.includes("liga") || normalizedTitle.includes("telefon")) {
    return { icon: Phone, tone: "care" };
  }

  if (normalizedTitle.includes("apoio")) {
    return { icon: Heart, tone: "support" };
  }

  if (normalizedTitle.includes("pastoral") || normalizedTitle.includes("encaminhado")) {
    return { icon: Heart, tone: "risk" };
  }

  return { icon: Heart, tone: "attention" };
}

function HistoryTimelineItem({ item }: { item: CareTouchHistoryItem }) {
  const note = item.note?.trim();
  const { icon: EventIcon, tone } = historyVisual(item.title);

  return (
    <article className={styles.item}>
      <div className={styles.markerColumn} aria-hidden="true">
        <span className={styles.marker} />
      </div>

      <div className={styles.copy}>
        <div className={styles.header}>
          <span className={cn(styles.eventIcon, styles[`eventIcon${tone}`])} aria-hidden="true">
            <EventIcon className={styles.eventIconSvg} />
          </span>

          <div className={styles.titleBlock}>
            <p className={styles.title}>{item.title}</p>
            <p className={styles.meta}>
              {item.actorName} · {item.happenedAtLabel}
              {item.contextLabel ? ` · ${item.contextLabel}` : ""}
            </p>
          </div>
        </div>

        {note ? <p className={styles.note}>{note}</p> : null}
      </div>
    </article>
  );
}

export function CareTouchHistory({ items, className }: { items: CareTouchHistoryItem[]; className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const latestItem = items[0];
  const olderItems = items.slice(1);
  const hasOlderItems = olderItems.length > 0;
  const latestNote = latestItem.note?.trim();
  const { icon: LatestIcon, tone: latestTone } = historyVisual(latestItem.title);

  return (
    <div className={cn(styles.history, className)}>
      <Card>
        <div className={styles.snapshotLabel}>
          <History className={styles.snapshotLabelIcon} aria-hidden="true" />
          <span>Último cuidado</span>
        </div>

        <article className={styles.latestCard}>
          <span className={cn(styles.latestIcon, styles[`eventIcon${latestTone}`])} aria-hidden="true">
            <LatestIcon className={styles.latestIconSvg} />
          </span>

          <div className={styles.latestCopy}>
            <p className={styles.latestTitle}>{latestItem.title}</p>

            <div className={styles.latestMetaStack}>
              <p className={styles.latestMetaRow}>
                <Users className={styles.metaIcon} aria-hidden="true" />
                <span>
                  {latestItem.actorName} · {latestItem.happenedAtLabel}
                </span>
              </p>
              {latestItem.contextLabel ? (
                <p className={styles.latestMetaRow}>
                  <MapPin className={styles.metaIcon} aria-hidden="true" />
                  <span>{latestItem.contextLabel}</span>
                </p>
              ) : null}
            </div>

            {latestNote ? <p className={styles.latestNote}>{latestNote}</p> : null}
          </div>
        </article>

        {hasOlderItems ? (
          <>
            <button
              type="button"
              className={styles.expandButton}
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((current) => !current)}
            >
              <span className={styles.expandLabel}>
                <FileText className={styles.expandLabelIcon} aria-hidden="true" />
                {isExpanded ? "Mostrar menos" : "Ver histórico completo"}
              </span>
              {isExpanded ? (
                <ChevronUp className={styles.expandChevron} aria-hidden="true" />
              ) : (
                <ChevronDown className={styles.expandChevron} aria-hidden="true" />
              )}
            </button>

            {isExpanded ? (
              <div className={styles.timeline}>
                {olderItems.map((item) => (
                  <HistoryTimelineItem key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </Card>
    </div>
  );
}
