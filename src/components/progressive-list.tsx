"use client";

import { Children, type ReactNode, useState } from "react";

export function ProgressiveList({
  children,
  initialCount = 4,
  step = 4,
  moreLabel = "Ver mais",
  lessLabel = "Mostrar menos",
}: {
  children: ReactNode;
  initialCount?: number;
  step?: number;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const items = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visibleItems = items.slice(0, visibleCount);
  const hasHiddenItems = visibleCount < items.length;
  const isExpanded = visibleCount >= items.length && items.length > initialCount;

  return (
    <div className="space-y-3">
      {visibleItems}
      {hasHiddenItems ? (
        <button
          type="button"
          className="flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] shadow-card transition active:scale-[0.98]"
          onClick={() => setVisibleCount((current) => Math.min(current + step, items.length))}
        >
          {moreLabel}
        </button>
      ) : null}
      {isExpanded ? (
        <button
          type="button"
          className="flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] shadow-card transition active:scale-[0.98]"
          onClick={() => setVisibleCount(initialCount)}
        >
          {lessLabel}
        </button>
      ) : null}
    </div>
  );
}
