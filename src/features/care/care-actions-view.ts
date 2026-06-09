import type { CareContactMethod as CareContactMethodType } from "./care-copy";

export type CareFlowStage = "idle" | "phone" | "confirm" | "confirm-existing" | "ask-note" | "note" | "done";

export type CareContactLinks = {
  tel?: string;
  whatsapp?: string;
};

export type CareContactInfoOptions = {
  personName?: string | null;
};

export { CARE_NOTE_MAX_LENGTH } from "./care-note";
export { careSavedMessage, type CareContactMethod } from "./care-copy";

export const CARE_PHONE_MIN_DIGITS = 10;
export const CARE_BR_COUNTRY_CODE = "55";

export function digitsOnly(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

export function whatsappDigitsForPhone(phone?: string | null) {
  const digits = digitsOnly(phone);
  if (phone?.trim().startsWith("+")) return digits;
  if (digits.length === 10 || digits.length === 11) return `${CARE_BR_COUNTRY_CODE}${digits}`;
  return digits;
}

export function careWhatsappMessage(personName?: string | null) {
  const cleanName = personName?.trim().split(/\s+/)[0];
  return cleanName ? `Olá, ${cleanName}! Graça e paz. Como você está?` : "Olá! Graça e paz. Como você está?";
}

export function careContactInfo(phone?: string | null, options: CareContactInfoOptions = {}) {
  const digits = digitsOnly(phone);
  const whatsappDigits = whatsappDigitsForPhone(phone);
  const hasPhone = digits.length >= CARE_PHONE_MIN_DIGITS;
  const displayPhone = phone?.trim() || digits;
  const whatsappText = encodeURIComponent(careWhatsappMessage(options.personName));

  return {
    digits,
    displayPhone,
    hasPhone,
    links: {
      tel: hasPhone ? `tel:+${digits}` : undefined,
      whatsapp: hasPhone ? `https://wa.me/${whatsappDigits}?text=${whatsappText}` : undefined,
    } satisfies CareContactLinks,
  };
}

export function careKindForContactMethod(method?: CareContactMethodType) {
  if (method === "call") return "CALL";
  if (method === "whatsapp") return "WHATSAPP";
  return "MARKED_CARED";
}

export function careNoteId(personId?: string) {
  return `note-${personId ?? "person"}`;
}

export function carePhoneId(personId?: string) {
  return `phone-${personId ?? "person"}`;
}
