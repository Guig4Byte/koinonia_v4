import { dateFromBrasiliaParts, getBrasiliaDateParts } from "@/lib/brasilia-time";
import { comparePtBr } from "@/lib/text";

export const UPCOMING_BIRTHDAY_LOOKAHEAD_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SHORT_MONTHS_PT_BR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export type UpcomingBirthdaySource = {
  id: string;
  fullName: string;
  birthDate?: Date | string | null;
  groupName?: string | null;
};

export type UpcomingBirthdayItem = {
  personId: string;
  fullName: string;
  groupName?: string | null;
  dateLabel: string;
  relativeLabel: string;
  daysUntil: number;
};

type BirthdayParts = {
  day: number;
  month: number;
};

function birthdayPartsFromValue(value?: Date | string | null): BirthdayParts | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
  };
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function birthdayOccurrenceForYear({ day, month }: BirthdayParts, year: number) {
  return dateFromBrasiliaParts(year, month, Math.min(day, lastDayOfMonth(year, month)));
}

function startOfReferenceDay(referenceDate: Date) {
  const parts = getBrasiliaDateParts(referenceDate);

  return dateFromBrasiliaParts(parts.year, parts.month, parts.day);
}

function daysBetween(startDate: Date, endDate: Date) {
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
}

function nextBirthdayDaysUntil(parts: BirthdayParts, referenceDate: Date) {
  const today = startOfReferenceDay(referenceDate);
  const todayParts = getBrasiliaDateParts(today);
  let occurrence = birthdayOccurrenceForYear(parts, todayParts.year);

  if (occurrence.getTime() < today.getTime()) {
    occurrence = birthdayOccurrenceForYear(parts, todayParts.year + 1);
  }

  return {
    date: occurrence,
    daysUntil: daysBetween(today, occurrence),
  };
}

function birthdayDateLabel(date: Date) {
  const parts = getBrasiliaDateParts(date);
  const monthLabel = SHORT_MONTHS_PT_BR[parts.month - 1] ?? "";

  return `${String(parts.day).padStart(2, "0")} ${monthLabel}`;
}

function birthdayRelativeLabel(daysUntil: number) {
  if (daysUntil === 0) return "Hoje";
  if (daysUntil === 1) return "Amanhã";
  return `Em ${daysUntil} dias`;
}

function compareUpcomingBirthdays(left: UpcomingBirthdayItem, right: UpcomingBirthdayItem) {
  const dayDifference = left.daysUntil - right.daysUntil;
  if (dayDifference !== 0) return dayDifference;

  return comparePtBr(left.fullName, right.fullName);
}

export function buildUpcomingBirthdays(
  people: UpcomingBirthdaySource[],
  {
    referenceDate = new Date(),
    lookaheadDays = UPCOMING_BIRTHDAY_LOOKAHEAD_DAYS,
  }: { referenceDate?: Date; lookaheadDays?: number } = {},
): UpcomingBirthdayItem[] {
  const birthdaysByPerson = new Map<string, UpcomingBirthdayItem>();

  people.forEach((person) => {
    if (birthdaysByPerson.has(person.id)) return;

    const birthdayParts = birthdayPartsFromValue(person.birthDate);
    if (!birthdayParts) return;

    const nextBirthday = nextBirthdayDaysUntil(birthdayParts, referenceDate);
    if (nextBirthday.daysUntil < 0 || nextBirthday.daysUntil > lookaheadDays) return;

    birthdaysByPerson.set(person.id, {
      personId: person.id,
      fullName: person.fullName,
      groupName: person.groupName,
      dateLabel: birthdayDateLabel(nextBirthday.date),
      relativeLabel: birthdayRelativeLabel(nextBirthday.daysUntil),
      daysUntil: nextBirthday.daysUntil,
    });
  });

  return Array.from(birthdaysByPerson.values()).sort(compareUpcomingBirthdays);
}
