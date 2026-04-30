import type { UserRole } from "@/generated/prisma/client";

const roleHome: Record<UserRole, string> = {
  ADMIN: "/pastor",
  PASTOR: "/pastor",
  SUPERVISOR: "/supervisor",
  LEADER: "/lider",
};

export function homeForRole(role: UserRole) {
  return roleHome[role];
}
