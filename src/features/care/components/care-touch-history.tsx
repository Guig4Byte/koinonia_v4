"use client";

import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const INITIAL_VISIBLE_COUNT = 3;

function historyTone(title: string): BadgeTone {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("apoio")) return "support";
  if (normalizedTitle.includes("pastoral") || normalizedTitle.includes("encaminhado")) return "risk";
  if (normalizedTitle.includes("ligação") || normalizedTitle.includes("whatsapp")) return "care";
  if (normalizedTitle.includes("oração") || normalizedTitle.includes("visita")) return "info";
  return "neutral";
}

function historyBadgeLabel(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("apoio")) return "Apoio";
  if (normalizedTitle.includes("pastoral") || normalizedTitle.includes("encaminhado")) return "Pastoral";
  if (normalizedTitle.includes("ligação") || normalizedTitle.includes("whatsapp")) return "Contato";
  if (normalizedTitle.includes("oração") || normalizedTitle.includes("visita")) return "Cuidado";
  return "Registro";
}

export function CareTouchHistory({ items, className }: { items: CareTouchHistoryItem[]; className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? items : items.slice(0, INITIAL_VISIBLE_COUNT);
  const hasHiddenItems = items.length > INITIAL_VISIBLE_COUNT;

  return (
    <div className={cn(styles.history, className)}>
      <Card>
        <div className={styles.list}>
          {visibleItems.map((item) => {
            const note = item.note?.trim();

            return (
              <article key={item.id} className={styles.item}>
                <div className={styles.markerColumn} aria-hidden="true">
                  <span className={styles.marker} />
                </div>

                <div className={styles.copy}>
                  <div className={styles.header}>
                    <div className={styles.titleBlock}>
                      <p className={styles.title}>{item.title}</p>
                      <p className={styles.meta}>
                        {item.actorName} · {item.happenedAtLabel}{item.contextLabel ? ` · ${item.contextLabel}` : ""}
                      </p>
                    </div>
                    <Badge tone={historyTone(item.title)} size="xs" maxWidth="none" truncate={false}>
                      {historyBadgeLabel(item.title)}
                    </Badge>
                  </div>

                  {note ? <p className={styles.note}>{note}</p> : null}
                </div>
              </article>
            );
          })}
        </div>

        {hasHiddenItems ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            className="mt-3"
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? "Mostrar menos" : "Mostrar histórico completo"}
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
