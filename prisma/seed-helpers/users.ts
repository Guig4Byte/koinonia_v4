import { PersonStatus, type UserRole } from "../../src/generated/prisma/client";
import type { SeedPrismaClient, SeedUser } from "./types";

export async function createSeedUserWithPerson({
  prisma,
  churchId,
  name,
  email,
  role,
  passwordHash,
  personName,
  phone = null,
  status = PersonStatus.ACTIVE,
}: {
  prisma: SeedPrismaClient;
  churchId: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  personName?: string;
  phone?: string | null;
  status?: PersonStatus;
}): Promise<SeedUser> {
  const person = await prisma.person.create({
    data: {
      churchId,
      fullName: personName ?? name,
      phone,
      status,
    },
  });

  return prisma.user.create({
    data: {
      churchId,
      personId: person.id,
      name,
      email,
      passwordHash,
      role,
    },
    select: {
      id: true,
      personId: true,
      name: true,
      email: true,
      role: true,
    },
  });
}
