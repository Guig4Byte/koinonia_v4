import type { CareKind } from "../../src/generated/prisma/client";
import type { SeedPrismaClient } from "./types";

export async function createSeedCareTouch({
  prisma,
  churchId,
  personId,
  groupId,
  actorId = null,
  kind,
  note = null,
  happenedAt,
}: {
  prisma: SeedPrismaClient;
  churchId: string;
  personId: string;
  groupId?: string | null;
  actorId?: string | null;
  kind: CareKind;
  note?: string | null;
  happenedAt: Date;
}) {
  return prisma.careTouch.create({
    data: {
      churchId,
      personId,
      groupId,
      actorId,
      kind,
      note: note?.trim() ? note.trim() : null,
      happenedAt,
    },
  });
}
