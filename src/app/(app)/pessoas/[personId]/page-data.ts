import { notFound } from "next/navigation";
import { CareKind, GroupResponsibilityRole, MembershipRole, UserRole } from "@/generated/prisma/client";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole, secondaryNavLabelForRole } from "@/features/navigation/app-nav";
import { careContactInfo } from "@/features/care/care-actions-view";
import { canRegisterCare, canViewGroup, canViewPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT, buildPersonPresenceView, careKindLabels } from "@/features/people/person-detail-view";
import { buildPersonCareOverviewView } from "@/features/people/person-care-overview";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusChipForViewer } from "@/features/signals/escalation";
import { signalBadgeForViewer, signalDescriptionForViewer, signalTitleForViewer } from "@/features/signals/display";
import { isUrgentOrPastoralCase, sortSignalsForPastoralViewer } from "@/features/signals/sections";
import { groupNameOrFallback, FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { activeGroupResponsibilitiesInclude } from "@/features/groups/group-query";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { isInCarePerson } from "@/features/people/person-status";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/routes";

const membershipRoleLabels: Record<MembershipRole, string> = {
  MEMBER: "Membro",
  VISITOR: "Visitante",
  HOST: "Anfitrião",
  LEADER: "Líder",
};

function membershipRoleLabel(role?: MembershipRole | null) {
  return role ? membershipRoleLabels[role] : "Irmão";
}

function personProfileEyebrow({
  openSignalsCount,
  isInCare,
}: {
  openSignalsCount: number;
  isInCare: boolean;
}) {
  if (openSignalsCount > 0) return "Irmão no radar";
  if (isInCare) return "Irmão em cuidado";
  return "Perfil pastoral";
}

export async function getPersonDetailPageData(personId: string) {
  const user = await getCurrentUser();

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      memberships: {
        where: { leftAt: null },
        include: { group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
      },
    },
  });

  if (!person || person.churchId !== user.churchId) notFound();
  if (!canViewPerson(user, person)) notFound();

  const visibleOpenSignalWhere = getVisibleOpenSignalWhere(user);
  const visibleEventWhere = getVisibleEventWhere(user);
  const visibleCareTouchWhere = getVisibleCareTouchWhere(user, person.id);
  const referenceDate = new Date();
  const recordedEventWhere = {
    ...visibleEventWhere,
    startsAt: { lte: referenceDate },
  };

  const [signals, attendances, careTouches] = await Promise.all([
    prisma.careSignal.findMany({
      where: { ...visibleOpenSignalWhere, personId: person.id },
      include: { assignedTo: true, group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    }),
    prisma.attendance.findMany({
      where: { personId: person.id, event: recordedEventWhere },
      include: { event: { include: { group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
      take: PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT,
    }),
    prisma.careTouch.findMany({
      where: visibleCareTouchWhere,
      include: { actor: true, group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
      orderBy: { happenedAt: "desc" },
    }),
  ]);

  const visibleMemberships = person.memberships.filter((membership) => canViewGroup(user, membership.group));
  const primaryMembership = visibleMemberships[0];
  const primaryGroup = primaryMembership?.group;
  const primaryLeadershipName = primaryGroup
    ? responsibilityNames(primaryGroup.responsibilities, GroupResponsibilityRole.LEADER, "")
    : "";
  const homeHref = homeHrefForRole(user.role);
  const openSignalsCount = signals.length;
  const hasCareTouch = careTouches.length > 0;
  const secondaryNavHref = secondaryNavHrefForRole(user.role);
  const secondaryNavLabel = secondaryNavLabelForRole(user.role);
  const isLeader = user.role === UserRole.LEADER;
  const backHref = isLeader ? secondaryNavHref : homeHref;
  const backLabel = isLeader ? secondaryNavLabel : "Visão";
  const personIsInCare = isInCarePerson(person);
  const canRegisterPersonCare = canRegisterCare(user, person);
  const canMarkActive = personIsInCare && canRegisterPersonCare && openSignalsCount === 0;
  const hasRiskSignal = signals.some(isUrgentOrPastoralCase);
  const navIndicator = hasRiskSignal ? "risk" : openSignalsCount > 0 ? "attention" : personIsInCare ? "care" : undefined;
  const pastoralOrderedSignals = sortSignalsForPastoralViewer(signals, user);
  const primarySignal = pastoralOrderedSignals[0];
  const personBadge = personEffectiveBadgeForViewer(person, primarySignal, user);
  const presenceView = buildPersonPresenceView(attendances);
  const profileEyebrow = personProfileEyebrow({ openSignalsCount, isInCare: personIsInCare });
  const primaryGroupName = groupNameOrFallback(primaryGroup);
  const primaryMembershipLabel = membershipRoleLabel(primaryMembership?.role);
  const personMeta = primaryGroup
    ? `${primaryMembershipLabel} · ${primaryGroupName}${primaryLeadershipName ? ` · ${primaryLeadershipName}` : ""}`
    : primaryMembershipLabel;
  const contactInfo = careContactInfo(person.phone);
  const careTouchHistoryItems = careTouches.map((touch) => ({
    id: touch.id,
    title: careKindLabels[touch.kind],
    actorName: touch.actor?.name ?? "Koinonia",
    happenedAtLabel: `${formatShortDate(touch.happenedAt)}, ${formatTime(touch.happenedAt)}`,
    contextLabel: touch.group?.name ?? null,
    note: touch.note,
  }));
  const careOverviewView = buildPersonCareOverviewView({
    openSignalsCount,
    hasRiskSignal,
    isInCare: personIsInCare,
    hasPhone: contactInfo.hasPhone,
    canRegisterCare: canRegisterPersonCare,
    primaryGroupName,
    primaryLeadershipName,
    assignedActorName: primarySignal?.assignedTo?.name,
  });
  const pastoralEscalationActorByGroupId = new Map<string, string>();
  let pastoralEscalationActorWithoutGroup: string | undefined;

  for (const touch of careTouches) {
    if (touch.kind !== CareKind.ESCALATED_TO_PASTOR) continue;

    const actorName = touch.actor?.name;
    if (!actorName) continue;

    if (touch.groupId) {
      if (!pastoralEscalationActorByGroupId.has(touch.groupId)) {
        pastoralEscalationActorByGroupId.set(touch.groupId, actorName);
      }
    } else if (!pastoralEscalationActorWithoutGroup) {
      pastoralEscalationActorWithoutGroup = actorName;
    }
  }

  const signalCards = pastoralOrderedSignals.map((signal) => {
    const pastoralEscalationActorName = signal.groupId
      ? pastoralEscalationActorByGroupId.get(signal.groupId)
      : pastoralEscalationActorWithoutGroup;
    const signalForDisplay = { ...signal, pastoralEscalationActorName };

    return {
      id: signal.id,
      priorityTone: signalBadgeForViewer(signalForDisplay, user).tone,
      title: signalTitleForViewer(signalForDisplay, user),
      meta: `${signal.group?.name ?? primaryGroupName} · ${formatShortDate(signal.detectedAt)}, ${formatTime(signal.detectedAt)}`,
      description: signalDescriptionForViewer(signalForDisplay, user, { useDetailedDescription: true }),
      assignmentMessage: escalationStatusChipForViewer(signalForDisplay, user),
      canRequestSupervisor: canRequestSupervisorSupport(user, signal),
      canEscalatePastor: canEscalateSignalToPastor(user, signal),
    };
  });

  const membershipCards = visibleMemberships.map((membership) => {
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

  return {
    user: {
      name: user.name,
      role: user.role,
    },
    shell: {
      nav: appNavForRole(user, { active: isLeader ? "secondary" : "none", indicator: navIndicator }),
      backHref,
      backLabel,
    },
    person: {
      id: person.id,
      fullName: person.fullName,
      phone: person.phone,
    },
    hero: {
      profileEyebrow,
      meta: personMeta,
      badge: personBadge,
    },
    care: {
      overview: careOverviewView,
      canMarkActive,
      hasCareTouch,
      historyItems: careTouchHistoryItems,
    },
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
