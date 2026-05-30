import { parseClockTime } from "@/lib/clock-time";
import { isValidWeekday, WEEKDAY_OPTIONS } from "@/features/groups/weekdays";

export { WEEKDAY_OPTIONS };

export const GROUP_NAME_MAX_LENGTH = 120;
export const GROUP_LOCATION_MAX_LENGTH = 160;

export type GroupFormValues = {
  name: string;
  meetingDayOfWeek: number | null;
  meetingTime: string | null;
  locationName: string | null;
  isActive: boolean;
};

export type GroupFormError =
  | "nome-obrigatorio"
  | "nome-longo"
  | "agenda-incompleta"
  | "dia-invalido"
  | "horario-invalido"
  | "local-longo";

export type GroupFormParseResult =
  | { ok: true; values: GroupFormValues }
  | { ok: false; error: GroupFormError };

type GroupFormFields = {
  name?: unknown;
  meetingDayOfWeek?: unknown;
  meetingTime?: unknown;
  locationName?: unknown;
  isActive?: unknown;
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableStringValue(value: unknown) {
  const text = stringValue(value);
  return text.length > 0 ? text : null;
}

function parseMeetingDayOfWeek(value: unknown) {
  const text = stringValue(value);
  if (!text) return { ok: true as const, value: null };

  const day = Number(text);
  if (!isValidWeekday(day)) {
    return { ok: false as const, error: "dia-invalido" as const };
  }

  return { ok: true as const, value: day };
}

function parseMeetingTimeField(value: unknown) {
  const time = nullableStringValue(value);
  if (!time) return { ok: true as const, value: null };

  if (!parseClockTime(time)) {
    return { ok: false as const, error: "horario-invalido" as const };
  }

  return { ok: true as const, value: time };
}

function parseIsActive(value: unknown) {
  return value === "on" || value === "true" || value === true;
}

export function parseGroupFormFields(fields: GroupFormFields): GroupFormParseResult {
  const name = stringValue(fields.name);

  if (!name) return { ok: false, error: "nome-obrigatorio" };
  if (name.length > GROUP_NAME_MAX_LENGTH) return { ok: false, error: "nome-longo" };

  const meetingDayOfWeek = parseMeetingDayOfWeek(fields.meetingDayOfWeek);
  if (!meetingDayOfWeek.ok) return { ok: false, error: meetingDayOfWeek.error };

  const meetingTime = parseMeetingTimeField(fields.meetingTime);
  if (!meetingTime.ok) return { ok: false, error: meetingTime.error };

  if ((meetingDayOfWeek.value === null && meetingTime.value !== null) || (meetingDayOfWeek.value !== null && meetingTime.value === null)) {
    return { ok: false, error: "agenda-incompleta" };
  }

  const locationName = nullableStringValue(fields.locationName);
  if (locationName && locationName.length > GROUP_LOCATION_MAX_LENGTH) return { ok: false, error: "local-longo" };

  return {
    ok: true,
    values: {
      name,
      meetingDayOfWeek: meetingDayOfWeek.value,
      meetingTime: meetingTime.value,
      locationName,
      isActive: parseIsActive(fields.isActive),
    },
  };
}

export function parseGroupFormData(formData: FormData) {
  return parseGroupFormFields({
    name: formData.get("name"),
    meetingDayOfWeek: formData.get("meetingDayOfWeek"),
    meetingTime: formData.get("meetingTime"),
    locationName: formData.get("locationName"),
    isActive: formData.get("isActive"),
  });
}

export type GroupFormFieldName = "name" | "schedule" | "locationName";

export function groupFormFieldErrors(error: string | undefined): Partial<Record<GroupFormFieldName, string>> {
  if (!error) return {};

  const messages: Partial<Record<GroupFormError, { field: GroupFormFieldName; message: string }>> = {
    "nome-obrigatorio": { field: "name", message: "O nome da célula é obrigatório." },
    "nome-longo": { field: "name", message: `Até ${GROUP_NAME_MAX_LENGTH} caracteres.` },
    "agenda-incompleta": { field: "schedule", message: "Dia e horário precisam estar juntos." },
    "dia-invalido": { field: "schedule", message: "O dia padrão precisa ser válido." },
    "horario-invalido": { field: "schedule", message: "O horário precisa estar no formato hh:mm." },
    "local-longo": { field: "locationName", message: `Até ${GROUP_LOCATION_MAX_LENGTH} caracteres.` },
  };

  const fieldError = messages[error as GroupFormError];
  return fieldError ? { [fieldError.field]: fieldError.message } : {};
}

export function groupFormErrorMessage(error: string | undefined) {
  const messages: Partial<Record<GroupFormError | "permissao" | "nao-encontrada", string>> = {
    "nome-obrigatorio": "O nome da célula precisa estar preenchido.",
    "nome-longo": `O nome pode ter até ${GROUP_NAME_MAX_LENGTH} caracteres.`,
    "agenda-incompleta": "Dia e horário precisam estar juntos, ou os dois podem ficar em branco.",
    "dia-invalido": "O dia padrão precisa ser válido.",
    "horario-invalido": "O horário precisa estar no formato hh:mm.",
    "local-longo": `O local pode ter até ${GROUP_LOCATION_MAX_LENGTH} caracteres.`,
    permissao: "Esta célula não está disponível para alteração no seu acesso.",
    "nao-encontrada": "Célula não encontrada.",
  };

  if (!error) return null;
  return messages[error as keyof typeof messages] ?? "Não foi possível salvar a célula.";
}
