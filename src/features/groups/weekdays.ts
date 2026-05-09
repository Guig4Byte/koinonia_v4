export const WEEKDAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export const WEEKDAY_OPTIONS = Object.entries(WEEKDAY_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
})) as Array<{ value: number; label: string }>;

export function weekdayLabel(day: number | null | undefined, fallback = "Dia informado") {
  if (day === null || day === undefined) return fallback;
  return WEEKDAY_LABELS[day] ?? fallback;
}
