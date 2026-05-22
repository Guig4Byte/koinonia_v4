import { UserRole } from "@/generated/prisma/client";
import { hasRecordedPresence, type RelevantEventCandidate } from "@/features/events/relevant-event";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";
import { signalTitleForViewer, type SignalDetailLike } from "@/features/signals/display";
import type { NextPastoralAction } from "@/features/pastoral-home/components/next-pastoral-action-card";
import { membersFilterHref } from "@/features/people/member-filters";
import { FILTER_ATTENTION, FILTER_IN_CARE } from "@/lib/filter-param";
import { countLabel } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { splitPastoralSections, type SectionPersonWithIdentity, type SectionSignalWithIdentity } from "@/features/signals/sections";
import type { LeaderDashboard } from "@/features/dashboard/queries";

export const LEADER_RELEVANT_EVENT_LOOKBACK_DAYS = 60;
export const LEADER_RELEVANT_EVENT_LIMIT = 20;
export type LeaderPageViewer = {
  id: string;
  role: UserRole;
};

type LeaderPageSignalBase = SectionSignalWithIdentity & SignalDetailLike;

export type LeaderPageSignal = Omit<LeaderPageSignalBase, "assignedTo" | "person" | "reason"> & {
  assignedTo?: { id?: string | null; name?: string | null; role: UserRole } | null;
  person: { id: string; fullName: string };
  reason: string;
};

export type LeaderPageInCarePerson = SectionPersonWithIdentity & {
  fullName: string;
};

export type LeaderPastoralSections = ReturnType<typeof buildLeaderPastoralSections>;

export type LeaderPageView = LeaderPastoralSections & {
  navIndicator?: "risk" | "attention" | "care";
  hasPeopleInRadar: boolean;
  pastoralPulse: PastoralPulseMessage;
  nextAction: NextPastoralAction | null;
};

export type LeaderCurrentEvent = RelevantEventCandidate & {
  id: string;
  startsAt: Date;
  locationName?: string | null;
  group?: { name?: string | null; locationName?: string | null } | null;
};

export type LeaderCurrentEventState = {
  groupName: string;
  locationName: string | null;
  badgeLabel: string;
  badgeTone: "ok" | "warn";
  description: string;
  ctaLabel: string;
};

export function buildLeaderPastoralSections({
  signals,
  inCarePeople,
  viewer,
}: {
  signals: LeaderPageSignal[];
  inCarePeople: LeaderPageInCarePerson[];
  viewer: LeaderPageViewer;
}) {
  const pastoralSections = splitPastoralSections({ signals, inCarePeople, viewer });
  const prioritySignals = [
    ...pastoralSections.urgentOrPastoralCases,
    ...pastoralSections.supportRequests,
    ...pastoralSections.localAttention,
  ];

  return {
    urgentSignals: pastoralSections.urgentOrPastoralCases,
    supportSignals: pastoralSections.supportRequests,
    attentionSignals: pastoralSections.localAttention,
    inCarePeople: pastoralSections.inCarePeople,
    prioritySignals,
  };
}

export function leaderNavIndicator({
  urgentCount,
  attentionCount,
  inCareCount,
}: {
  urgentCount: number;
  attentionCount: number;
  inCareCount: number;
}): LeaderPageView["navIndicator"] {
  if (urgentCount > 0) return "risk";
  if (attentionCount > 0) return "attention";
  if (inCareCount > 0) return "care";
  return undefined;
}

export function buildLeaderPastoralPulse({
  sections,
  viewer,
}: {
  sections: LeaderPastoralSections;
  viewer: LeaderPageViewer;
}): PastoralPulseMessage {
  const primaryUrgentSignal = sections.urgentSignals[0];
  const primarySupportSignal = sections.supportSignals[0];
  const primaryAttentionSignal = sections.attentionSignals[0];
  const primaryInCarePerson = sections.inCarePeople[0];

  return buildPastoralPulseMessage({
    viewerRole: viewer.role,
    scope: "leaderDashboard",
    counts: {
      urgentOrPastoral: sections.urgentSignals.length,
      support: sections.supportSignals.length,
      attention: sections.attentionSignals.length,
      inCare: sections.inCarePeople.length,
    },
    subjects: {
      urgentOrPastoral: primaryUrgentSignal
        ? { personName: primaryUrgentSignal.person.fullName, detail: signalTitleForViewer(primaryUrgentSignal, viewer) }
        : null,
      support: primarySupportSignal
        ? { personName: primarySupportSignal.person.fullName, detail: signalTitleForViewer(primarySupportSignal, viewer) }
        : null,
      attention: primaryAttentionSignal
        ? { personName: primaryAttentionSignal.person.fullName, detail: signalTitleForViewer(primaryAttentionSignal, viewer) }
        : null,
      inCare: primaryInCarePerson ? { personName: primaryInCarePerson.fullName } : null,
    },
  });
}

