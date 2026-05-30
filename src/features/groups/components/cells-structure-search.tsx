"use client";

import {
  StructureSearch,
  type StructureSearchConfig,
} from "@/components/shared/structure-search";
import {
  CELLS_FILTERS,
  visibleCellsFilter,
  type CellsFilter,
} from "@/features/groups/cells-page-filters";
import { FILTER_ALL } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";

type CellsStructureSearchProps = {
  query: string;
  filter: CellsFilter;
  sectionId: string;
};

const CELLS_STRUCTURE_SEARCH_CONFIG = {
  basePath: ROUTES.cells,
  defaultFilter: FILTER_ALL,
  filters: CELLS_FILTERS,
  ariaLabel: "Buscar célula ou liderança",
  placeholder: "Buscar célula ou liderança...",
} satisfies StructureSearchConfig<CellsFilter>;

export function CellsStructureSearch({ filter, ...props }: CellsStructureSearchProps) {
  return (
    <StructureSearch
      {...CELLS_STRUCTURE_SEARCH_CONFIG}
      {...props}
      filter={visibleCellsFilter(filter)}
    />
  );
}
