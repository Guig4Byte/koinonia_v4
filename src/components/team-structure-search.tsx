"use client";

import { StructureSearch } from "@/components/structure-search";

type TeamFilter = "todos" | "atencao" | "sem-presenca";

const TEAM_FILTERS: Array<{ value: TeamFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Pedem atenção" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

type TeamStructureSearchProps = {
  query: string;
  filter: TeamFilter;
  sectionId: string;
};

export function TeamStructureSearch(props: TeamStructureSearchProps) {
  return (
    <StructureSearch
      {...props}
      basePath="/equipe"
      defaultFilter="todos"
      filters={TEAM_FILTERS}
      ariaLabel="Buscar supervisor ou célula"
      placeholder="Buscar supervisor ou célula..."
    />
  );
}
