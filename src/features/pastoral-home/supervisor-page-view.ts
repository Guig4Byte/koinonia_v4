import { UserRole, type SignalSeverity, type PersonStatus } from "@/generated/prisma/client";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";
import { signalTitleForViewer } from "@/features/signals/display";
import type { NextPastoralAction } from "@/features/pastoral-home/components/next-pastoral-action-card";
import { membersFilterHref } from "@/features/people/member-filters";
import { FILTER_ATTENTION, FILTER_IN_CARE } from "@/lib/filter-param";
import { countLabel } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { splitPastoralSections } from "@/features/signals/sections";

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
  groups: Array<{
    name: string;
    memberships: Array<{ person: Omit<SupervisorPageInCarePerson, "groupName"> }>;
  }>;
};

export type SupervisorPageView = {
  navIndicator?: "risk" | "attention" | "care";
  pastoralPulse: PastoralPulseMessage;
  urgentSignals: SupervisorPageSignal[];
  supportSignals: SupervisorPageSignal[];
  attentionSignals: SupervisorPageSignal[];
  inCarePeople: SupervisorPageInCarePerson[];
  nextAction: NextPastoralAction | null;
};

function supervisorInCarePeople(dashboard: SupervisorPageDashboard): SupervisorPageInCarePerson[] {
  return dashboard.groups.flatMap((group) => (
    group.memberships.map((membership) => ({ ...membership.person, groupName: group.name }))
  ));
}

export function buildSupervisorNextPastoralAction({
  urgentSignals,
  supportSignals,
  attentionSignals,
  inCarePeople,
}: {
  urgentSignals: SupervisorPageSignal[];
  supportSignals: SupervisorPageSignal[];
  attentionSignals: SupervisorPageSignal[];
  inCarePeople: SupervisorPageInCarePerson[];
}): NextPastoralAction | null {
  if (urgentSignals.length > 0) {
    return {
      eyebrow: "Prioridade de hoje",
      title: `${countLabel(urgentSignals.length, "caso urgente", "casos urgentes")} nas células`,
      detail: "Comece pelas pessoas que pedem intervenção ou leitura pastoral mais próxima.",
      href: membersFilterHref(ROUTES.people, FILTER_ATTENTION),
      label: "Ver pessoas no radar",
      tone: "risk",
    };
  }

  if (supportSignals.length > 0) {
    return {
      eyebrow: "Pedidos de apoio",
      title: `${countLabel(supportSignals.length, "pedido de líder", "pedidos de líderes")} aguardando retorno`,
      detail: "Abra os pedidos antes de revisar acompanhamentos menos urgentes.",
      href: membersFilterHref(ROUTES.people, FILTER_ATTENTION),
      label: "Responder pedidos",
      tone: "support",
    };
  }

  if (attentionSignals.length > 0) {
    return {
      eyebrow: "Acompanhamento",
      title: `${countLabel(attentionSignals.length, "pessoa em atenção", "pessoas em atenção")} para supervisionar`,
      detail: "Revise o contexto de cada célula e combine o próximo passo com o líder.",
      href: membersFilterHref(ROUTES.people, FILTER_ATTENTION),
      label: "Acompanhar pessoas",
      tone: "warn",
    };
  }

  if (inCarePeople.length > 0) {
    return {
      eyebrow: "Cuidado ativo",
      title: `${countLabel(inCarePeople.length, "pessoa em cuidado", "pessoas em cuidado")} sob acompanhamento`,
      detail: "Confira se o cuidado segue com dono claro e próximo passo registrado.",
      href: membersFilterHref(ROUTES.people, FILTER_IN_CARE),
      label: "Ver cuidados",
      tone: "care",
    };
  }

  return null;
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
  const firstUrgentSignal = urgentSignals[0];
  const firstSupportRequest = supportSignals[0];
  const firstAttentionSignal = attentionSignals[0];
  const firstInCarePerson = inCarePeople[0];

  return {
    navIndicator: urgentSignals.length > 0 ? "risk" : dashboard.attentionPeople.length > 0 ? "attention" : inCarePeople.length > 0 ? "care" : undefined,
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
    nextAction: buildSupervisorNextPastoralAction({ urgentSignals, supportSignals, attentionSignals, inCarePeople }),
  };
}
