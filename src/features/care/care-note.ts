export const CARE_NOTE_MAX_LENGTH = 500;
export const CARE_NOTE_TOO_LONG_MESSAGE = `A anotação deve ter no máximo ${CARE_NOTE_MAX_LENGTH} caracteres.`;

export function normalizeCareNote(note: unknown) {
  if (typeof note !== "string") return note;
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
