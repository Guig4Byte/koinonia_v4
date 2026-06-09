import type { UserRole } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/routes";

const roleHome: Record<UserRole, string> = {
  ADMIN: ROUTES.pastor,
  PASTOR: ROUTES.pastor,
  SUPERVISOR: ROUTES.supervisor,
  LEADER: ROUTES.leader,
};

export function homeForRole(role: UserRole) {
  return roleHome[role];
}
