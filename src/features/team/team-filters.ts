import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_NO_RECENT_PRESENCE,
  NO_RECENT_PRESENCE_FILTER_LABEL,
  readFilterParam,
  type FilterOption,
} from "@/lib/filter-param";

export type TeamFilter = typeof FILTER_ALL | typeof FILTER_ATTENTION | typeof FILTER_NO_RECENT_PRESENCE;

export const TEAM_FILTERS: ReadonlyArray<FilterOption<TeamFilter>> = [
  { value: FILTER_ALL, label: "Todos" },
  { value: FILTER_ATTENTION, label: "Atenção" },
  { value: FILTER_NO_RECENT_PRESENCE, label: NO_RECENT_PRESENCE_FILTER_LABEL },
];

export function readTeamFilter(value: string | null | undefined): TeamFilter {
  return readFilterParam(TEAM_FILTERS, value, FILTER_ALL);
}
