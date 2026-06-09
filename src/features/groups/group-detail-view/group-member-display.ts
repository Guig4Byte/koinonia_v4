import { PersonStatus } from "@/generated/prisma/client";
import { memberCardTone } from "@/features/people/member-filters";
import { isActiveStatus, isInCarePerson, isInCareStatus } from "@/features/people/person-status";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { signalTitleForViewer } from "@/features/signals/display";
import { isSupportRequest, isUrgentOrPastoralCase } from "@/features/signals/sections";
import { compareByName } from "@/lib/text";
import { groupMemberFocusKeys } from "@/features/groups/group-detail-view/group-detail-focus";
import {
  type GroupDetailMembership,
  type GroupDetailSignal,
  type GroupDetailViewer,
  type MemberDisplay,
} from "@/features/groups/group-detail-view/group-detail-view.types";

export function groupMemberPriorityRank(signal: GroupDetailSignal | undefined, personStatus: PersonStatus, viewer: GroupDetailViewer) {
  if (isInCareStatus(personStatus)) return 4;
  if (signal && isUrgentOrPastoralCase(signal)) return 1;
  if (signal && isSupportRequest(signal, viewer)) return 2;
  if (signal) return 3;
  if (isActiveStatus(personStatus)) return 5;
  return 6;
}

export function buildGroupMemberDisplays({
  memberships,
  attentionSignalsByPersonId,
  viewer,
}: {
  memberships: GroupDetailMembership[];
  attentionSignalsByPersonId: ReadonlyMap<string, GroupDetailSignal>;
  viewer: GroupDetailViewer;
}): MemberDisplay[] {
  return memberships
    .map((membership): MemberDisplay => {
      const isInCare = isInCarePerson(membership.person);
      const attentionSignal = isInCare ? undefined : attentionSignalsByPersonId.get(membership.personId);
      const memberBadge = personEffectiveBadgeForViewer(membership.person, attentionSignal, viewer);
      const escalationSubtitle = attentionSignal ? escalationStatusDetailForViewer(attentionSignal, viewer) : null;
      const signalSubtitle = attentionSignal ? escalationSubtitle ?? signalTitleForViewer(attentionSignal, viewer) : undefined;
      const subtitle = signalSubtitle ?? (isInCare ? "Em cuidado" : undefined);

      return {
        membershipId: membership.id,
        personId: membership.personId,
        name: membership.person.fullName,
        subtitle,
        badgeLabel: memberBadge.label,
        badgeTone: memberBadge.tone,
        careBadgeLabel: isInCare ? "Em cuidado" : undefined,
        careBadgeTone: isInCare ? "care" : undefined,
        cardTone: memberCardTone(memberBadge.tone),
        priorityRank: groupMemberPriorityRank(attentionSignal, membership.person.status, viewer),
        status: membership.person.status,
        focusKeys: groupMemberFocusKeys(attentionSignal, membership.person.status, viewer),
      };
    })
    .sort(compareGroupMembers);
}

export function memberBadgeLabelForCareContext(member: MemberDisplay) {
  return member.careBadgeLabel ?? member.badgeLabel;
}

export function memberBadgeToneForCareContext(member: MemberDisplay) {
  return member.careBadgeTone ?? member.badgeTone;
}

export function compareGroupMembers(left: MemberDisplay, right: MemberDisplay) {
  const priorityDifference = left.priorityRank - right.priorityRank;
  if (priorityDifference !== 0) return priorityDifference;
  return compareByName(left, right);
}
