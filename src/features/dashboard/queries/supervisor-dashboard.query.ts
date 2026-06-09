import type { PermissionUser } from "@/features/permissions/permissions";
import { getGroupScopedDashboard } from "@/features/dashboard/queries/group-scoped-dashboard.query";

export function getSupervisorDashboard(user: PermissionUser) {
  return getGroupScopedDashboard(user);
}
