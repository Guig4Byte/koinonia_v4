import { hash } from "bcryptjs";
import type { Prisma, UserRole } from "@/generated/prisma/client";
import type { PermissionUser } from "@/features/permissions/permissions";
import { prisma } from "@/lib/prisma";
import type { UserFormValues } from "@/features/users/user-form";

export type ManageUserResult =
  | { ok: true; userId: string }
  | { ok: false; error: "email-em-uso" | "pessoa-indisponivel" | "usuario-nao-encontrado" };

type PersistUserValues = Omit<UserFormValues, "password"> & {
  password?: string;
};

function userData(values: PersistUserValues): Prisma.UserUpdateInput {
  return {
    name: values.name,
    email: values.email,
    role: values.role,
    isActive: values.isActive,
    person: values.personId ? { connect: { id: values.personId } } : { disconnect: true },
  };
}

async function emailBelongsToAnotherUser(email: string, currentUserId?: string) {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return Boolean(existing && existing.id !== currentUserId);
}

async function personBelongsToAnotherUser(churchId: string, personId: string | null, currentUserId?: string) {
  if (!personId) return false;

  const person = await prisma.person.findFirst({
    where: { id: personId, churchId },
    select: { user: { select: { id: true } } },
  });

  if (!person) return true;
  return Boolean(person.user && person.user.id !== currentUserId);
}

export async function createManagedUserForChurch(user: PermissionUser, values: UserFormValues): Promise<ManageUserResult> {
  if (await emailBelongsToAnotherUser(values.email)) {
    return { ok: false, error: "email-em-uso" };
  }

  if (await personBelongsToAnotherUser(user.churchId, values.personId)) {
    return { ok: false, error: "pessoa-indisponivel" };
  }

  const passwordHash = await hash(values.password ?? "", 10);
  const created = await prisma.user.create({
    data: {
      churchId: user.churchId,
      name: values.name,
      email: values.email,
      role: values.role,
      isActive: values.isActive,
      passwordHash,
      ...(values.personId ? { personId: values.personId } : {}),
    },
    select: { id: true },
  });

  return { ok: true, userId: created.id };
}

export async function updateManagedUserForChurch(
  user: PermissionUser,
  userId: string,
  values: PersistUserValues,
): Promise<ManageUserResult> {
  const current = await prisma.user.findFirst({
    where: { id: userId, churchId: user.churchId },
    select: { id: true, role: true, isActive: true },
  });

  if (!current) return { ok: false, error: "usuario-nao-encontrado" };

  if (await emailBelongsToAnotherUser(values.email, current.id)) {
    return { ok: false, error: "email-em-uso" };
  }

  if (await personBelongsToAnotherUser(user.churchId, values.personId, current.id)) {
    return { ok: false, error: "pessoa-indisponivel" };
  }

  const safeValues = current.id === user.id
    ? { ...values, role: current.role as UserRole, isActive: true }
    : values;

  await prisma.user.update({
    where: { id: current.id },
    data: userData(safeValues),
    select: { id: true },
  });

  return { ok: true, userId: current.id };
}
