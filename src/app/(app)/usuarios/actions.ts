"use server";

import { redirect } from "next/navigation";
import {
  createManagedUserForChurch,
  resetManagedUserPasswordForChurch,
  updateManagedUserForChurch,
} from "@/app/(app)/usuarios/actions.commands";
import { canManageUsers } from "@/features/permissions/permissions";
import { parseUserFormData, type UserFormError } from "@/features/users/user-form";
import {
  parseUserPasswordResetFormData,
  type UserPasswordResetError,
} from "@/features/users/user-password-reset";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES, routeWithQuery } from "@/lib/routes";

function redirectWithError(path: string, error: UserFormError | "permissao" | "usuario-nao-encontrado"): never {
  redirect(routeWithQuery(path, { erro: error }));
}


function redirectWithPasswordResetError(userId: string, error: UserPasswordResetError | "permissao"): never {
  redirect(routeWithQuery(ROUTES.editUser(userId), { erroSenha: error }));
}

export async function createManagedUserAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!canManageUsers(user)) {
    redirectWithError(ROUTES.team, "permissao");
  }

  const parsed = parseUserFormData(formData, { requirePassword: true });
  if (!parsed.ok) {
    redirectWithError(ROUTES.newUser, parsed.error);
  }

  const result = await createManagedUserForChurch(user, parsed.values);
  if (!result.ok) {
    redirectWithError(ROUTES.newUser, result.error);
  }

  redirect(routeWithQuery(ROUTES.users, { salvo: "usuario-criado" }));
}

export async function updateManagedUserAction(userId: string, formData: FormData) {
  const user = await getCurrentUser();
  const editPath = ROUTES.editUser(userId);

  if (!canManageUsers(user)) {
    redirectWithError(editPath, "permissao");
  }

  const parsed = parseUserFormData(formData, { requirePassword: false });
  if (!parsed.ok) {
    redirectWithError(editPath, parsed.error);
  }

  const result = await updateManagedUserForChurch(user, userId, parsed.values);
  if (!result.ok) {
    redirectWithError(result.error === "usuario-nao-encontrado" ? ROUTES.users : editPath, result.error);
  }

  redirect(routeWithQuery(ROUTES.users, { salvo: "usuario-atualizado" }));
}


export async function resetManagedUserPasswordAction(userId: string, formData: FormData) {
  const user = await getCurrentUser();

  if (!canManageUsers(user)) {
    redirectWithPasswordResetError(userId, "permissao");
  }

  if (user.id === userId) {
    redirectWithPasswordResetError(userId, "senha-propria");
  }

  const parsed = parseUserPasswordResetFormData(formData);
  if (!parsed.ok) {
    redirectWithPasswordResetError(userId, parsed.error);
  }

  const result = await resetManagedUserPasswordForChurch(user, userId, parsed.values.password);
  if (!result.ok) {
    redirectWithPasswordResetError(userId, result.error);
  }

  redirect(routeWithQuery(ROUTES.editUser(userId), { salvo: "senha-redefinida" }));
}
