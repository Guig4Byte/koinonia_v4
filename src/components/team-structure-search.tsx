"use client";

import { StructureSearch } from "@/components/structure-search";
import { TEAM_FILTERS, type TeamFilter } from "@/features/team/team-filters";
import { ROUTES } from "@/lib/routes";

type TeamStructureSearchProps = {
  query: string;
  filter: TeamFilter;
  sectionId: string;
};

export function TeamStructureSearch(props: TeamStructureSearchProps) {
  return (
    <StructureSearch
      {...props}
      basePath={ROUTES.team}
      defaultFilter="todos"
      filters={TEAM_FILTERS}
      ariaLabel="Buscar supervisor ou célula"
      placeholder="Buscar supervisor ou célula..."
    />
  );
}
