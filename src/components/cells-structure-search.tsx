"use client";

import { StructureSearch } from "@/components/structure-search";
import { STRUCTURE_SEARCH_CONFIG } from "@/components/structure-search-config";
import type { CellsFilter } from "@/features/groups/cells-page-filters";

type CellsStructureSearchProps = {
  query: string;
  filter: CellsFilter;
  sectionId: string;
};

export function CellsStructureSearch(props: CellsStructureSearchProps) {
  return <StructureSearch {...STRUCTURE_SEARCH_CONFIG.cells} {...props} />;
}