export function buildLeaderNextPastoralAction(sections: LeaderPastoralSections): NextPastoralAction | null {
  const urgentCount = sections.urgentSignals.length;
  const supportCount = sections.supportSignals.length;
  const attentionCount = sections.attentionSignals.length;
  const inCareCount = sections.inCarePeople.length;

  if (urgentCount > 0) {
    return {
      eyebrow: "Prioridade de hoje",
      title: `${countLabel(urgentCount, "pessoa urgente", "pessoas urgentes")} no radar`,
      detail: "Comece pelos casos com maior risco antes de revisar os demais acompanhamentos.",
      href: membersFilterHref(ROUTES.cells, FILTER_ATTENTION),
      label: "Ver pessoas no radar",
      tone: "risk",
    };
  }

  if (supportCount > 0) {
    return {
      eyebrow: "Pedido de apoio",
      title: `${countLabel(supportCount, "pedido aberto", "pedidos abertos")} para revisar`,
      detail: "Veja o contexto do pedido e registre o próximo passo com a supervisão.",
      href: membersFilterHref(ROUTES.cells, FILTER_ATTENTION),
      label: "Ver pedidos",
      tone: "support",
    };
  }

  if (attentionCount > 0) {
    return {
      eyebrow: "Acompanhamento",
      title: `${countLabel(attentionCount, "pessoa em atenção", "pessoas em atenção")} na célula`,
      detail: "Revise quem precisa de proximidade antes de abrir a lista completa de membros.",
      href: membersFilterHref(ROUTES.cells, FILTER_ATTENTION),
      label: "Ver pessoas em atenção",
      tone: "warn",
    };
  }

  if (inCareCount > 0) {
    return {
      eyebrow: "Cuidado ativo",
      title: `${countLabel(inCareCount, "pessoa em cuidado", "pessoas em cuidado")} para seguir`,
      detail: "Confira quem já recebeu cuidado e mantenha o acompanhamento atualizado.",
      href: membersFilterHref(ROUTES.cells, FILTER_IN_CARE),
      label: "Continuar cuidado",
      tone: "care",
    };
  }

  return null;
}

export function buildLeaderPageView({
  dashboard,
  viewer,
}: {
  dashboard: LeaderDashboard;
  viewer: LeaderPageViewer;
}): LeaderPageView {
  const sections = buildLeaderPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: dashboard.inCarePeople,
    viewer,
  });

  return {
    ...sections,
    hasPeopleInRadar: sections.prioritySignals.length > 0 || sections.inCarePeople.length > 0,
    navIndicator: leaderNavIndicator({
      urgentCount: sections.urgentSignals.length,
      attentionCount: dashboard.attentionPeople.length,
      inCareCount: sections.inCarePeople.length,
    }),
    pastoralPulse: buildLeaderPastoralPulse({ sections, viewer }),
    nextAction: buildLeaderNextPastoralAction(sections),
  };
}

export function leaderCurrentEventState(event: LeaderCurrentEvent): LeaderCurrentEventState {
  const completed = hasRecordedPresence(event);

  return {
    groupName: event.group?.name ?? "Célula",
    locationName: event.locationName ?? event.group?.locationName ?? null,
    badgeLabel: completed ? "Presença registrada" : "Presença pendente",
    badgeTone: completed ? "ok" : "warn",
    description: completed
      ? "A presença deste encontro já foi registrada. Ajuste somente se alguma marcação estiver errada."
      : "Registre a presença quando o encontro acontecer para manter o cuidado em dia.",
    ctaLabel: completed ? "Ver detalhes" : "Registrar presença",
  };
}
