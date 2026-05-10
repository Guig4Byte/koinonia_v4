"use client";

import { StructureSearch } from "@/components/structure-search";
import { CELLS_FILTERS, type CellsFilter } from "@/features/groups/cells-page-filters";
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
      defaultFilter="todos"
      filters={CELLS_FILTERS}
      ariaLabel="Buscar célula ou liderança"
      placeholder="Buscar célula ou liderança..."
    />
  );
}
