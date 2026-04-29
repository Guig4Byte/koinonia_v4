import { UserRole } from "@/generated/prisma/client";

export const roleHome: Record<UserRole, string> = {
  ADMIN: "/pastor",
  PASTOR: "/pastor",
  SUPERVISOR: "/supervisor",
  LEADER: "/lider",
};

const userRoleValues = new Set<string>(Object.values(UserRole));

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoleValues.has(value);
}
