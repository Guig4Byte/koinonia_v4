import { z } from "zod";
import { CareKind } from "@/generated/prisma/client";
import { CARE_NOTE_MAX_LENGTH, CARE_NOTE_TOO_LONG_MESSAGE, normalizeCareNote } from "./care-note";

const contactShortcutKinds = new Set<CareKind>([
  CareKind.CALL,
  CareKind.WHATSAPP,
  CareKind.VISIT,
  CareKind.PRAYER,
]);

export function normalizeCareKind(kind: CareKind) {
  return contactShortcutKinds.has(kind) ? CareKind.MARKED_CARED : kind;
}

export const careKindSchema = z.nativeEnum(CareKind).transform(normalizeCareKind);

export const careNoteSchema = z.preprocess(
  normalizeCareNote,
  z.string().max(CARE_NOTE_MAX_LENGTH, CARE_NOTE_TOO_LONG_MESSAGE).optional(),
);
