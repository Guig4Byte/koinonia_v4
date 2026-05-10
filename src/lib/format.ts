import { formatBrasiliaShortDate, formatBrasiliaTime } from "./brasilia-time";

export function formatShortDate(date: Date) {
  return formatBrasiliaShortDate(date);
}

export function formatTime(date: Date) {
  return formatBrasiliaTime(date);
}

export function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatNullable(value: string | number | null | undefined, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

export function percent(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
