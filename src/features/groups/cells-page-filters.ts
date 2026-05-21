import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_SUPPORT,
  FILTER_URGENT,
  NO_RECENT_PRESENCE_FILTER_LABEL,
  readFilterParam,
  type FilterOption,
} from "@/lib/filter-param";
import { routeWithQuery, ROUTES } from "@/lib/routes";

export const CELLS_SECTION_ID = "celulas-supervisionadas";

export type CellsFilter =
  | typeof FILTER_ALL
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_SUPPORT
  | typeof FILTER_ATTENTION
  | typeof FILTER_IN_CARE
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_LOW_PRESENCE;

export const CELLS_FILTERS: ReadonlyArray<FilterOption<CellsFilter>> = [
  { value: FILTER_ALL, label: "Todas" },
  { value: FILTER_URGENT, label: "Urgentes" },
  { value: FILTER_PASTORAL, label: "Encaminhadas" },
  { value: FILTER_SUPPORT, label: "Apoio" },
  { value: FILTER_ATTENTION, label: "Cuidado próximo" },
  { value: FILTER_IN_CARE, label: "Em cuidado" },
  { value: FILTER_NO_RECENT_PRESENCE, label: NO_RECENT_PRESENCE_FILTER_LABEL },
  { value: FILTER_LOW_PRESENCE, label: "Presença baixa" },
];

export function readCellsFilter(value: string | null | undefined): CellsFilter {
  return readFilterParam(CELLS_FILTERS, value, FILTER_ALL);
}

export function cellsFilterHref(filter: CellsFilter) {
  const path = filter === FILTER_ALL
    ? ROUTES.cells
    : routeWithQuery(ROUTES.cells, { filtro: filter });

  return `${path}#${CELLS_SECTION_ID}`;
}
