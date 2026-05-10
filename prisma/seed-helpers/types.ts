import type { UserRole } from "../../src/generated/prisma/client";
import type { prisma } from "../../src/lib/prisma";

export type SeedPrismaClient = typeof prisma;

export type SeedUser = {
  id: string;
  personId: string | null;
  name: string;
  email: string;
  role: UserRole;
};

export type SeedMember = {
  id: string;
  fullName: string;
};
