"use client";

import { StructureSearch } from "@/components/structure-search";
import { CELLS_FILTERS, type CellsFilter } from "@/features/groups/cells-page-filters";
import { FILTER_ALL } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";

type CellsStructureSearchProps = {
  query: string;
  filter: CellsFilter;
  sectionId: string;
};

export function CellsStructureSearch(props: CellsStructureSearchProps) {
  return (
    <StructureSearch
      {...props}
      basePath={ROUTES.cells}
      defaultFilter={FILTER_ALL}
      filters={CELLS_FILTERS}
      ariaLabel="Buscar célula ou liderança"
      placeholder="Buscar célula ou liderança..."
    />
  );
}
