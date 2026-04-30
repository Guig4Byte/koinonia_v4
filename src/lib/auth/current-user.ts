import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readAuthSession } from "@/lib/auth/session";

export async function getAuthenticatedUser() {
  const session = await readAuthSession();

  if (!session) return null;

  return prisma.user.findFirst({
    where: {
      id: session.id,
      churchId: session.churchId,
      role: session.role,
    },
    include: { church: true, person: true },
  });
}

export async function getCurrentUser() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/login");
  }

  return authenticatedUser;
}
