import { z } from "zod";
import { careKindSchema, careNoteSchema } from "./care-payload";
export { resolvedAttentionMessage } from "./care-copy";

const carePayloadSchema = z.object({
  kind: careKindSchema,
  note: careNoteSchema,
  resolveOpenSignals: z.boolean().default(true),
});

export function parseCarePayload(input: unknown) {
  return carePayloadSchema.safeParse(input);
}
