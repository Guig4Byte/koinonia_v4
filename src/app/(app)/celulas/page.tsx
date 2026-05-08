import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { ContextSummary, EmptyState, GroupCard, InfoCard, SectionTitle } from "@/components/cards";
import { ProgressiveList } from "@/components/progressive-list";
import { CellsStructureSearch } from "@/components/cells-structure-search";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import {
  groupNeedsPastoralAttention,
  groupPastoralEscalatedCount,
  groupPastoralPriorityScore,
  groupRiskCount,
  groupUrgentCount,
  hasLowPresence,
} from "@/features/groups/group-pastoral-priority";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { canManageGroups, canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { groupAttentionLabel, type SignalBadge } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { normalizeSearchText } from "@/lib/text";
import { GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import { firstParam } from "@/lib/search-params";

const SECTION_LIMIT = 4;
const CELLS_SECTION_ID = "celulas-supervisionadas";

type CellsFilter = "todos" | "atencao" | "sem-presenca";

type CellsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SupervisorDashboard = Awaited<ReturnType<typeof getSupervisorDashboard>>;
type SupervisorGroup = SupervisorDashboard["groups"][number];
type GroupSectionKey = "care" | "presence" | "stable";

const CELLS_FILTERS: Array<{ value: CellsFilter; label: string }> = [
  { value: "todos", label: "Todas" },
  { value: "atencao", label: "Pedem cuidado próximo" },
  { value: "sem-presenca", label: "Sem presença recente" },
];



function readCellsFilter(value: string): CellsFilter {
  return CELLS_FILTERS.some((filter) => filter.value === value) ? value as CellsFilter : "todos";
}


function groupSearchText(group: SupervisorGroup) {
  return normalizeSearchText(`${group.name} ${responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, group.leader?.name ?? "")}`);
}


function groupSectionKey(group: SupervisorGroup): GroupSectionKey {
  if (groupRiskCount(group) > 0 || group.supportRequestsCount > 0 || group.attentionCount > 0 || group.inCareCount > 0) {
    return "care";
  }

  if (!group.hasPresenceData || hasLowPresence(group)) {
    return "presence";
  }

  return "stable";
}

const GROUP_SECTIONS: Array<{ key: GroupSectionKey; title: string }> = [
  {
    key: "care",
    title: "Pedem cuidado próximo",
  },
  {
    key: "presence",
    title: "Presença em atenção",
  },
  {
    key: "stable",
    title: "Acompanhamento estável",
  },
];

function groupPriorityScore(group: SupervisorGroup) {
  return groupPastoralPriorityScore(group);
}

function compareGroups(left: SupervisorGroup, right: SupervisorGroup) {
  const scoreDifference = groupPriorityScore(right) - groupPriorityScore(left);
  if (scoreDifference !== 0) return scoreDifference;

  return left.name.localeCompare(right.name, "pt-BR");
}

function groupMatchesFilter(group: SupervisorGroup, filter: CellsFilter) {
  if (filter === "atencao") return groupNeedsPastoralAttention(group);
  if (filter === "sem-presenca") return !group.hasPresenceData;
  return true;
}

function filterGroups(groups: SupervisorGroup[], normalizedQuery: string, filter: CellsFilter) {
  return groups
    .filter((group) => groupMatchesFilter(group, filter))
    .filter((group) => !normalizedQuery || groupSearchText(group).includes(normalizedQuery))
    .sort(compareGroups);
}

function groupBadge(group: SupervisorGroup): SignalBadge | null {
  const urgent = groupUrgentCount(group);
  const escalated = groupPastoralEscalatedCount(group);

  if (urgent > 0) {
    return { label: groupAttentionLabel(urgent, "urgente", "urgentes"), tone: "risk" };
  }

  if (escalated > 0) {
    return { label: groupAttentionLabel(escalated, "encaminhado", "encaminhados"), tone: "risk" };
  }

  if (group.supportRequestsCount > 0) {
    return { label: groupAttentionLabel(group.supportRequestsCount, "pedido de apoio", "pedidos de apoio"), tone: "support" };
  }

  if (group.attentionCount > 0) {
    return { label: groupAttentionLabel(group.attentionCount, "pessoa em atenção", "pessoas em atenção"), tone: "warn" };
  }

  if (!group.hasPresenceData) {
    return { label: "Sem presença recente", tone: "neutral" };
  }

  if (hasLowPresence(group)) {
    return { label: "Presença baixa", tone: "warn" };
  }

  if (group.inCareCount > 0) {
    return { label: groupAttentionLabel(group.inCareCount, "em cuidado", "em cuidado"), tone: "care" };
  }

  return null;
}

function groupSubtitle(group: SupervisorGroup) {
  const leadership = responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, group.leader?.name ?? "Liderança não informada");
  const membersLabel = `${group.memberships.length} ${group.memberships.length === 1 ? "membro" : "membros"}`;

  return `${leadership} · ${membersLabel}`;
}

function sectionCardTone(sectionKey: GroupSectionKey) {
  if (sectionKey === "presence") return "muted";
  if (sectionKey === "stable") return "stable";
  return undefined;
}

function renderGroups(groups: SupervisorGroup[], sectionKey: GroupSectionKey) {
  return groups.map((group) => {
    const badge = groupBadge(group);

    return (
      <GroupCard
        key={group.id}
        name={group.name}
        subtitle={groupSubtitle(group)}
        presenceRate={group.presenceRate}
        attentionCount={group.attentionCount}
        badgeLabel={badge?.label}
        badgeTone={badge?.tone}
        showBadge={Boolean(badge)}
        cardTone={sectionCardTone(sectionKey)}
        href={`/celulas/${group.id}`}
        hasPresenceData={group.hasPresenceData}
        presenceTrend={group.presenceTrend}
        noPresenceLabel="Sem presença recente"
      />
    );
  });
}

function renderGroupSections(groups: SupervisorGroup[]) {
  return GROUP_SECTIONS.map((section) => {
    const sectionGroups = groups.filter((group) => groupSectionKey(group) === section.key).sort(compareGroups);

    if (sectionGroups.length === 0) return null;

    return (
      <div key={section.key} className="cell-priority-section">
        <div className="cell-priority-heading">
          <h3>
            {section.title}
          </h3>
        </div>
        <ProgressiveList
          initialCount={SECTION_LIMIT}
          step={SECTION_LIMIT}
          moreLabel="Ver mais células"
          lessLabel="Mostrar menos células"
        >
          {renderGroups(sectionGroups, section.key)}
        </ProgressiveList>
      </div>
    );
  });
}

export default async function CellsPage({ searchParams }: CellsPageProps) {
  const user = await getCurrentUser();

  if (!canUseSupervisorDashboard(user)) {
    redirect(user.role === UserRole.PASTOR || user.role === UserRole.ADMIN ? "/equipe" : user.role === UserRole.LEADER ? "/pessoas" : "/");
  }

  const params = searchParams ? await searchParams : {};
  const query = firstParam(params.q).trim();
  const normalizedQuery = normalizeSearchText(query);
  const activeFilter = readCellsFilter(firstParam(params.filtro));
  const dashboard = await getSupervisorDashboard(user);
  const groups = filterGroups(dashboard.groups, normalizedQuery, activeFilter);
  const groupSections = renderGroupSections(groups);
  const groupsNeedingAttentionCount = dashboard.groups.filter(groupNeedsPastoralAttention).length;
  const groupsWithoutPresenceCount = dashboard.groups.filter((group) => !group.hasPresenceData).length;
  const hasRisk = dashboard.groups.some((group) => groupRiskCount(group) > 0);
  const hasCare = dashboard.groups.some((group) => group.inCareCount > 0);
  const navIndicator = hasRisk ? "risk" : groupsNeedingAttentionCount > 0 ? "attention" : hasCare ? "care" : undefined;
  const isFiltered = Boolean(query) || activeFilter !== "todos";
  const canCreateGroup = canManageGroups(user);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: navIndicator })}
    >
      <div className="team-page">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="team-title">Células</h2>
            <p className="team-description">
              Acompanhe as células sob sua supervisão sem duplicar os sinais de pessoas da Visão.
            </p>
          </div>
          {canCreateGroup ? (
            <Link
              href="/celulas/nova"
              className="k-primary-action inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl px-3 text-sm font-bold transition active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova célula
            </Link>
          ) : null}
        </div>

        <div className="team-summary-block">
          <ContextSummary
            items={[
              {
                label: "Células acompanhadas",
                value: String(dashboard.groups.length),
                detail: "Comunidades que você acompanha de perto.",
                tone: "neutral",
              },
              {
                label: "Presença da semana",
                value: dashboard.hasPresenceData ? `${dashboard.presenceRate}%` : "—",
                detail: dashboard.hasPresenceData
                  ? "Média dos encontros registrados nesta semana."
                  : "Ainda sem presença registrada nesta semana.",
                tone: !dashboard.hasPresenceData ? "neutral" : dashboard.presenceRate < 65 ? "risk" : dashboard.presenceRate < 75 ? "warn" : "ok",
              },
              {
                label: "Pedem cuidado mais próximo",
                value: String(groupsNeedingAttentionCount),
                detail: groupsNeedingAttentionCount > 0
                  ? "Células que pedem proximidade, apoio ou discernimento."
                  : "Nenhuma célula pedindo cuidado próximo agora.",
                tone: groupsNeedingAttentionCount > 0 ? "warn" : "ok",
              },
              {
                label: "Sem presença recente",
                value: String(groupsWithoutPresenceCount),
                detail: groupsWithoutPresenceCount > 0
                  ? "Pode haver encontro realizado sem marcação ainda."
                  : "Todas têm presença recente registrada.",
                tone: groupsWithoutPresenceCount > 0 ? "neutral" : "ok",
              },
            ]}
          />
        </div>

        <section id={CELLS_SECTION_ID} className="scroll-mt-4">
          <SectionTitle detail="Busque e filtre as células listadas abaixo.">Células supervisionadas</SectionTitle>
          <CellsStructureSearch query={query} filter={activeFilter} sectionId={CELLS_SECTION_ID} />

          <div className="mt-6">
            {groups.length > 0 ? (
              <div className="cell-priority-sections">{groupSections}</div>
            ) : (
              <EmptyState>
                {isFiltered ? "Nenhuma célula encontrada nesse recorte." : "Nenhuma célula ativa vinculada à sua supervisão."}
              </EmptyState>
            )}
          </div>
        </section>

        <SectionTitle>Consulta</SectionTitle>
        <InfoCard>
          Abra uma célula para ver liderança, membros e histórico de presença. Os pedidos de apoio e pessoas em atenção continuam priorizados na Visão.
        </InfoCard>
      </div>
    </AppShell>
  );
}
