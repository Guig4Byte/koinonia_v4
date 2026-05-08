export const BRASILIA_UTC_OFFSET_HOURS = 3;
export const BRASILIA_UTC_OFFSET_MS = BRASILIA_UTC_OFFSET_HOURS * 60 * 60 * 1000;

const SHORT_MONTHS_PT_BR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toBrasiliaShiftedDate(date: Date) {
  return new Date(date.getTime() - BRASILIA_UTC_OFFSET_MS);
}

export type BrasiliaDateParts = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  weekday: number;
};

export function getBrasiliaDateParts(date: Date): BrasiliaDateParts {
  const shifted = toBrasiliaShiftedDate(date);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    seconds: shifted.getUTCSeconds(),
    milliseconds: shifted.getUTCMilliseconds(),
    weekday: shifted.getUTCDay(),
  };
}

export function dateFromBrasiliaParts(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
) {
  return new Date(Date.UTC(year, month - 1, day, hours + BRASILIA_UTC_OFFSET_HOURS, minutes, seconds, milliseconds));
}

export function startOfBrasiliaDay(date: Date) {
  const parts = getBrasiliaDateParts(date);
  return dateFromBrasiliaParts(parts.year, parts.month, parts.day);
}

export function addBrasiliaDays(date: Date, days: number) {
  const parts = getBrasiliaDateParts(date);
  return dateFromBrasiliaParts(
    parts.year,
    parts.month,
    parts.day + days,
    parts.hours,
    parts.minutes,
    parts.seconds,
    parts.milliseconds,
  );
}

export function startOfBrasiliaWeek(date: Date, weekStartsOn = 1) {
  const dayStart = startOfBrasiliaDay(date);
  const weekday = getBrasiliaDateParts(dayStart).weekday;
  const daysSinceWeekStart = (weekday - weekStartsOn + 7) % 7;
  return addBrasiliaDays(dayStart, -daysSinceWeekStart);
}

export function endOfBrasiliaWeek(date: Date, weekStartsOn = 1) {
  return new Date(addBrasiliaDays(startOfBrasiliaWeek(date, weekStartsOn), 7).getTime() - 1);
}

export function isSameBrasiliaDay(left: Date, right: Date) {
  return startOfBrasiliaDay(left).getTime() === startOfBrasiliaDay(right).getTime();
}

export function isTodayInBrasilia(date: Date, referenceDate = new Date()) {
  return isSameBrasiliaDay(date, referenceDate);
}

export function isTomorrowInBrasilia(date: Date, referenceDate = new Date()) {
  return isSameBrasiliaDay(date, addBrasiliaDays(referenceDate, 1));
}

export function formatBrasiliaShortDate(date: Date, referenceDate = new Date()) {
  if (isTodayInBrasilia(date, referenceDate)) return "Hoje";
  if (isTomorrowInBrasilia(date, referenceDate)) return "Amanhã";

  const parts = getBrasiliaDateParts(date);
  return `${pad2(parts.day)} ${SHORT_MONTHS_PT_BR[parts.month - 1]}`;
}

export function formatBrasiliaTime(date: Date) {
  const parts = getBrasiliaDateParts(date);
  return `${pad2(parts.hours)}:${pad2(parts.minutes)}`;
}
