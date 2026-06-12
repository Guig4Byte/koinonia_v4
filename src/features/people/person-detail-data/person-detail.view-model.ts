import { GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import { groupNameOrFallback } from "@/features/groups/group-display";
import { personDisplayContext, personGroupCountLabel, personLeadershipContext, personLeadershipDisplayBadge } from "@/features/people/person-display-context";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { personBirthdayInputValue } from "@/features/people/person-birthday";
import { buildPersonPresenceView } from "@/features/people/person-detail-view";
import { isInCarePerson } from "@/features/people/person-status";
import { canViewGroup } from "@/features/permissions/permissions";
import { isUrgentOrPastoralCase, sortSignalsForPastoralViewer } from "@/features/signals/sections";
import { ROUTES } from "@/lib/routes";
import { buildPersonDetailCareSection, buildPastoralEscalationActorLookup } from "./person-detail-care";
import { personProfileEyebrow, membershipRoleLabel } from "./person-detail-labels";
import { buildPersonDetailMembershipCards } from "./person-detail-memberships";
import { buildPersonDetailShell } from "./person-detail-navigation";
import { buildPersonDetailSignalCards } from "./person-detail-signals";
import type { PersonDetailContext } from "./person-detail.loader";

type PersonDetailGroupResponsibility = NonNullable<PersonDetailContext["person"]["user"]>["groupResponsibilities"][number];
type PersonDetailResponsibilityGroup = PersonDetailGroupResponsibility["group"];

type LeadershipGroupCard = {
  id: string;
  name: string;
  href: string;
  metaLines: string[];
};

type PersonLeadershipProfile = {
  roleLabel: string;
  detail: string;
  groupsTitle?: string;
  groups: LeadershipGroupCard[];
  hiddenGroupsCount: number;
};

const LEADERSHIP_GROUP_VISIBLE_LIMIT = 3;

function compactParts(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part?.trim()));
}

function sortGroupsByName(groups: PersonDetailResponsibilityGroup[]) {
  return [...groups].sort((current, next) => current.name.localeCompare(next.name, "pt-BR", { sensitivity: "base" }));
}

function groupsForResponsibility(
  responsibilities: PersonDetailGroupResponsibility[],
  role: GroupResponsibilityRole,
) {
  return sortGroupsByName(
    responsibilities
      .filter((responsibility) => responsibility.role === role)
      .map((responsibility) => responsibility.group),
  );
}

function groupResponsibilityNames(group: PersonDetailResponsibilityGroup, role: GroupResponsibilityRole) {
  return (group.responsibilities ?? [])
    .filter((responsibility) => responsibility.role === role)
    .map((responsibility) => responsibility.user?.name?.trim())
    .filter((name): name is string => Boolean(name));
}

function leadershipGroupCard(group: PersonDetailResponsibilityGroup): LeadershipGroupCard {
  const leaderNames = groupResponsibilityNames(group, GroupResponsibilityRole.LEADER);
  const supervisorNames = groupResponsibilityNames(group, GroupResponsibilityRole.SUPERVISOR);

  return {
    id: group.id,
    name: group.name,
    href: ROUTES.group(group.id),
    metaLines: compactParts([
      leaderNames.length > 0 ? `Liderança: ${leaderNames.join(", ")}` : null,
      supervisorNames.length > 0 ? `Supervisão: ${supervisorNames.join(", ")}` : null,
    ]),
  };
}

function leaderGroupDetail(groups: PersonDetailResponsibilityGroup[]) {
  if (groups.length === 0) return "Ainda sem célula liderada.";
  if (groups.length === 1) return `Lidera ${groups[0]?.name}.`;

  return `Lidera ${personGroupCountLabel(groups.length)}.`;
}

function supervisorGroupDetail(groups: PersonDetailResponsibilityGroup[]) {
  if (groups.length === 0) return "Ainda sem célula acompanhada.";

  return `Acompanha ${personGroupCountLabel(groups.length)}.`;
}

function buildLeadershipProfile({
  role,
  ledGroups,
  supervisedGroups,
}: {
  role?: UserRole | null;
  ledGroups: PersonDetailResponsibilityGroup[];
  supervisedGroups: PersonDetailResponsibilityGroup[];
}): PersonLeadershipProfile | null {
  const leadershipContext = personLeadershipContext({
    systemRole: role,
    ledGroups,
    supervisedGroups,
  });

  if (!leadershipContext) return null;

  if (leadershipContext.kind === "pastor" || leadershipContext.kind === "admin") {
    return {
      roleLabel: leadershipContext.label,
      detail: leadershipContext.kind === "pastor"
        ? "Acompanha a igreja e suas células."
        : "Acesso administrativo e pastoral completo.",
      groups: [],
      hiddenGroupsCount: 0,
    };
  }

  if (leadershipContext.kind === "supervisor") {
    const visibleGroups = supervisedGroups.slice(0, LEADERSHIP_GROUP_VISIBLE_LIMIT);

    return {
      roleLabel: leadershipContext.label,
      detail: supervisorGroupDetail(supervisedGroups),
      groupsTitle: "Células acompanhadas",
      groups: visibleGroups.map(leadershipGroupCard),
      hiddenGroupsCount: Math.max(supervisedGroups.length - visibleGroups.length, 0),
    };
  }

  if (leadershipContext.kind === "leader") {
    const visibleGroups = ledGroups.slice(0, LEADERSHIP_GROUP_VISIBLE_LIMIT);

    return {
      roleLabel: leadershipContext.label,
      detail: leaderGroupDetail(ledGroups),
      groupsTitle: ledGroups.length > 1 ? "Células lideradas" : "Célula liderada",
      groups: visibleGroups.map(leadershipGroupCard),
      hiddenGroupsCount: Math.max(ledGroups.length - visibleGroups.length, 0),
    };
  }

  return null;
}

