export const FILTER_ALL = "todos";
export const FILTER_ATTENTION = "atencao";
export const FILTER_NO_RECENT_PRESENCE = "sem-presenca";
export const FILTER_IN_CARE = "em-cuidado";
export const FILTER_ACTIVE = "ativos";

export const NO_RECENT_PRESENCE_LABEL = "Sem presença recente";
export const NO_RECENT_PRESENCE_FILTER_LABEL = NO_RECENT_PRESENCE_LABEL;

export type FilterOption<T extends string> = Readonly<{
  value: T;
  label: string;
}>;

export function readFilterParam<T extends string>(
  filters: ReadonlyArray<{ value: T }>,
  value: string | null | undefined,
  fallback: T,
): T {
  return filters.some((filter) => filter.value === value) ? value as T : fallback;
}
