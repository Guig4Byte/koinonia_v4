import { PersonStatus, UserRole } from "@/generated/prisma/client";
import { weekdayLabel } from "@/features/groups/weekdays";
import { type BadgeTone } from "@/components/ui/badge";
import { memberCardTone, memberMatchesFilter, type MembersFilter } from "@/features/people/member-filters";
import { isActiveStatus, isInCarePerson, isInCareStatus } from "@/features/people/person-status";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { signalTitleForViewer, type SignalBadgeTone, type SignalDetailLike, type SignalDisplayViewerLike } from "@/features/signals/display";
import { isSupportRequest, isUrgentOrPastoralCase, type SectionSignalWithIdentity } from "@/features/signals/sections";
import { isPastoralCaseSignal, isUrgentSignal } from "@/features/groups/group-pastoral-priority";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";
import { countLabel } from "@/lib/format";
import {
  FILTER_ACTIVE,
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_STABLE,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";
import { compareByName } from "@/lib/text";

export const GROUP_MEMBER_SIGNAL_MAX_PRIORITY = 3;
export const GROUP_MEMBER_IN_CARE_PRIORITY = 4;
export const GROUP_REGULAR_MEMBER_INITIAL_COUNT = 5;
export const GROUP_REGULAR_MEMBER_STEP = 5;
export const GROUP_DETAIL_EVENT_HISTORY_LIMIT = 12;

export type GroupDetailFocus =
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_SUPPORT
  | typeof FILTER_ATTENTION
  | typeof FILTER_IN_CARE
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_LOW_PRESENCE
  | typeof FILTER_STABLE;

const GROUP_DETAIL_FOCUS_VALUES: ReadonlyArray<GroupDetailFocus> = [
  FILTER_URGENT,
  FILTER_PASTORAL,
  FILTER_SUPPORT,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_LOW_PRESENCE,
  FILTER_STABLE,
];

export type GroupDetailFocusCardData = {
  title: string;
  detail: string;
  tone: "default" | "success" | "error" | "warning";
};

export function readGroupDetailFocus(value: string | null | undefined): GroupDetailFocus | null {
  return GROUP_DETAIL_FOCUS_VALUES.some((focus) => focus === value) ? value as GroupDetailFocus : null;
}

export type GroupDetailViewer = SignalDisplayViewerLike & {
  id: string;
  role: UserRole;
};

export type GroupDetailSignal = SectionSignalWithIdentity & SignalDetailLike;

export type GroupDetailMembership = {
  id: string;
  personId: string;
  person: {
    fullName: string;
    status: PersonStatus;
  };
};

export type MemberDisplay = {
  membershipId: string;
  personId: string;
  name: string;
  subtitle?: string;
  badgeLabel: string;
  badgeTone: BadgeTone;
  careBadgeLabel?: string;
  careBadgeTone?: BadgeTone;
  cardTone?: SignalBadgeTone | "stable" | "muted";
  priorityRank: number;
  status: PersonStatus;
  focusKeys: GroupDetailFocus[];
};

export type GroupMembersView = {
  members: MemberDisplay[];
  visibleMembers: MemberDisplay[];
  priorityMembers: MemberDisplay[];
  inCareMembers: MemberDisplay[];
  regularMembers: MemberDisplay[];
  filterCounts: Partial<Record<MembersFilter, number>>;
  sectionDetail: string;
  focusedMembersCount: number;
};

export function groupMeetingText(day?: number | null, time?: string | null) {
  if (day === null || day === undefined) return time ? `Horário: ${time}` : "Encontro sem horário fixo informado.";
  return `${weekdayLabel(day)}${time ? ` · ${time}` : ""}`;
}

export function groupPastoralPulse({
  role,
  urgentOrPastoralCount,
  supportCount,
  localAttentionCount,
  inCareCount,
  hasRecentPresence,
  presenceRate,
  hasPendingEvent,
}: {
  role: UserRole;
  urgentOrPastoralCount: number;
  supportCount: number;
  localAttentionCount: number;
  inCareCount: number;
  hasRecentPresence: boolean;
  presenceRate: number;
  hasPendingEvent: boolean;
}): PastoralPulseMessage {
  return buildPastoralPulseMessage({
    viewerRole: role,
    scope: "groupDetail",
    counts: {
      urgentOrPastoral: urgentOrPastoralCount,
      support: supportCount,
      attention: localAttentionCount,
      inCare: inCareCount,
      hasRecentPresence,
      presenceRate,
      hasPendingEvent,
    },
  });
}

export function groupMemberFocusKeys(
  signal: GroupDetailSignal | undefined,
  personStatus: PersonStatus,
  viewer: GroupDetailViewer,
): GroupDetailFocus[] {
  const focusKeys: GroupDetailFocus[] = [];

  if (signal) {
    if (isUrgentSignal(signal)) focusKeys.push(FILTER_URGENT);
    else if (isPastoralCaseSignal(signal)) focusKeys.push(FILTER_PASTORAL);
    else if (isSupportRequest(signal, viewer)) focusKeys.push(FILTER_SUPPORT);
    else focusKeys.push(FILTER_ATTENTION);
  }

  if (isInCareStatus(personStatus)) focusKeys.push(FILTER_IN_CARE);

  return focusKeys;
}

export function groupMemberMatchesFocus(member: Pick<MemberDisplay, "focusKeys">, focus: GroupDetailFocus) {
  return member.focusKeys.includes(focus);
}

export function groupDetailFocusCard(
  focus: GroupDetailFocus | null,
  focusedMembersCount: number,
): GroupDetailFocusCardData | null {
  if (!focus) return null;

  const peopleDetail = focusedMembersCount > 0
    ? `${countLabel(focusedMembersCount, "irmão neste recorte", "irmãos neste recorte")}.`
    : "Os detalhes abaixo ajudam a entender o contexto da célula.";

  if (focus === FILTER_URGENT) {
    return {
      title: "Urgente nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} Sinais que pedem atenção imediata.` : "Sinais que pedem atenção imediata.",
      tone: "error",
    };
  }

  if (focus === FILTER_PASTORAL) {
    return {
      title: "Cuidado pastoral nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} Casos trazidos para cuidado pastoral.` : "Casos trazidos para cuidado pastoral.",
      tone: "warning",
    };
  }

  if (focus === FILTER_SUPPORT) {
    return {
      title: "Pedido de apoio nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} Pedidos enviados à supervisão.` : "Pedidos enviados à supervisão.",
      tone: "default",
    };
  }

  if (focus === FILTER_ATTENTION) {
    return {
      title: "Em atenção nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} O contexto local merece uma leitura com calma.` : "O contexto local merece uma leitura com calma.",
      tone: "warning",
    };
  }

  if (focus === FILTER_IN_CARE) {
    return {
      title: "Em cuidado nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} Acompanhamentos em andamento para manter no radar.` : "Acompanhamentos em andamento para manter no radar.",
      tone: "default",
    };
  }

  if (focus === FILTER_NO_RECENT_PRESENCE) {
    return {
      title: "Retomar contato",
      detail: "Ainda não há presença recente registrada para esta célula.",
      tone: "default",
    };
  }

  if (focus === FILTER_LOW_PRESENCE) {
    return {
      title: "Presença baixa nesta célula",
      detail: "A média recente está abaixo do esperado. Vale ler o contexto antes de agir.",
      tone: "warning",
    };
  }

  return {
    title: "Célula estável",
    detail: "Sem sinal prioritário neste recorte.",
    tone: "success",
  };
}

export function groupMemberPriorityRank(signal: GroupDetailSignal | undefined, personStatus: PersonStatus, viewer: GroupDetailViewer) {
  if (signal && isUrgentOrPastoralCase(signal)) return 1;
  if (signal && isSupportRequest(signal, viewer)) return 2;
  if (signal) return 3;
  if (isInCareStatus(personStatus)) return 4;
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
      const attentionSignal = attentionSignalsByPersonId.get(membership.personId);
      const isInCare = isInCarePerson(membership.person);
      const memberBadge = personEffectiveBadgeForViewer(membership.person, attentionSignal, viewer);
      const escalationSubtitle = attentionSignal ? escalationStatusDetailForViewer(attentionSignal, viewer) : null;
      const signalSubtitle = attentionSignal ? escalationSubtitle ?? signalTitleForViewer(attentionSignal, viewer) : undefined;
      const subtitle = signalSubtitle
        ? isInCare ? `${signalSubtitle} · Em cuidado` : signalSubtitle
        : isInCare ? "Em cuidado" : undefined;

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

export function groupMembersSectionDetail({
  totalCount,
  priorityCount,
  inCareCount = 0,
  visibleCount,
  activeFilter,
}: {
  totalCount: number;
  priorityCount: number;
  inCareCount?: number;
  visibleCount: number;
  activeFilter: MembersFilter;
}) {
  if (activeFilter === FILTER_ALL) {
    const statusParts = [
      priorityCount > 0 ? countLabel(priorityCount, "sinal aberto", "sinais abertos") : null,
      inCareCount > 0 ? countLabel(inCareCount, "em cuidado", "em cuidado") : null,
    ].filter(Boolean);

    return `${countLabel(totalCount, "membro", "membros")}${statusParts.length > 0 ? ` · ${statusParts.join(" · ")}` : ""}`;
  }

  return countLabel(visibleCount, "irmão neste recorte", "irmãos neste recorte");
}

export function buildGroupMembersView(
  members: MemberDisplay[],
  activeFilter: MembersFilter,
  activeFocus: GroupDetailFocus | null = null,
): GroupMembersView {
  const visibleMembers = members.filter((member) => memberMatchesFilter(member, activeFilter, {
    attentionMaxPriorityRank: GROUP_MEMBER_SIGNAL_MAX_PRIORITY,
    inCarePriorityRank: GROUP_MEMBER_IN_CARE_PRIORITY,
    activeMinPriorityRank: GROUP_MEMBER_IN_CARE_PRIORITY + 1,
  }));
  const signalMembers = members.filter((member) => member.priorityRank <= GROUP_MEMBER_SIGNAL_MAX_PRIORITY);
  const inCareMembers = members.filter((member) => member.priorityRank === GROUP_MEMBER_IN_CARE_PRIORITY);
  const activeMembers = members.filter((member) => member.priorityRank > GROUP_MEMBER_IN_CARE_PRIORITY);
  const focusedMembers = activeFocus
    ? members.filter((member) => groupMemberMatchesFocus(member, activeFocus))
    : [];
  const priorityMembers = signalMembers;
  const regularMembers = activeFilter === FILTER_ALL ? activeMembers : visibleMembers;

  return {
    members,
    visibleMembers,
    priorityMembers,
    inCareMembers,
    regularMembers,
    filterCounts: {
      [FILTER_ATTENTION]: signalMembers.length,
      [FILTER_IN_CARE]: inCareMembers.length,
      [FILTER_ACTIVE]: activeMembers.length,
    },
    sectionDetail: groupMembersSectionDetail({
      totalCount: members.length,
      priorityCount: signalMembers.length,
      inCareCount: inCareMembers.length,
      visibleCount: visibleMembers.length,
      activeFilter,
    }),
    focusedMembersCount: focusedMembers.length,
  };
}
