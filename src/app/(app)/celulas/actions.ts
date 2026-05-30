"use server";

import { redirect } from "next/navigation";
import { createCellForUser, updateCellForUser } from "@/app/(app)/celulas/actions.commands";
import { canManageGroups } from "@/features/permissions/permissions";
import { parseGroupFormData, type GroupFormError } from "@/features/groups/group-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES, routeWithQuery } from "@/lib/routes";

function redirectWithError(path: string, error: GroupFormError | "permissao" | "nao-encontrada"): never {
  redirect(routeWithQuery(path, { erro: error }));
}

export async function createCellAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!canManageGroups(user)) {
    redirectWithError(ROUTES.team, "permissao");
  }

  const parsed = parseGroupFormData(formData);
  if (!parsed.ok) {
    redirectWithError(ROUTES.newCell, parsed.error);
  }

  const group = await createCellForUser(user, parsed.values);

  redirect(routeWithQuery(group.isActive ? ROUTES.group(group.id) : ROUTES.team, { salvo: "celula-criada" }));
}

export async function updateCellAction(groupId: string, formData: FormData) {
  const user = await getCurrentUser();

  if (!canManageGroups(user)) {
    redirectWithError(ROUTES.editGroup(groupId), "permissao");
  }

  const parsed = parseGroupFormData(formData);
  if (!parsed.ok) {
    redirectWithError(ROUTES.editGroup(groupId), parsed.error);
  }

  const group = await updateCellForUser(user, groupId, parsed.values);
  if (!group) {
    redirectWithError(ROUTES.team, "nao-encontrada");
  }

  redirect(routeWithQuery(group.isActive ? ROUTES.group(group.id) : ROUTES.team, { salvo: "celula-atualizada" }));
}
