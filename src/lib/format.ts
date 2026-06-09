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

export function percent(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
