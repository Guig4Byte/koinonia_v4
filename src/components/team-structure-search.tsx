"use client";

import { StructureSearch } from "@/components/structure-search";
import { STRUCTURE_SEARCH_CONFIG } from "@/lib/structure-search-config";
import type { TeamFilter } from "@/features/team/team-filters";

type TeamStructureSearchProps = {
  query: string;
  filter: TeamFilter;
  sectionId: string;
};

export function TeamStructureSearch(props: TeamStructureSearchProps) {
  return <StructureSearch {...STRUCTURE_SEARCH_CONFIG.team} {...props} />;
}
