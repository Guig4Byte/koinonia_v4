import { GroupResponsibilityRole } from "@/generated/prisma/client";
import { groupNameOrFallback } from "@/features/groups/group-display";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { buildPersonPresenceView } from "@/features/people/person-detail-view";
import { isInCarePerson } from "@/features/people/person-status";
import { isUrgentOrPastoralCase, sortSignalsForPastoralViewer } from "@/features/signals/sections";
import { buildPersonDetailCareSection, buildPastoralEscalationActorLookup } from "./person-detail-care";
import { personProfileEyebrow, membershipRoleLabel } from "./person-detail-labels";
import { buildPersonDetailMembershipCards } from "./person-detail-memberships";
import { buildPersonDetailShell } from "./person-detail-navigation";
import { buildPersonDetailSignalCards } from "./person-detail-signals";
import type { loadPersonDetailContext } from "./person-detail.loader";

export function buildPersonDetailPageData(context: Awaited<ReturnType<typeof loadPersonDetailContext>>) {
  const { user, person, signals, attendances, careTouches, visibleMemberships } = context;
  const primaryMembership = visibleMemberships[0];
  const primaryGroup = primaryMembership?.group;
  const primaryLeadershipName = primaryGroup
    ? responsibilityNames(primaryGroup.responsibilities, GroupResponsibilityRole.LEADER, "")
    : "";
  const openSignalsCount = signals.length;
  const personIsInCare = isInCarePerson(person);
  const hasRiskSignal = signals.some(isUrgentOrPastoralCase);
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
    },
    hero: {
      profileEyebrow,
      meta: personMeta,
      badge: personBadge,
    },
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
