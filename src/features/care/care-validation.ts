import { z } from "zod";
import { CareKind } from "../../generated/prisma/client";

const noteSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().max(500, "A anotação deve ter no máximo 500 caracteres.").optional(),
).transform((value) => (value && value.length > 0 ? value : undefined));

export const carePayloadSchema = z.object({
  kind: z.nativeEnum(CareKind),
  note: noteSchema,
  resolveOpenSignals: z.boolean().default(true),
});

export type CarePayload = z.infer<typeof carePayloadSchema>;

export function parseCarePayload(input: unknown) {
  return carePayloadSchema.safeParse(input);
}

export function resolvedAttentionMessage(resolvedSignalsCount: number, personStatusChangedToCare = false) {
  if (personStatusChangedToCare) {
    if (resolvedSignalsCount === 1) return "1 motivo de atenção foi resolvido. Pessoa ficou em cuidado.";
    if (resolvedSignalsCount > 1) return `${resolvedSignalsCount} motivos de atenção foram resolvidos. Pessoa ficou em cuidado.`;
    return "Cuidado registrado. Pessoa ficou em cuidado.";
  }

  if (resolvedSignalsCount <= 0) return "Nenhum motivo de atenção foi alterado.";
  if (resolvedSignalsCount === 1) return "1 motivo de atenção foi resolvido.";
  return `${resolvedSignalsCount} motivos de atenção foram resolvidos.`;
}
