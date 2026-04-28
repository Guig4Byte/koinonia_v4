import { cookies } from "next/headers";
import { UserRole } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_ROLE = UserRole.PASTOR;

function parseRole(value: string | undefined): UserRole {
  if (!value) return DEFAULT_ROLE;
  if (Object.values(UserRole).includes(value as UserRole)) return value as UserRole;
  return DEFAULT_ROLE;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const role = parseRole(cookieStore.get("koinonia-demo-role")?.value);

  const user = await prisma.user.findFirst({
    where: { role },
    include: { church: true, person: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error("Nenhum usuário demo encontrado. Rode npm run db:seed.");
  }

  return user;
}
