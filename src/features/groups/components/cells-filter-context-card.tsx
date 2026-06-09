import { FilterContextCard } from "@/components/shared/filter-context-card";
import { cellsFilterContextContent } from "@/features/groups/cells-page-view";
import type { CellsFilter } from "@/features/groups/cells-page-filters";

export function CellsFilterContextCard({ filter }: { filter: CellsFilter }) {
  const content = cellsFilterContextContent(filter);

  return (
    <FilterContextCard
      title={content.title}
      detail={content.detail}
      tone={content.tone}
    />
  );
}
