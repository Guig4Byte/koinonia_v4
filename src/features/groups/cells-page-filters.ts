import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_NO_RECENT_PRESENCE,
  NO_RECENT_PRESENCE_FILTER_LABEL,
  readFilterParam,
  type FilterOption,
} from "@/lib/filter-param";

export const CELLS_SECTION_ID = "celulas-supervisionadas";

export type CellsFilter = typeof FILTER_ALL | typeof FILTER_ATTENTION | typeof FILTER_NO_RECENT_PRESENCE;

export const CELLS_FILTERS: ReadonlyArray<FilterOption<CellsFilter>> = [
  { value: FILTER_ALL, label: "Todas" },
  { value: FILTER_ATTENTION, label: "Cuidado próximo" },
  { value: FILTER_NO_RECENT_PRESENCE, label: NO_RECENT_PRESENCE_FILTER_LABEL },
];

export function readCellsFilter(value: string | null | undefined): CellsFilter {
  return readFilterParam(CELLS_FILTERS, value, FILTER_ALL);
}
