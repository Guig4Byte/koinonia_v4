import {
  teamFilterToGroupFocus,
  type TeamFilter,
} from "@/features/team/team-filters";
import { FILTER_ALL } from "@/lib/filter-param";
import { routeWithQuery, ROUTES } from "@/lib/routes";

export function teamFilterBackHref(filter: TeamFilter) {
  return filter === FILTER_ALL ? ROUTES.team : ROUTES.teamFilter(filter);
}

export function teamGroupHref(
  groupId: string,
  activeFilter: TeamFilter = FILTER_ALL,
) {
  const focus = teamFilterToGroupFocus(activeFilter);

  if (!focus) return ROUTES.group(groupId);

  return routeWithQuery(ROUTES.group(groupId), {
    from: "equipe",
    filtro: activeFilter,
    foco: focus,
  });
}
