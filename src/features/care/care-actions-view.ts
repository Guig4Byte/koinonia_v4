export type CareFlowStage = "idle" | "confirm" | "confirm-existing" | "ask-note" | "note" | "done";

export type CareContactLinks = {
  tel?: string;
  whatsapp?: string;
};

export { CARE_NOTE_MAX_LENGTH } from "./care-note";
export { careSavedMessage } from "./care-copy";

export const CARE_PHONE_MIN_DIGITS = 10;

export function digitsOnly(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

export function careContactInfo(phone?: string | null) {
  const digits = digitsOnly(phone);
  const hasPhone = digits.length >= CARE_PHONE_MIN_DIGITS;

  return {
    digits,
    hasPhone,
    links: {
      tel: hasPhone ? `tel:+${digits}` : undefined,
      whatsapp: hasPhone ? `https://wa.me/${digits}` : undefined,
    } satisfies CareContactLinks,
  };
}

export function careNoteId(personId?: string) {
  return `note-${personId ?? "person"}`;
}
