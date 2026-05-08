import { BRASILIA_UTC_OFFSET_HOURS, BRASILIA_UTC_OFFSET_MS } from "@/lib/brasilia-time";

export type DateParts = { year: number; month: number; day: number };
export type CalendarMonth = { year: number; monthIndex: number };

export const MONTH_NAMES_PT_BR = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const WEEKDAY_LABELS_PT_BR = ["D", "S", "T", "Q", "Q", "S", "S"];

function padDatePart(part: number) {
  return String(part).padStart(2, "0");
}

export function formatBrasiliaDate({ year, month, day }: DateParts) {
  return `${padDatePart(day)}/${padDatePart(month)}/${year}`;
}

export function parseBrasiliaDateValue(dateValue: string): DateParts | null {
  const rawDate = dateValue.trim();
  const isoDateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brDateMatch = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!isoDateMatch && !brDateMatch) return null;

  const year = Number(isoDateMatch?.[1] ?? brDateMatch?.[3]);
  const month = Number(isoDateMatch?.[2] ?? brDateMatch?.[2]);
  const day = Number(isoDateMatch?.[3] ?? brDateMatch?.[1]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function shiftCalendarMonth(month: CalendarMonth, amount: number): CalendarMonth {
  const next = new Date(Date.UTC(month.year, month.monthIndex + amount, 1));
  return { year: next.getUTCFullYear(), monthIndex: next.getUTCMonth() };
}

export function calendarDays(month: CalendarMonth) {
  const firstWeekday = new Date(Date.UTC(month.year, month.monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(month.year, month.monthIndex + 1, 0)).getUTCDate();

  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

export function toBrasiliaDateTimeParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  const brasiliaTime = new Date(date.getTime() - BRASILIA_UTC_OFFSET_MS);

  return {
    date: formatBrasiliaDate({
      year: brasiliaTime.getUTCFullYear(),
      month: brasiliaTime.getUTCMonth() + 1,
      day: brasiliaTime.getUTCDate(),
    }),
    time: [padDatePart(brasiliaTime.getUTCHours()), padDatePart(brasiliaTime.getUTCMinutes())].join(":"),
  };
}

export function parseBrasiliaDateTime(dateValue: string, timeValue: string) {
  const dateParts = parseBrasiliaDateValue(dateValue);
  const timeMatch = timeValue.trim().match(/^(\d{2}):(\d{2})$/);

  if (!dateParts || !timeMatch) return null;

  const { year, month, day } = dateParts;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (hour > 23 || minute > 59) return null;

  const utcTime = Date.UTC(year, month - 1, day, hour + BRASILIA_UTC_OFFSET_HOURS, minute);
  const parsed = new Date(utcTime);
  const brasiliaCheck = new Date(parsed.getTime() - BRASILIA_UTC_OFFSET_MS);

  if (
    brasiliaCheck.getUTCFullYear() !== year ||
    brasiliaCheck.getUTCMonth() !== month - 1 ||
    brasiliaCheck.getUTCDate() !== day ||
    brasiliaCheck.getUTCHours() !== hour ||
    brasiliaCheck.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return parsed.toISOString();
}
