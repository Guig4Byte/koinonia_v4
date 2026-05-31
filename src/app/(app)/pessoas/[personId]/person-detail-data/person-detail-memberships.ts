import { GroupResponsibilityRole } from "@/generated/prisma/client";
import { FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { ROUTES } from "@/lib/routes";
import { membershipRoleLabel } from "./person-detail-labels";
import type { loadPersonDetailContext } from "./person-detail.loader";

type VisibleMemberships = Awaited<ReturnType<typeof loadPersonDetailContext>>["visibleMemberships"];

export function buildPersonDetailMembershipCards(visibleMemberships: VisibleMemberships) {
  return visibleMemberships.map((membership) => {
    const group = membership.group;
    const leadershipName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, "");
    const supervisionName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.SUPERVISOR, "");

    return {
      id: membership.id,
      href: ROUTES.group(group.id),
      name: group.name,
      meta: `${membershipRoleLabel(membership.role)} · Liderança: ${leadershipName || FALLBACK_LEADER_NAME}${supervisionName ? ` · Supervisão: ${supervisionName}` : ""}`,
    };
  });
}
