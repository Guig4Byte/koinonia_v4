import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_STABLE,
  FILTER_SUPPORT,
  FILTER_URGENT,
  readFilterParam,
  type FilterOption,
} from "@/lib/filter-param";

export type TeamFilter =
  | typeof FILTER_ALL
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_SUPPORT
  | typeof FILTER_ATTENTION
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_STABLE;

export type TeamGroupFocus = Exclude<TeamFilter, typeof FILTER_ALL>;

export const TEAM_FILTERS: ReadonlyArray<FilterOption<TeamFilter>> = [
  { value: FILTER_ALL, label: "Todos" },
  { value: FILTER_URGENT, label: "Urgente", tone: "risk" },
  { value: FILTER_PASTORAL, label: "Encaminhadas", tone: "risk" },
  { value: FILTER_SUPPORT, label: "Apoio pedido", tone: "support" },
  { value: FILTER_ATTENTION, label: "Em atenção", tone: "warn" },
  {
    value: FILTER_NO_RECENT_PRESENCE,
    label: "Retomar contato",
    tone: "neutral",
  },
  { value: FILTER_STABLE, label: "Estáveis", tone: "ok" },
];

export function readTeamFilter(value: string | null | undefined): TeamFilter {
  return readFilterParam(TEAM_FILTERS, value, FILTER_ALL);
}

export function teamFilterToGroupFocus(
  filter: TeamFilter,
): TeamGroupFocus | null {
  return filter === FILTER_ALL ? null : filter;
}
