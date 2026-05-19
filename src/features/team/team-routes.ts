import { ROUTES } from "@/lib/routes";

export const TEAM_FILTERS_SECTION_ID = "equipe-filtros";
export const SUPERVISORS_SECTION_ID = "supervisores";

export function teamSupervisorsSectionHref() {
  return `${ROUTES.team}#${SUPERVISORS_SECTION_ID}`;
}
