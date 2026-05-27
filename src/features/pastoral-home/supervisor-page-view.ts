import { UserRole, type PersonStatus, type SignalSeverity } from "@/generated/prisma/client";
import { cellsFilterHref, type CellsFilter } from "@/features/groups/cells-page-filters";
import type { SupervisorGroup } from "@/features/groups/cells-page-view";
import {
  groupLocalAttentionCount,
  groupPastoralEscalatedCount,
  groupPastoralPriorityScore,
  groupRiskCount,
  groupSupportRequestsCount,
  groupUrgentCount,
  hasLowPresence,
} from "@/features/groups/group-pastoral-priority";
import type { NextPastoralAction, NextPastoralActionTone } from "@/features/pastoral-home/components/next-pastoral-action-card";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";
import { signalTitleForViewer } from "@/features/signals/display";
import { splitPastoralSections } from "@/features/signals/sections";
import {
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_PRESENCE,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";
import { countLabel } from "@/lib/format";
import { routeWithQuery, ROUTES } from "@/lib/routes";

export type SupervisorPageViewer = {
  id: string;
  role: UserRole;
};

export type SupervisorPageSignal = {
  id: string;
  personId: string;
  reason: string;
  severity: SignalSeverity;
  detectedAt?: Date;
  assignedToId?: string | null;
  assignedTo?: { role: UserRole } | null;
  person: { id: string; fullName: string };
  group: { name: string };
};

export type SupervisorPageInCarePerson = {
  id: string;
  fullName: string;
  status: PersonStatus;
  groupName: string;
};

export type SupervisorPageDashboard = {
  attentionPeople: SupervisorPageSignal[];
  groups: SupervisorGroup[];
};

export type SupervisorFocusKey = "urgent" | "support" | "presence" | "attention" | "care";

export type SupervisorFocusItem = {
  key: SupervisorFocusKey;
  valueLabel: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  tone: Exclude<NextPastoralActionTone, "ok">;
};

export type SupervisorPageView = {
  navIndicator?: "risk" | "attention" | "care";
  pastoralPulse: PastoralPulseMessage;
  urgentSignals: SupervisorPageSignal[];
  supportSignals: SupervisorPageSignal[];
  attentionSignals: SupervisorPageSignal[];
  inCarePeople: SupervisorPageInCarePerson[];
  focusItems: SupervisorFocusItem[];
  nextAction: NextPastoralAction | null;
};

function supervisorInCarePeople(dashboard: SupervisorPageDashboard): SupervisorPageInCarePerson[] {
  return dashboard.groups.flatMap((group) => (
    group.memberships.map((membership) => ({ ...membership.person, groupName: group.name }))
  ));
}

function focusCount(groupCount: number, itemCount: number) {
  return groupCount > 0 ? groupCount : itemCount;
}

function hasPresenceFocus(group: SupervisorGroup) {
  return !group.hasPresenceData || hasLowPresence(group);
}

function focusHrefForGroups(groups: SupervisorGroup[], listFilter: CellsFilter, detailFocus?: string) {
  if (groups.length === 1) {
    return routeWithQuery(ROUTES.group(groups[0].id), { foco: detailFocus });
  }

  return cellsFilterHref(listFilter);
}

function riskListFilter(groups: SupervisorGroup[]): CellsFilter {
  if (groups.length > 0 && groups.every((group) => groupUrgentCount(group) > 0)) return FILTER_URGENT;
  if (groups.length > 0 && groups.every((group) => groupPastoralEscalatedCount(group) > 0)) return FILTER_PASTORAL;
  return FILTER_ATTENTION;
}

function riskDetailFocus(group: SupervisorGroup | undefined) {
  if (!group) return undefined;
  return groupUrgentCount(group) > 0 ? FILTER_URGENT : FILTER_PASTORAL;
}

function presenceListFilter(): CellsFilter {
  return FILTER_PRESENCE;
}

function presenceDetailFocus(group: SupervisorGroup | undefined) {
  if (!group) return undefined;
  if (!group.hasPresenceData) return FILTER_NO_RECENT_PRESENCE;
  if (hasLowPresence(group)) return FILTER_LOW_PRESENCE;
  return undefined;
}

function buildFocusItem({
  key,
  count,
  singular,
  plural,
  title,
  detail,
  href,
  actionLabel,
  tone,
}: {
  key: SupervisorFocusKey;
  count: number;
  singular: string;
  plural: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  tone: SupervisorFocusItem["tone"];
}): SupervisorFocusItem | null {
  if (count <= 0) return null;

  return {
    key,
    valueLabel: countLabel(count, singular, plural),
    title,
    detail,
    href,
    actionLabel,
    tone,
  };
}

export function buildSupervisorFocusItems({
  groups,
  urgentSignals,
  supportSignals,
  attentionSignals,
  inCarePeople,
}: {
  groups: SupervisorGroup[];
  urgentSignals: SupervisorPageSignal[];
  supportSignals: SupervisorPageSignal[];
  attentionSignals: SupervisorPageSignal[];
  inCarePeople: SupervisorPageInCarePerson[];
}): SupervisorFocusItem[] {
  const groupsWithPastoralFocus = groups.filter((group) => groupPastoralPriorityScore(group) > 0);
  const riskGroups = groupsWithPastoralFocus.filter((group) => groupRiskCount(group) > 0);
  const supportGroups = groupsWithPastoralFocus.filter((group) => groupSupportRequestsCount(group) > 0);
  const presenceGroups = groups.filter(hasPresenceFocus);
  const attentionGroups = groupsWithPastoralFocus.filter((group) => groupLocalAttentionCount(group) > 0);
  const careGroups = groupsWithPastoralFocus.filter((group) => group.inCareCount > 0);
  const urgentCount = focusCount(riskGroups.length, urgentSignals.length);
  const supportCount = focusCount(supportGroups.length, supportSignals.length);
  const presenceCount = presenceGroups.length;
  const attentionCount = focusCount(attentionGroups.length, attentionSignals.length);
  const careCount = focusCount(careGroups.length, inCarePeople.length);

  return [
    buildFocusItem({
      key: "urgent",
      count: urgentCount,
      singular: "célula com cuidado próximo",
      plural: "células com cuidado próximo",
      title: "Acompanhamento próximo",
      detail: "Há situações que pedem conversa, leitura pastoral ou alinhamento mais cuidadoso com a liderança.",
      href: focusHrefForGroups(riskGroups, riskListFilter(riskGroups), riskDetailFocus(riskGroups[0])),
      actionLabel: "Ver contexto nas células",
      tone: "risk",
    }),
    buildFocusItem({
      key: "support",
      count: supportCount,
      singular: "célula com apoio pedido",
      plural: "células com apoio pedido",
      title: "Apoio com líderes",
      detail: "Líderes trouxeram pontos para caminhar junto, mesmo que a conversa aconteça fora do sistema.",
      href: focusHrefForGroups(supportGroups, FILTER_SUPPORT, FILTER_SUPPORT),
      actionLabel: "Acompanhar com liderança",
      tone: "support",
    }),
    buildFocusItem({
      key: "presence",
      count: presenceCount,
      singular: "célula para entender",
      plural: "células para entender",
      title: "Presença pede leitura",
      detail: "Sem presença recente ou presença baixa pode indicar só rotina, ou pode pedir uma conversa pastoral.",
      href: focusHrefForGroups(presenceGroups, presenceListFilter(), presenceDetailFocus(presenceGroups[0])),
      actionLabel: "Revisar presença",
      tone: "presence",
    }),
    buildFocusItem({
      key: "attention",
      count: attentionCount,
      singular: "célula com sinal pastoral",
      plural: "células com sinais pastorais",
      title: "Sinais nas células",
      detail: "Pontos de atenção continuam no radar para você acompanhar o movimento com os líderes.",
      href: focusHrefForGroups(attentionGroups, FILTER_ATTENTION, FILTER_ATTENTION),
      actionLabel: "Ver contexto",
      tone: "warn",
    }),
    buildFocusItem({
      key: "care",
      count: careCount,
      singular: "célula com cuidado em andamento",
      plural: "células com cuidado em andamento",
      title: "Memória de cuidado",
      detail: "Acompanhamentos em andamento permanecem visíveis, mesmo quando o cuidado acontece nas conversas da semana.",
      href: focusHrefForGroups(careGroups, FILTER_IN_CARE, FILTER_IN_CARE),
      actionLabel: "Revisar cuidado",
      tone: "care",
    }),
  ].filter((item): item is SupervisorFocusItem => item !== null);
}

export function buildSupervisorNextPastoralAction(focusItems: SupervisorFocusItem[]): NextPastoralAction | null {
  const primaryFocus = focusItems[0];

  if (!primaryFocus) return null;

  return {
    eyebrow: "Foco de acompanhamento",
    title: primaryFocus.valueLabel,
    detail: primaryFocus.detail,
    href: primaryFocus.href,
    label: primaryFocus.actionLabel,
    tone: primaryFocus.tone,
  };
}

export function buildSupervisorPageView({
  dashboard,
  user,
}: {
  dashboard: SupervisorPageDashboard;
  user: SupervisorPageViewer;
}): SupervisorPageView {
  const pastoralSections = splitPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: supervisorInCarePeople(dashboard),
    viewer: user,
  });
  const urgentSignals = pastoralSections.urgentOrPastoralCases;
  const supportSignals = pastoralSections.supportRequests;
  const attentionSignals = pastoralSections.localAttention;
  const inCarePeople = pastoralSections.inCarePeople;
  const focusItems = buildSupervisorFocusItems({
    groups: dashboard.groups,
    urgentSignals,
    supportSignals,
    attentionSignals,
    inCarePeople,
  });
  const firstUrgentSignal = urgentSignals[0];
  const firstSupportRequest = supportSignals[0];
  const firstAttentionSignal = attentionSignals[0];
  const firstInCarePerson = inCarePeople[0];
  const hasRisk = urgentSignals.length > 0 || dashboard.groups.some((group) => groupRiskCount(group) > 0);
  const hasAttention = supportSignals.length > 0
    || attentionSignals.length > 0
    || dashboard.groups.some((group) => (
      groupSupportRequestsCount(group) > 0
      || groupLocalAttentionCount(group) > 0
      || hasPresenceFocus(group)
    ));
  const hasCare = inCarePeople.length > 0 || dashboard.groups.some((group) => group.inCareCount > 0);

  return {
    navIndicator: hasRisk ? "risk" : hasAttention ? "attention" : hasCare ? "care" : undefined,
    pastoralPulse: buildPastoralPulseMessage({
      viewerRole: user.role,
      scope: "supervisorDashboard",
      counts: {
        urgentOrPastoral: urgentSignals.length,
        support: supportSignals.length,
        attention: attentionSignals.length,
        inCare: inCarePeople.length,
      },
      subjects: {
        urgentOrPastoral: firstUrgentSignal ? { personName: firstUrgentSignal.person.fullName, groupName: firstUrgentSignal.group.name, detail: signalTitleForViewer(firstUrgentSignal, user) } : null,
        support: firstSupportRequest ? { personName: firstSupportRequest.person.fullName, groupName: firstSupportRequest.group.name, detail: signalTitleForViewer(firstSupportRequest, user) } : null,
        attention: firstAttentionSignal ? { personName: firstAttentionSignal.person.fullName, groupName: firstAttentionSignal.group.name, detail: signalTitleForViewer(firstAttentionSignal, user) } : null,
        inCare: firstInCarePerson ? { personName: firstInCarePerson.fullName, groupName: firstInCarePerson.groupName } : null,
      },
    }),
    urgentSignals,
    supportSignals,
    attentionSignals,
    inCarePeople,
    focusItems,
    nextAction: buildSupervisorNextPastoralAction(focusItems),
  };
}
