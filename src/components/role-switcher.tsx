import type { UserRole } from "@/generated/prisma/client";

// Mantido apenas para evitar imports quebrados durante a transição.
// A navegação por perfis demo saiu da UI com a autenticação real.
export function RoleSwitcher(_props: { currentRole: UserRole }) {
  return null;
}
