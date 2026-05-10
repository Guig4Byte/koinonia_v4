import type { StructureSearchConfig } from "@/components/structure-search";
import { CELLS_FILTERS, type CellsFilter } from "@/features/groups/cells-page-filters";
import { TEAM_FILTERS, type TeamFilter } from "@/features/team/team-filters";
import { FILTER_ALL } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";

export const STRUCTURE_SEARCH_CONFIG = {
  cells: {
    basePath: ROUTES.cells,
    defaultFilter: FILTER_ALL,
    filters: CELLS_FILTERS,
    ariaLabel: "Buscar célula ou liderança",
    placeholder: "Buscar célula ou liderança...",
  } satisfies StructureSearchConfig<CellsFilter>,

  team: {
    basePath: ROUTES.team,
    defaultFilter: FILTER_ALL,
    filters: TEAM_FILTERS,
    ariaLabel: "Buscar supervisor ou célula",
    placeholder: "Buscar supervisor ou célula...",
  } satisfies StructureSearchConfig<TeamFilter>,
} as const;
