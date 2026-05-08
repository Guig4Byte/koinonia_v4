export type CareFlowStage = "idle" | "confirm" | "confirm-existing" | "ask-note" | "note" | "done";

export type CareContactLinks = {
  tel?: string;
  whatsapp?: string;
};

export const CARE_NOTE_MAX_LENGTH = 500;

export function digitsOnly(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

export function careContactInfo(phone?: string | null) {
  const digits = digitsOnly(phone);
  const hasPhone = digits.length >= 10;

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

export function careSavedMessage(hasNote: boolean) {
  return hasNote ? "Contato feito com anotação." : "Contato feito.";
}
