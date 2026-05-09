import { z } from "zod";
import { careKindSchema, careNoteSchema } from "./care-payload";

const carePayloadSchema = z.object({
  kind: careKindSchema,
  note: careNoteSchema,
  resolveOpenSignals: z.boolean().default(true),
});

export function parseCarePayload(input: unknown) {
  return carePayloadSchema.safeParse(input);
}

export function resolvedAttentionMessage(resolvedSignalsCount: number, personStatusChangedToCare = false) {
  if (personStatusChangedToCare) {
    if (resolvedSignalsCount === 1) return "1 motivo de atenção foi cuidado. Pessoa ficou em cuidado.";
    if (resolvedSignalsCount > 1) return `${resolvedSignalsCount} motivos de atenção foram cuidados. Pessoa ficou em cuidado.`;
    return "Cuidado registrado. Pessoa ficou em cuidado.";
  }

  if (resolvedSignalsCount <= 0) return "Nenhum motivo de atenção foi alterado.";
  if (resolvedSignalsCount === 1) return "1 motivo de atenção foi cuidado.";
  return `${resolvedSignalsCount} motivos de atenção foram cuidados.`;
}
