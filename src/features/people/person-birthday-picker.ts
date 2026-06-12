import { formatPersonBirthdayDraftInput } from "@/features/people/person-birthday";

export const BIRTHDAY_MIN_YEAR = 1900;
export const BIRTHDAY_CURRENT_YEAR = new Date().getFullYear();

const BIRTHDAY_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0"));

export const BIRTHDAY_MONTH_OPTIONS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
] as const;

export type BirthdayPickerDraft = {
  day: string;
  month: string;
  year: string;
};

export type BirthdayPickerDraftField = keyof BirthdayPickerDraft;

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function birthdayDayLimit(month?: string, year?: string) {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (!monthNumber) return 31;
  if ([4, 6, 9, 11].includes(monthNumber)) return 30;
  if (monthNumber === 2) {
    return Number.isInteger(yearNumber) && year?.length === 4
      ? isLeapYear(yearNumber)
        ? 29
        : 28
      : 29;
  }

  return 31;
}

export function birthdayDayOptions(month?: string, year?: string) {
  return BIRTHDAY_DAY_OPTIONS.slice(0, birthdayDayLimit(month, year));
}

export function birthdayDraftFromInput(value: string): BirthdayPickerDraft {
  const [day = "", month = "", year = ""] = formatPersonBirthdayDraftInput(value).split("/");

  return { day, month, year };
}

export function birthdayInputFromPickerDraft({ day, month, year }: BirthdayPickerDraft) {
  if (!day || !month || year.length !== 4) return "";

  return `${day}/${month}/${year}`;
}

export function decadeStartFromYear(year?: string, currentYear = BIRTHDAY_CURRENT_YEAR) {
  const parsedYear = Number(year);
  const fallbackYear = currentYear - 30;
  const yearForDecade = Number.isInteger(parsedYear) && parsedYear >= BIRTHDAY_MIN_YEAR && parsedYear <= currentYear
    ? parsedYear
    : fallbackYear;

  return Math.floor(yearForDecade / 10) * 10;
}

export function yearsForDecade(decadeStart: number, currentYear = BIRTHDAY_CURRENT_YEAR) {
  return Array.from({ length: 10 }, (_, index) => decadeStart + index)
    .filter((year) => year >= BIRTHDAY_MIN_YEAR && year <= currentYear)
    .map(String);
}

export function nextDecadeStart(
  decadeStart: number,
  direction: "previous" | "next",
  currentYear = BIRTHDAY_CURRENT_YEAR,
) {
  const nextValue = direction === "previous" ? decadeStart - 10 : decadeStart + 10;
  const currentDecadeStart = Math.floor(currentYear / 10) * 10;

  return Math.min(Math.max(nextValue, BIRTHDAY_MIN_YEAR), currentDecadeStart);
}

export function updateBirthdayPickerDraft(
  currentDraft: BirthdayPickerDraft,
  field: BirthdayPickerDraftField,
  value: string,
): BirthdayPickerDraft {
  const nextDraft = {
    ...currentDraft,
    [field]: field === "year" ? digitsOnly(value, 4) : digitsOnly(value, 2),
  };
  const dayLimit = birthdayDayLimit(nextDraft.month, nextDraft.year);

  if (nextDraft.day && Number(nextDraft.day) > dayLimit) {
    nextDraft.day = "";
  }

  return nextDraft;
}
