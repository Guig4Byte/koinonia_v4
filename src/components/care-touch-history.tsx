"use client";

import { useState } from "react";

export type CareTouchHistoryItem = {
  id: string;
  title: string;
  actorName: string;
  happenedAtLabel: string;
  note?: string | null;
};

const INITIAL_VISIBLE_COUNT = 3;

export function CareTouchHistory({ items }: { items: CareTouchHistoryItem[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? items : items.slice(0, INITIAL_VISIBLE_COUNT);
  const hasHiddenItems = items.length > INITIAL_VISIBLE_COUNT;

  return (
    <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <div className="divide-y divide-[var(--color-border-divider)]">
        {visibleItems.map((item) => {
          const note = item.note?.trim();

          return (
            <article key={item.id} className="py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {item.actorName} · {item.happenedAtLabel}
                </p>
              </div>
              {note ? <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-primary)]">{note}</p> : null}
            </article>
          );
        })}
      </div>

      {hasHiddenItems ? (
        <button
          type="button"
          className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] shadow-card transition active:scale-[0.98]"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? "Mostrar menos" : "Ver histórico"}
        </button>
      ) : null}
    </section>
  );
}
