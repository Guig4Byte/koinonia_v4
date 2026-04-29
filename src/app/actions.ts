"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isUserRole, roleHome } from "@/lib/roles";

export async function switchDemoRole(formData: FormData) {
  const role = formData.get("role");

  if (!isUserRole(role)) {
    throw new Error("Perfil inválido");
  }

  const cookieStore = await cookies();
  cookieStore.set("koinonia-demo-role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(roleHome[role]);
}
