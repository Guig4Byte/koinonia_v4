"use client";

import { Children, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="stagger-children min-w-0 w-full space-y-3">
      {visibleItems}
      {hasHiddenItems ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => setVisibleCount((current) => Math.min(current + step, items.length))}
        >
          {moreLabel}
        </Button>
      ) : null}
      {isExpanded ? (
        <Button type="button" variant="secondary" size="sm" fullWidth onClick={() => setVisibleCount(initialCount)}>
          {lessLabel}
        </Button>
      ) : null}
    </div>
  );
}
