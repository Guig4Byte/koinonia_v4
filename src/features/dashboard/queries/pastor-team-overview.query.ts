import { GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import {
  buildPastorTeamGroup,
  buildSupervisorTeam,
  comparePastoralPriorityThenName,
  mergeSupervisorTeamsBySharedGroups,
  compareSupervisorPriority,
  countGroupsWithoutPresence,
  countLowPresenceGroups,
  sumBy,
} from "@/features/dashboard/dashboard-view";
import { presenceHistoryEventWhere } from "@/features/events/presence-query";
import { activeGroupResponsibilityWhere } from "@/features/groups/group-query";
import { groupPastoralState } from "@/features/groups/group-pastoral-priority";
import { canUsePastorDashboard, type PermissionUser } from "@/features/permissions/permissions";
import { prisma } from "@/lib/prisma";
import { pastorTeamGroupInclude } from "@/features/dashboard/queries/pastor-dashboard.shared";

export async function getPastorTeamOverview(user: PermissionUser) {
  if (!canUsePastorDashboard(user)) {
    throw new Error("getPastorTeamOverview requires pastor or admin scope");
  }

  const churchId = user.churchId;
  const now = new Date();
  const presenceHistoryWhere = presenceHistoryEventWhere(now);

  const groupInclude = pastorTeamGroupInclude(presenceHistoryWhere);

  const [supervisors, groupsWithoutSupervisor] = await Promise.all([
    prisma.user.findMany({
      where: { churchId, role: UserRole.SUPERVISOR, isActive: true },
      include: {
        groupResponsibilities: {
          where: {
            churchId,
            ...activeGroupResponsibilityWhere(GroupResponsibilityRole.SUPERVISOR),
            group: { is: { churchId, isActive: true } },
          },
          include: {
            group: {
              include: groupInclude,
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.smallGroup.findMany({
      where: {
        churchId,
        isActive: true,
        responsibilities: { none: activeGroupResponsibilityWhere(GroupResponsibilityRole.SUPERVISOR) },
      },
      include: groupInclude,
      orderBy: { name: "asc" },
    }),
  ]);

  const toTeamGroup = buildPastorTeamGroup;

  const supervisorTeams = mergeSupervisorTeamsBySharedGroups(
    supervisors.map((supervisor) => buildSupervisorTeam({
      supervisor,
      groups: supervisor.groupResponsibilities.map((responsibility) => responsibility.group),
    })),
  ).sort(compareSupervisorPriority);
  const unassignedGroups = groupsWithoutSupervisor.map(toTeamGroup).sort(comparePastoralPriorityThenName);
  const allGroups = [...supervisorTeams.flatMap((supervisor) => supervisor.groups), ...unassignedGroups];
  const priorityGroups = allGroups.filter((group) => groupPastoralState(group).needsTeamAttention);

  return {
    supervisors: supervisorTeams,
    unassignedGroups,
    summary: {
      supervisorsCount: supervisors.length,
      groupsCount: allGroups.length,
      pastoralCasesCount: sumBy(allGroups, (group) => group.pastoralCasesCount),
      urgentCount: sumBy(allGroups, (group) => group.urgentCount),
      attentionCount: sumBy(allGroups, (group) => group.attentionCount),
      groupsNeedingAttentionCount: priorityGroups.length,
      groupsWithPastoralCasesCount: allGroups.filter((group) => group.pastoralCasesCount > 0).length,
      groupsWithoutPresenceCount: countGroupsWithoutPresence(allGroups),
      lowPresenceGroupsCount: countLowPresenceGroups(allGroups),
      groupsWithoutSupervisorCount: unassignedGroups.length,
    },
  };
}
