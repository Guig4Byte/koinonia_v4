export const PERSON_PHONE_MAX_LENGTH = 30;
export const PERSON_PHONE_MIN_DIGITS = 10;
export const PERSON_PHONE_MAX_DIGITS = 15;

export type PersonPhoneError =
  | "telefone-obrigatorio"
  | "telefone-invalido"
  | "telefone-longo";

export type PersonPhoneValidationResult =
  | { ok: true; phone: string }
  | { ok: false; error: PersonPhoneError };

export function personPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function validatePersonPhoneValue(value: unknown): PersonPhoneValidationResult {
  const phone = typeof value === "string" ? value.trim() : "";

  if (!phone) return { ok: false, error: "telefone-obrigatorio" };
  if (phone.length > PERSON_PHONE_MAX_LENGTH) return { ok: false, error: "telefone-longo" };

  const digits = personPhoneDigits(phone);
  if (digits.length < PERSON_PHONE_MIN_DIGITS) return { ok: false, error: "telefone-invalido" };
  if (digits.length > PERSON_PHONE_MAX_DIGITS) return { ok: false, error: "telefone-longo" };

  return { ok: true, phone };
}

export function parsePersonPhonePayload(payload: unknown): PersonPhoneValidationResult {
  if (typeof payload !== "object" || payload === null || !("phone" in payload)) {
    return { ok: false, error: "telefone-obrigatorio" };
  }

  return validatePersonPhoneValue((payload as { phone?: unknown }).phone);
}

export function personPhoneErrorMessage(error?: PersonPhoneError | null) {
  const messages: Record<PersonPhoneError, string> = {
    "telefone-obrigatorio": "Informe o telefone de contato.",
    "telefone-invalido": "Informe um telefone com DDD.",
    "telefone-longo": "O telefone informado está longo demais.",
  };

  return error ? messages[error] : null;
}
