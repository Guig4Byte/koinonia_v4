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
import type { SupervisorFocusItem, SupervisorFocusKey, SupervisorPageInCarePerson, SupervisorPageSignal } from "@/features/pastoral-home/supervisor-page-view/supervisor-page-view.types";
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

function focusCount(groupCount: number, itemCount: number) {
  return groupCount > 0 ? groupCount : itemCount;
}

export function hasPresenceFocus(group: SupervisorGroup) {
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
      singular: "célula urgente",
      plural: "células urgentes",
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
      href: focusHrefForGroups(presenceGroups, FILTER_PRESENCE, presenceDetailFocus(presenceGroups[0])),
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
