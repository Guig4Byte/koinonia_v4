import { WEEKDAY_OPTIONS } from "@/features/groups/weekdays";

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
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    return { ok: false as const, error: "dia-invalido" as const };
  }

  return { ok: true as const, value: day };
}

function parseMeetingTime(value: unknown) {
  const time = nullableStringValue(value);
  if (!time) return { ok: true as const, value: null };

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
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

  const meetingTime = parseMeetingTime(fields.meetingTime);
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

export function groupFormErrorMessage(error: string | undefined) {
  const messages: Partial<Record<GroupFormError | "permissao" | "nao-encontrada", string>> = {
    "nome-obrigatorio": "Informe o nome da célula.",
    "nome-longo": `Use um nome com até ${GROUP_NAME_MAX_LENGTH} caracteres.`,
    "agenda-incompleta": "Informe dia e horário juntos, ou deixe os dois em branco.",
    "dia-invalido": "Escolha um dia padrão válido.",
    "horario-invalido": "Informe o horário no formato hh:mm.",
    "local-longo": `Use um local com até ${GROUP_LOCATION_MAX_LENGTH} caracteres.`,
    permissao: "Você não pode alterar células.",
    "nao-encontrada": "Célula não encontrada.",
  };

  if (!error) return null;
  return messages[error as keyof typeof messages] ?? "Não foi possível salvar a célula.";
}
