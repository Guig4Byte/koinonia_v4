"use client";

import { StructureSearch } from "@/components/shared/structure-search";
import { STRUCTURE_SEARCH_CONFIG } from "@/lib/structure-search-config";
import { visibleCellsFilter, type CellsFilter } from "@/features/groups/cells-page-filters";

type CellsStructureSearchProps = {
  query: string;
  filter: CellsFilter;
  sectionId: string;
};

export function CellsStructureSearch({ filter, ...props }: CellsStructureSearchProps) {
  return <StructureSearch {...STRUCTURE_SEARCH_CONFIG.cells} {...props} filter={visibleCellsFilter(filter)} />;
}
