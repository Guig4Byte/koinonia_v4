"use server";

import { redirect } from "next/navigation";
import {
  createManagedUserForChurch,
  resetManagedUserPasswordForChurch,
  updateManagedUserForChurch,
} from "@/features/users/managed-user-commands";
import { canManageUsers } from "@/features/permissions/permissions";
import { parseUserFormData, type UserFormError } from "@/features/users/user-form";
import {
  parseUserPasswordResetFormData,
  type UserPasswordResetError,
} from "@/features/users/user-password-reset";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES, routeWithQuery } from "@/lib/routes";

type UserActionError = UserFormError | "permissao" | "usuario-nao-encontrado";
type UserSavedStatus = "usuario-criado" | "usuario-atualizado";
type PasswordResetActionError = UserPasswordResetError | "permissao";

function redirectWithUserError(path: string, error: UserActionError): never {
  redirect(routeWithQuery(path, { erro: error }));
}

function redirectWithUserSaved(status: UserSavedStatus): never {
  redirect(routeWithQuery(ROUTES.users, { salvo: status }));
}

function redirectWithPasswordResetError(userId: string, error: PasswordResetActionError): never {
  redirect(routeWithQuery(ROUTES.editUser(userId), { erroSenha: error }));
}

function redirectWithPasswordResetSaved(userId: string): never {
  redirect(routeWithQuery(ROUTES.editUser(userId), { salvo: "senha-redefinida" }));
}

function userUpdateErrorPath(userId: string, error: UserActionError) {
  return error === "usuario-nao-encontrado" ? ROUTES.users : ROUTES.editUser(userId);
}

export async function createManagedUserAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!canManageUsers(user)) {
    redirectWithUserError(ROUTES.team, "permissao");
  }

  const parsed = parseUserFormData(formData, { requirePassword: true });
  if (!parsed.ok) {
    redirectWithUserError(ROUTES.newUser, parsed.error);
  }

  const result = await createManagedUserForChurch(user, parsed.values);
  if (!result.ok) {
    redirectWithUserError(ROUTES.newUser, result.error);
  }

  redirectWithUserSaved("usuario-criado");
}

export async function updateManagedUserAction(userId: string, formData: FormData) {
  const user = await getCurrentUser();
  const editPath = ROUTES.editUser(userId);

  if (!canManageUsers(user)) {
    redirectWithUserError(editPath, "permissao");
  }

  const parsed = parseUserFormData(formData, { requirePassword: false });
  if (!parsed.ok) {
    redirectWithUserError(editPath, parsed.error);
  }

  const result = await updateManagedUserForChurch(user, userId, parsed.values);
  if (!result.ok) {
    redirectWithUserError(userUpdateErrorPath(userId, result.error), result.error);
  }

  redirectWithUserSaved("usuario-atualizado");
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

  redirectWithPasswordResetSaved(userId);
}
