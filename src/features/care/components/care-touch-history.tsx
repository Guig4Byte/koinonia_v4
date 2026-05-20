"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type CareTouchHistoryItem = {
  id: string;
  title: string;
  actorName: string;
  happenedAtLabel: string;
  note?: string | null;
};

const INITIAL_VISIBLE_COUNT = 3;

export function CareTouchHistory({ items, className }: { items: CareTouchHistoryItem[]; className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? items : items.slice(0, INITIAL_VISIBLE_COUNT);
  const hasHiddenItems = items.length > INITIAL_VISIBLE_COUNT;

  return (
    <Card className={className}>
      <div className="divide-y divide-[var(--color-border-divider)]">
        {visibleItems.map((item) => {
          const note = item.note?.trim();

          return (
            <article key={item.id} className="py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="k-item-title">{item.title}</p>
                <p className="k-item-meta">
                  {item.actorName} · {item.happenedAtLabel}
                </p>
              </div>
              {note ? <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-primary)]">{note}</p> : null}
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
          {isExpanded ? "Mostrar menos" : "Ver histórico"}
        </Button>
      ) : null}
    </Card>
  );
}
