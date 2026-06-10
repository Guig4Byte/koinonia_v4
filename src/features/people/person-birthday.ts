export const PERSON_BIRTHDAY_INPUT_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

const PERSON_BIRTHDAY_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PERSON_BIRTHDAY_MAX_DIGITS = 8;

export type PersonBirthdayError =
  | "aniversario-invalido"
  | "aniversario-futuro";

export type PersonBirthdayValidationResult =
  | { ok: true; birthDate: Date | null; inputValue: string }
  | { ok: false; error: PersonBirthdayError };

type PersonBirthdayParts = {
  day: number;
  month: number;
  year: number;
};

function utcDateFromParts(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function isSameUtcDate(date: Date, year: number, month: number, day: number) {
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function displayInputFromParts({ day, month, year }: PersonBirthdayParts) {
  return [
    String(day).padStart(2, "0"),
    String(month).padStart(2, "0"),
    String(year).padStart(4, "0"),
  ].join("/");
}

function partsFromBirthdayInput(value: string): PersonBirthdayParts | null {
  if (PERSON_BIRTHDAY_INPUT_PATTERN.test(value)) {
    const [day, month, year] = value.split("/").map(Number);

    return { day, month, year };
  }

  if (PERSON_BIRTHDAY_ISO_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    return { day, month, year };
  }

  return null;
}

function dateFromBirthdayValue(value: Date | string): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parts = partsFromBirthdayInput(value);
  if (parts) return utcDateFromParts(parts.year, parts.month, parts.day);

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPersonBirthdayDraftInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, PERSON_BIRTHDAY_MAX_DIGITS);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function personBirthdayInputValue(value?: Date | string | null): string {
  if (!value) return "";

  if (typeof value === "string") {
    const parts = partsFromBirthdayInput(value);
    if (parts) return displayInputFromParts(parts);
  }

  const date = dateFromBirthdayValue(value);
  if (!date) return "";

  return displayInputFromParts({
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  });
}

export function formatPersonBirthday(value?: Date | string | null): string {
  if (!value) return "Aniversário não informado";

  const date = dateFromBirthdayValue(value);
  if (!date) return "Aniversário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

export function validatePersonBirthdayValue(value: unknown): PersonBirthdayValidationResult {
  const rawValue = typeof value === "string" ? value.trim() : "";
  const inputValue = PERSON_BIRTHDAY_ISO_PATTERN.test(rawValue)
    ? personBirthdayInputValue(rawValue)
    : formatPersonBirthdayDraftInput(rawValue);

  if (!inputValue) return { ok: true, birthDate: null, inputValue: "" };

  const parts = partsFromBirthdayInput(inputValue);
  if (!parts) return { ok: false, error: "aniversario-invalido" };

  const birthDate = utcDateFromParts(parts.year, parts.month, parts.day);

  if (!isSameUtcDate(birthDate, parts.year, parts.month, parts.day)) {
    return { ok: false, error: "aniversario-invalido" };
  }

  const today = new Date();
  const todayUtc = utcDateFromParts(
    today.getUTCFullYear(),
    today.getUTCMonth() + 1,
    today.getUTCDate(),
  );

  if (birthDate > todayUtc) return { ok: false, error: "aniversario-futuro" };

  return { ok: true, birthDate, inputValue };
}

export function parsePersonBirthdayPayload(payload: unknown): PersonBirthdayValidationResult {
  if (typeof payload !== "object" || payload === null || !("birthDate" in payload)) {
    return { ok: false, error: "aniversario-invalido" };
  }

  return validatePersonBirthdayValue((payload as { birthDate?: unknown }).birthDate);
}

export function personBirthdayErrorMessage(error?: PersonBirthdayError | null) {
  const messages: Record<PersonBirthdayError, string> = {
    "aniversario-invalido": "Informe uma data no formato dd/mm/aaaa.",
    "aniversario-futuro": "A data de aniversário não pode ficar no futuro.",
  };

  return error ? messages[error] : null;
}
