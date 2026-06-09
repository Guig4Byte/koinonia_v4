import { GroupResponsibilityRole } from "@/generated/prisma/client";
import { FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { compareByName, normalizeSearchText } from "@/lib/text";
import { countLabel } from "@/lib/format";
import type { GroupSectionKey, SupervisorGroup } from "@/features/groups/cells-page-view/cells-page-view.types";
import { groupPastoralPriorityScore } from "@/features/groups/group-pastoral-priority";

export function groupSearchText(group: SupervisorGroup) {
  const leadership = responsibilityNames(
    group.responsibilities,
    GroupResponsibilityRole.LEADER,
    "",
  );

  return normalizeSearchText(`${group.name} ${leadership}`);
}

export function groupLeadershipName(group: SupervisorGroup) {
  return responsibilityNames(
    group.responsibilities,
    GroupResponsibilityRole.LEADER,
    FALLBACK_LEADER_NAME,
  );
}

export function groupSubtitle(group: SupervisorGroup) {
  const membersLabel = countLabel(group.memberships.length, "membro", "membros");
  return `${groupLeadershipName(group)} · ${membersLabel}`;
}

export function compareGroups(left: SupervisorGroup, right: SupervisorGroup) {
  const scoreDifference = groupPastoralPriorityScore(right) - groupPastoralPriorityScore(left);
  if (scoreDifference !== 0) return scoreDifference;

  return compareByName(left, right);
}

export function sectionCardTone(sectionKey: GroupSectionKey) {
  if (sectionKey === "presence") return "muted";
  if (sectionKey === "stable") return "stable";
  return undefined;
}
