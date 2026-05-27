import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_PRESENCE,
  FILTER_SUPPORT,
  FILTER_URGENT,
  readFilterParam,
  type FilterOption,
} from "@/lib/filter-param";
import { routeWithQuery, ROUTES } from "@/lib/routes";

export const CELLS_SECTION_ID = "celulas-supervisionadas";

export type CellsFilter =
  | typeof FILTER_ALL
  | typeof FILTER_ATTENTION
  | typeof FILTER_IN_CARE
  | typeof FILTER_SUPPORT
  | typeof FILTER_PRESENCE
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_LOW_PRESENCE;

export const CELLS_FILTERS: ReadonlyArray<FilterOption<CellsFilter>> = [
  { value: FILTER_ALL, label: "Todas" },
  { value: FILTER_URGENT, label: "Urgente", tone: "risk" },
  { value: FILTER_ATTENTION, label: "Em atenção", tone: "warn" },
  { value: FILTER_IN_CARE, label: "Em cuidado", tone: "care" },
  { value: FILTER_SUPPORT, label: "Apoio pedido", tone: "support" },
  { value: FILTER_PRESENCE, label: "Presença", tone: "neutral" },
];

const ACCEPTED_CELLS_FILTERS: ReadonlyArray<FilterOption<CellsFilter>> = [
  ...CELLS_FILTERS,
  { value: FILTER_PASTORAL, label: "Cuidado pastoral" },
  { value: FILTER_NO_RECENT_PRESENCE, label: "Retomar contato" },
  { value: FILTER_LOW_PRESENCE, label: "Presença baixa" },
];

export function readCellsFilter(value: string | null | undefined): CellsFilter {
  return readFilterParam(ACCEPTED_CELLS_FILTERS, value, FILTER_ALL);
}

export function visibleCellsFilter(filter: CellsFilter): CellsFilter {
  if (filter === FILTER_PASTORAL) return FILTER_URGENT;
  if (filter === FILTER_NO_RECENT_PRESENCE || filter === FILTER_LOW_PRESENCE) return FILTER_PRESENCE;

  return filter;
}

export function cellsFilterHref(filter: CellsFilter) {
  const path = filter === FILTER_ALL
    ? ROUTES.cells
    : routeWithQuery(ROUTES.cells, { filtro: filter });

  return `${path}#${CELLS_SECTION_ID}`;
}
