import type { UserRole } from "@/generated/prisma/client";
import type { BadgeTone } from "@/components/ui/badge";

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  PASTOR: "Pastor",
  SUPERVISOR: "Supervisor",
  LEADER: "Líder",
};

export const userRolePluralLabels: Record<UserRole, string> = {
  ADMIN: "admins",
  PASTOR: "pastores",
  SUPERVISOR: "supervisores",
  LEADER: "líderes",
};

export const userRoleDescriptions: Record<UserRole, string> = {
  ADMIN: "Acesso administrativo e pastoral completo.",
  PASTOR: "Acompanha a visão pastoral e casos encaminhados.",
  SUPERVISOR: "Acompanha células supervisionadas e pedidos de apoio.",
  LEADER: "Registra encontros, presença e cuidado da célula.",
};

export const userRoleBadgeTone: Record<UserRole, BadgeTone> = {
  ADMIN: "care",
  PASTOR: "care",
  SUPERVISOR: "support",
  LEADER: "info",
};

export function userStatusLabel(isActive: boolean) {
  return isActive ? "Ativo" : "Inativo";
}

export function userStatusTone(isActive: boolean): BadgeTone {
  return isActive ? "ok" : "neutral";
}
