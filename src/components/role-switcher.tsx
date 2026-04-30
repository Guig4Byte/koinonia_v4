import type { UserRole } from "@/generated/prisma/client";

// Mantido temporariamente para evitar imports quebrados em branches antigas.
// A troca manual de perfis não faz mais parte da UI.
export function RoleSwitcher(_props: { currentRole: UserRole }) {
  return null;
}
