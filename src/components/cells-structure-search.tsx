"use client";

import { StructureSearch } from "@/components/structure-search";

type CellsFilter = "todos" | "atencao" | "sem-presenca";

const CELLS_FILTERS: Array<{ value: CellsFilter; label: string }> = [
  { value: "todos", label: "Todas" },
  { value: "atencao", label: "Pedem cuidado próximo" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

type CellsStructureSearchProps = {
  query: string;
  filter: CellsFilter;
  sectionId: string;
};

export function CellsStructureSearch(props: CellsStructureSearchProps) {
  return (
    <StructureSearch
      {...props}
      basePath="/celulas"
      defaultFilter="todos"
      filters={CELLS_FILTERS}
      ariaLabel="Buscar célula ou liderança"
      placeholder="Buscar célula ou liderança..."
    />
  );
}
