import { GroupResponsibilityRole } from "../../generated/prisma/client";

export type LegacyGroupResponsibilitySource = {
  id: string;
  churchId: string;
  leaderUserId?: string | null;
  supervisorUserId?: string | null;
  responsibilities?: Array<{
    userId: string;
    role: GroupResponsibilityRole;
    activeUntil?: Date | null;
  }>;
};

export type GroupResponsibilityBackfillCandidate = {
  churchId: string;
  groupId: string;
  userId: string;
  role: GroupResponsibilityRole;
};

function hasActiveResponsibility(
  group: LegacyGroupResponsibilitySource,
  userId: string,
  role: GroupResponsibilityRole,
) {
  return (group.responsibilities ?? []).some(
    (responsibility) =>
      responsibility.userId === userId &&
      responsibility.role === role &&
      responsibility.activeUntil == null,
  );
}

function candidateKey(candidate: GroupResponsibilityBackfillCandidate) {
  return `${candidate.groupId}:${candidate.userId}:${candidate.role}`;
}

export function legacyResponsibilityCandidatesForGroup(
  group: LegacyGroupResponsibilitySource,
): GroupResponsibilityBackfillCandidate[] {
  const candidates: GroupResponsibilityBackfillCandidate[] = [];

  if (group.leaderUserId && !hasActiveResponsibility(group, group.leaderUserId, GroupResponsibilityRole.LEADER)) {
    candidates.push({
      churchId: group.churchId,
      groupId: group.id,
      userId: group.leaderUserId,
      role: GroupResponsibilityRole.LEADER,
    });
  }

  if (group.supervisorUserId && !hasActiveResponsibility(group, group.supervisorUserId, GroupResponsibilityRole.SUPERVISOR)) {
    candidates.push({
      churchId: group.churchId,
      groupId: group.id,
      userId: group.supervisorUserId,
      role: GroupResponsibilityRole.SUPERVISOR,
    });
  }

  return candidates;
}

export function buildLegacyResponsibilityBackfillCandidates(
  groups: LegacyGroupResponsibilitySource[],
): GroupResponsibilityBackfillCandidate[] {
  const seen = new Set<string>();
  const candidates: GroupResponsibilityBackfillCandidate[] = [];

  for (const group of groups) {
    for (const candidate of legacyResponsibilityCandidatesForGroup(group)) {
      const key = candidateKey(candidate);
      if (seen.has(key)) continue;

      seen.add(key);
      candidates.push(candidate);
    }
  }

  return candidates;
}
