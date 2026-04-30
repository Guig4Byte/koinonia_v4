"use server";

import { redirect } from "next/navigation";
import { createAuthSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/redirects";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function safeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login")) return null;
  if (value.startsWith("/logout")) return null;
  return value;
}

function loginErrorRedirect(nextPath: string | null): never {
  const suffix = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";
  redirect(`/login?erro=credenciais${suffix}`);
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const nextPath = safeNextPath(formData.get("next"));

  if (!email || !password) {
    loginErrorRedirect(nextPath);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      churchId: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    loginErrorRedirect(nextPath);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    loginErrorRedirect(nextPath);
  }

  await createAuthSession({
    id: user.id,
    role: user.role,
    churchId: user.churchId,
  });

  redirect(nextPath ?? homeForRole(user.role));
}
