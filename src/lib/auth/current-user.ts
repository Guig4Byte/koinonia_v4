import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readAuthSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";

export async function getAuthenticatedUser() {
  const session = await readAuthSession();

  if (!session) return null;

  return prisma.user.findFirst({
    where: {
      id: session.id,
      churchId: session.churchId,
      role: session.role,
    },
    select: {
      id: true,
      churchId: true,
      personId: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function getCurrentUser() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect(ROUTES.login);
  }

  return authenticatedUser;
}