export function buildPersonDetailPageData(context: PersonDetailContext) {
  const { user, person, signals, attendances, careTouches, visibleMemberships } = context;
  const primaryMembership = visibleMemberships[0];
  const primaryGroup = primaryMembership?.group;
  const openSignalsCount = signals.length;
  const personIsInCare = isInCarePerson(person);
  const hasRiskSignal = signals.some(isUrgentOrPastoralCase);
  const pastoralOrderedSignals = sortSignalsForPastoralViewer(signals, user);
  const primarySignal = pastoralOrderedSignals[0];
  const personUser = person.user;
  const personResponsibilities = personUser?.groupResponsibilities ?? [];
  const ledGroups = groupsForResponsibility(personResponsibilities, GroupResponsibilityRole.LEADER);
  const supervisedGroups = groupsForResponsibility(personResponsibilities, GroupResponsibilityRole.SUPERVISOR);
  const visibleLedGroups = ledGroups.filter((group) => canViewGroup(user, group));
  const visibleSupervisedGroups = supervisedGroups.filter((group) => canViewGroup(user, group));
  const leadershipProfile = buildLeadershipProfile({
    role: personUser?.role,
    ledGroups: visibleLedGroups,
    supervisedGroups: visibleSupervisedGroups,
  });
  const hasPersonalPastoralContext = visibleMemberships.length > 0
    || attendances.length > 0
    || careTouches.length > 0
    || signals.length > 0;
  const showPersonalPastoralSections = !leadershipProfile || hasPersonalPastoralContext;
  const leadershipBadge = leadershipProfile
    ? personLeadershipDisplayBadge({
        systemRole: personUser?.role,
        ledGroups: visibleLedGroups,
        supervisedGroups: visibleSupervisedGroups,
        hasSystemAccess: Boolean(personUser),
      })
    : null;
  const personBadge = leadershipBadge ?? personEffectiveBadgeForViewer(person, primarySignal, user);
  const presenceView = buildPersonPresenceView(attendances);
  const profileEyebrow = leadershipProfile
    ? "Perfil de liderança"
    : personProfileEyebrow({ openSignalsCount, isInCare: personIsInCare });
  const primaryGroupName = groupNameOrFallback(primaryGroup);
  const primaryMembershipLabel = membershipRoleLabel(primaryMembership?.role);
  const leadershipDisplayLine = leadershipProfile
    ? personDisplayContext({
        systemRole: personUser?.role,
        primaryGroup,
        primaryMembershipRole: primaryMembership?.role,
        ledGroups: visibleLedGroups,
        supervisedGroups: visibleSupervisedGroups,
        hasSystemAccess: Boolean(personUser),
      })
    : null;
  const personMetaLines = leadershipDisplayLine
    ? [leadershipDisplayLine]
    : primaryGroup
      ? [primaryMembershipLabel, primaryGroupName]
      : [primaryMembershipLabel];
  const pastoralEscalationActorLookup = buildPastoralEscalationActorLookup(careTouches);
  const careSection = buildPersonDetailCareSection({
    user,
    person,
    careTouches,
    openSignalsCount,
    hasRiskSignal,
    isInCare: personIsInCare,
    primaryGroup,
    primaryGroupName,
    primarySignal,
  });
  const signalCards = buildPersonDetailSignalCards({
    signals: pastoralOrderedSignals,
    user,
    primaryGroupName,
    pastoralEscalationActorLookup,
  });
  const membershipCards = buildPersonDetailMembershipCards(visibleMemberships);

  return {
    user: {
      name: user.name,
      role: user.role,
    },
    shell: buildPersonDetailShell({
      user,
      primaryGroupId: primaryGroup?.id,
      openSignalsCount,
      isInCare: personIsInCare,
      hasRiskSignal,
    }),
    person: {
      id: person.id,
      fullName: person.fullName,
      phone: person.phone,
      birthDate: personBirthdayInputValue(person.birthDate),
    },
    profile: {
      showPersonalPastoralSections,
      personalSectionTitle: leadershipProfile && hasPersonalPastoralContext ? "Como irmão" : null,
      personalSectionDetail: leadershipProfile && hasPersonalPastoralContext
        ? "Dados pessoais de cuidado, sem repetir a visão do escopo de liderança."
        : null,
    },
    hero: {
      profileEyebrow,
      metaLines: personMetaLines,
      badge: personBadge,
      badgeKind: leadershipBadge ? "leadership" : "pastoral",
    },
    leadership: leadershipProfile,
    care: careSection,
    signals: {
      openCount: openSignalsCount,
      sectionTitle: openSignalsCount > 0 ? "Motivo da atenção" : "Situação atual",
      sectionDetail: openSignalsCount > 0 ? "O contexto ajuda antes de decidir o cuidado." : undefined,
      cards: signalCards,
    },
    presence: {
      view: presenceView,
    },
    memberships: {
      sectionTitle: visibleMemberships.length > 1 ? "Contexto das células" : "Contexto da célula",
      cards: membershipCards,
    },
  };
}
