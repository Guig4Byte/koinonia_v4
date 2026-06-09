import { GroupResponsibilityRole } from "@/generated/prisma/client";
import { FALLBACK_LEADER_NAME, FALLBACK_SUPERVISOR_NAME } from "@/features/groups/group-display";

type ResponsibilityDisplayItem = {
  role: GroupResponsibilityRole;
  user: { name: string };
};

export const responsibilityFallbackNames: Record<GroupResponsibilityRole, string> = {
  LEADER: FALLBACK_LEADER_NAME,
  SUPERVISOR: FALLBACK_SUPERVISOR_NAME,
};

export function responsibilityNames(
  responsibilities: ResponsibilityDisplayItem[],
  role: GroupResponsibilityRole,
  fallback = responsibilityFallbackNames[role],
) {
  const names = responsibilities
    .filter((responsibility) => responsibility.role === role)
    .map((responsibility) => responsibility.user.name);

  return names.length > 0 ? names.join(" e ") : fallback;
}
