export const MIN_WEEKDAY = 0;
export const MAX_WEEKDAY = 6;
export const DAYS_PER_WEEK = 7;

export const WEEKDAY_LABELS: Record<number, string> = {
  [MIN_WEEKDAY]: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  [MAX_WEEKDAY]: "Sábado",
};

export const WEEKDAY_OPTIONS = Object.entries(WEEKDAY_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
})) as Array<{ value: number; label: string }>;

export function isValidWeekday(value: number | null | undefined): value is number {
  return Number.isInteger(value)
    && value !== null
    && value !== undefined
    && value >= MIN_WEEKDAY
    && value <= MAX_WEEKDAY;
}

export function weekdayLabel(day: number | null | undefined, fallback = "Dia informado") {
  if (!isValidWeekday(day)) return fallback;
  return WEEKDAY_LABELS[day] ?? fallback;
}
