export const FILTER_ALL = "todos";
export const FILTER_URGENT = "urgentes";
export const FILTER_PASTORAL = "encaminhadas";
export const FILTER_SUPPORT = "apoio";
export const FILTER_ATTENTION = "atencao";
export const FILTER_NO_RECENT_PRESENCE = "sem-presenca";
export const FILTER_LOW_PRESENCE = "presenca-baixa";
export const FILTER_PRESENCE = "presenca";
export const FILTER_STABLE = "estaveis";
export const FILTER_IN_CARE = "em-cuidado";
export const FILTER_ACTIVE = "ativos";

export const NO_RECENT_PRESENCE_LABEL = "Retomar contato";

export type FilterTone =
  | "risk"
  | "support"
  | "warn"
  | "care"
  | "neutral"
  | "ok";

export type FilterOption<T extends string> = Readonly<{
  value: T;
  label: string;
  tone?: FilterTone;
}>;

export function readFilterParam<T extends string>(
  filters: ReadonlyArray<{ value: T }>,
  value: string | null | undefined,
  fallback: T,
): T {
  return filters.some((filter) => filter.value === value) ? value as T : fallback;
}
