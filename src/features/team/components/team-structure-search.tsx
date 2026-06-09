"use client";

import {
  StructureSearch,
  type StructureSearchConfig,
} from "@/components/shared/structure-search";
import { TEAM_FILTERS, type TeamFilter } from "@/features/team/team-filters";
import { FILTER_ALL } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";

type TeamStructureSearchProps = {
  query: string;
  filter: TeamFilter;
  sectionId: string;
};

const TEAM_STRUCTURE_SEARCH_CONFIG = {
  basePath: ROUTES.team,
  defaultFilter: FILTER_ALL,
  filters: TEAM_FILTERS,
  ariaLabel: "Buscar supervisor ou célula",
  placeholder: "Buscar supervisor ou célula...",
} satisfies StructureSearchConfig<TeamFilter>;

export function TeamStructureSearch(props: TeamStructureSearchProps) {
  return <StructureSearch {...TEAM_STRUCTURE_SEARCH_CONFIG} {...props} />;
}
