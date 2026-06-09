"use server";

import { redirect } from "next/navigation";
import { parsePasswordChangeFormData } from "@/features/account/password-form";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { ROUTES, routeWithQuery } from "@/lib/routes";

function redirectWithPasswordError(error: string): never {
  redirect(routeWithQuery(ROUTES.account, { erro: error }));
}

export async function changeOwnPasswordAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const parsed = parsePasswordChangeFormData(formData);

  if (!parsed.ok) {
    redirectWithPasswordError(parsed.error);
  }

  const user = await prisma.user.findFirst({
    where: { id: currentUser.id, churchId: currentUser.churchId, isActive: true },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    redirectWithPasswordError("usuario-nao-encontrado");
  }

  const currentPasswordIsValid = await verifyPassword(parsed.values.currentPassword, user.passwordHash);
  if (!currentPasswordIsValid) {
    redirectWithPasswordError("senha-atual-invalida");
  }

  const samePassword = await verifyPassword(parsed.values.newPassword, user.passwordHash);
  if (samePassword) {
    redirectWithPasswordError("senha-igual-atual");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.values.newPassword) },
    select: { id: true },
  });

  redirect(routeWithQuery(ROUTES.account, { salvo: "senha-alterada" }));
}
