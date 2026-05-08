export const CELLS_SECTION_ID = "celulas-supervisionadas";

export type CellsFilter = "todos" | "atencao" | "sem-presenca";

export const CELLS_FILTERS: Array<{ value: CellsFilter; label: string }> = [
  { value: "todos", label: "Todas" },
  { value: "atencao", label: "Pedem cuidado próximo" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

export function readCellsFilter(value: string): CellsFilter {
  return CELLS_FILTERS.some((filter) => filter.value === value) ? value as CellsFilter : "todos";
}
