import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { ContextSummary, EmptyState, InfoCard, SectionTitle, priorityCardClass } from "@/components/cards";
import { ProgressiveList } from "@/components/progressive-list";
import { TeamStructureSearch } from "@/components/team-structure-search";
import { Badge } from "@/components/ui/badge";
import { GroupKind } from "@/generated/prisma/client";
import { getPastorTeamOverview } from "@/features/dashboard/queries";
import { canManageGroups, canUsePastorDashboard } from "@/features/permissions/permissions";
import type { SignalBadgeTone } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/text";

const SECTION_LIMIT = 4;
const SUPERVISOR_SECTION_LIMIT = 4;
const GROUPS_PER_SUPERVISOR_LIMIT = 4;
const SUPERVISORS_SECTION_ID = "supervisores";

type TeamFilter = "todos" | "atencao" | "sem-presenca";

const TEAM_FILTERS: Array<{ value: TeamFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Pedem atenção" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

type TeamOverview = Awaited<ReturnType<typeof getPastorTeamOverview>>;
type SupervisorTeam = TeamOverview["supervisors"][number];
type TeamGroup = SupervisorTeam["groups"][number];
type TeamPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function readTeamFilter(value: string): TeamFilter {
  return TEAM_FILTERS.some((filter) => filter.value === value) ? value as TeamFilter : "todos";
}

function groupMatchesQuery(group: TeamGroup, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const haystack = normalizeSearch(`${group.name} ${group.leadershipName}`);
  return haystack.includes(normalizedQuery);
}

function supervisorMatchesQuery(supervisor: SupervisorTeam, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const haystack = normalizeSearch(`${supervisor.name} ${supervisor.email}`);
  return haystack.includes(normalizedQuery);
}

function groupMatchesFilter(group: TeamGroup, filter: TeamFilter) {
  if (filter === "atencao") return group.pastoralPriorityScore > 0;
  if (filter === "sem-presenca") return group.hasNoPresenceData;
  return true;
}

function filterGroups(groups: TeamGroup[], normalizedQuery: string, filter: TeamFilter) {
  return groups.filter((group) => groupMatchesFilter(group, filter) && groupMatchesQuery(group, normalizedQuery));
}

function filterSupervisorGroups(supervisor: SupervisorTeam, normalizedQuery: string, filter: TeamFilter) {
  const supervisorMatches = supervisorMatchesQuery(supervisor, normalizedQuery);

  return supervisor.groups.filter((group) => {
    if (!groupMatchesFilter(group, filter)) return false;
    if (!normalizedQuery) return true;
    return supervisorMatches || groupMatchesQuery(group, normalizedQuery);
  });
}

function withFilteredGroups(supervisor: SupervisorTeam, groups: TeamGroup[]): SupervisorTeam {
  return {
    ...supervisor,
    groups,
    highestPriorityScore: groups[0]?.pastoralPriorityScore ?? 0,
    groupsNeedingAttentionCount: groups.filter((group) => group.pastoralPriorityScore > 0).length,
    pastoralCasesCount: groups.reduce((total, group) => total + group.pastoralCasesCount, 0),
    urgentCount: groups.reduce((total, group) => total + group.urgentCount, 0),
    attentionCount: groups.reduce((total, group) => total + group.attentionCount, 0),
    groupsWithoutPresenceCount: groups.filter((group) => !group.hasPresenceData).length,
    lowPresenceGroupsCount: groups.filter((group) => group.hasPresenceData && group.hasLowPresence).length,
  };
}

function filterSupervisors(supervisors: SupervisorTeam[], normalizedQuery: string, filter: TeamFilter) {
  return supervisors.flatMap((supervisor) => {
    const groups = filterSupervisorGroups(supervisor, normalizedQuery, filter);

    if (groups.length > 0) return [withFilteredGroups(supervisor, groups)];

    // Na visão padrão, Equipe é estrutura pastoral: todos os supervisores ativos aparecem,
    // mesmo quando não têm célula ativa vinculada. Os filtros continuam mostrando só
    // supervisores que possuem células no recorte escolhido.
    if (filter === "todos" && supervisorMatchesQuery(supervisor, normalizedQuery)) {
      return [withFilteredGroups(supervisor, [])];
    }

    return [];
  });
}

function compactGroupSubtitle(group: TeamGroup) {
  const membersLabel = `${group.membersCount} ${group.membersCount === 1 ? "membro" : "membros"}`;
  return `${group.leadershipName} · ${membersLabel}`;
}

function groupBadgeTone(group: TeamGroup): SignalBadgeTone {
  if (group.urgentCount > 0 || group.pastoralCasesCount > 0) return "risk";
  if (!group.hasPresenceData) return "neutral";
  if (group.presenceRate < 70) return "warn";
  return "ok";
}

function shouldShowGroupBadge(group: TeamGroup) {
  return group.statusLabel !== "Estável";
}

function supervisorSummary(supervisor: SupervisorTeam) {
  const groupsLabel = `${supervisor.groups.length} ${supervisor.groups.length === 1 ? "célula acompanhada" : "células acompanhadas"}`;

  if (supervisor.urgentCount > 0) {
    return `${groupsLabel} · ${supervisor.urgentCount} ${supervisor.urgentCount === 1 ? "urgente" : "urgentes"}.`;
  }

  if (supervisor.pastoralCasesCount > 0) {
    return `${groupsLabel} · ${supervisor.pastoralCasesCount} ${supervisor.pastoralCasesCount === 1 ? "caso pastoral" : "casos pastorais"}.`;
  }

  if (supervisor.groupsNeedingAttentionCount > 0) {
    return `${groupsLabel} · ${supervisor.groupsNeedingAttentionCount} ${supervisor.groupsNeedingAttentionCount === 1 ? "célula pede" : "células pedem"} atenção.`;
  }

  if (supervisor.groupsWithoutPresenceCount > 0) {
    return `${groupsLabel} · ${supervisor.groupsWithoutPresenceCount} sem presença recente.`;
  }

  return groupsLabel;
}

function supervisorBadgeTone(supervisor: SupervisorTeam): SignalBadgeTone {
  if (supervisor.urgentCount > 0 || supervisor.pastoralCasesCount > 0) return "risk";
  if (supervisor.lowPresenceGroupsCount > 0) return "warn";
  return "neutral";
}

function CompactGroupLink({ group }: { group: TeamGroup }) {
  const tone = groupBadgeTone(group);

  return (
    <Link
      href={`/celulas/${group.id}`}
      className={cn("team-cell-link", shouldShowGroupBadge(group) && `team-cell-link-${tone}`)}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{group.name}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">{compactGroupSubtitle(group)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {shouldShowGroupBadge(group) ? <Badge tone={tone}>{group.statusLabel}</Badge> : null}
        <span className="text-sm font-bold text-[var(--color-brand)] opacity-60" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}


function InactiveGroupLink({ group }: { group: { id: string; name: string; meetingDayOfWeek: number | null; meetingTime: string | null; locationName: string | null } }) {
  const scheduleText = group.meetingDayOfWeek === null || !group.meetingTime
    ? "Sem agenda padrão"
    : `${["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][group.meetingDayOfWeek]} · ${group.meetingTime}`;

  return (
    <Link
      href={`/celulas/${group.id}/editar`}
      className="team-cell-link team-cell-link-neutral"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{group.name}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">
          {scheduleText}{group.locationName ? ` · ${group.locationName}` : ""}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge tone="neutral">Inativa</Badge>
        <span className="text-sm font-bold text-[var(--color-brand)] opacity-60" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

function SupervisorCard({ supervisor }: { supervisor: SupervisorTeam }) {
  const hasGroups = supervisor.groups.length > 0;
  const badgeTone = supervisorBadgeTone(supervisor);

  return (
    <section className={cn("team-supervisor-card", priorityCardClass(badgeTone !== "neutral" ? badgeTone : undefined))}>
      <div className="flex items-start gap-2.5">
        <div className="team-avatar">
          {initials(supervisor.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text-primary)]">{supervisor.name}</p>
          </div>

          {!hasGroups ? (
            <>
              <p className="team-supervisor-summary-text">{supervisorSummary(supervisor)}</p>
              <div className="mt-2">
                <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
              </div>
            </>
          ) : (
            <details className="team-supervisor-details group">
              <summary className="team-supervisor-summary">
                <span className="team-supervisor-summary-text">
                  {supervisorSummary(supervisor)}
                </span>
                <span className="team-supervisor-summary-action">
                  <span className="group-open:hidden">Ver células</span>
                  <span className="hidden group-open:inline">Mostrar menos</span>
                  <span className="inline-block transition group-active:translate-x-0.5" aria-hidden="true">→</span>
                </span>
              </summary>
              <div className="team-cell-list">
                <ProgressiveList
                  initialCount={GROUPS_PER_SUPERVISOR_LIMIT}
                  step={GROUPS_PER_SUPERVISOR_LIMIT}
                  moreLabel="Ver mais células"
                  lessLabel="Mostrar menos células"
                >
                  {supervisor.groups.map((group) => (
                    <CompactGroupLink key={group.id} group={group} />
                  ))}
                </ProgressiveList>
              </div>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}

function renderSupervisorCards(supervisors: SupervisorTeam[]) {
  return supervisors.map((supervisor) => (
    <SupervisorCard key={supervisor.id} supervisor={supervisor} />
  ));
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const user = await getCurrentUser();

  if (!canUsePastorDashboard(user)) {
    redirect("/");
  }

  const params = searchParams ? await searchParams : {};
  const query = firstParam(params.q).trim();
  const normalizedQuery = normalizeSearch(query);
  const activeFilter = readTeamFilter(firstParam(params.filtro));
  const savedParam = firstParam(params.salvo);
  const team = await getPastorTeamOverview(user);
  const inactiveGroups = canManageGroups(user)
    ? await prisma.smallGroup.findMany({
      where: { churchId: user.churchId, kind: GroupKind.CELL, isActive: false },
      select: { id: true, name: true, meetingDayOfWeek: true, meetingTime: true, locationName: true },
      orderBy: { name: "asc" },
    })
    : [];
  const filteredSupervisors = filterSupervisors(team.supervisors, normalizedQuery, activeFilter);
  const filteredUnassignedGroups = filterGroups(team.unassignedGroups, normalizedQuery, activeFilter);
  const filteredInactiveGroups = activeFilter === "todos"
    ? inactiveGroups.filter((group) => !normalizedQuery || normalizeSearch(`${group.name} ${group.locationName ?? ""}`).includes(normalizedQuery))
    : [];
  const supervisorList = renderSupervisorCards(filteredSupervisors);
  const unassignedGroupList = filteredUnassignedGroups.map((group) => (
    <CompactGroupLink key={group.id} group={group} />
  ));
  const inactiveGroupList = filteredInactiveGroups.map((group) => (
    <InactiveGroupLink key={group.id} group={group} />
  ));
  const needsAttentionCount = team.summary.groupsNeedingAttentionCount;
  const hasPastoralRisk = team.summary.urgentCount > 0 || team.summary.pastoralCasesCount > 0;
  const navIndicator = hasPastoralRisk ? "risk" : needsAttentionCount > 0 ? "attention" : undefined;
  const isFiltered = Boolean(query) || activeFilter !== "todos";
  const canCreateGroup = canManageGroups(user);
  const savedMessage = savedParam === "celula-criada"
    ? "Célula criada."
    : savedParam === "celula-atualizada"
      ? "Célula atualizada."
      : null;

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: navIndicator })}
    >
      <div className="team-page">
        <div className="team-page-header flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="team-title">Equipe</h2>
            <p className="team-description">
              Supervisores e células em ordem de atenção pastoral, com presença baixa destacada sem duplicar listas.
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

        {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

        <div className="team-summary-block">
          <SectionTitle>Resumo</SectionTitle>
          <ContextSummary
            variant="balanced"
            items={[
              {
                label: "Supervisores",
                value: String(team.summary.supervisorsCount),
                detail: "Equipe que acompanha líderes e células.",
                tone: "neutral",
              },
              {
                label: "Células ativas",
                value: String(team.summary.groupsCount),
                detail: "Estrutura visível para cuidado pastoral.",
                tone: "neutral",
              },
              {
                label: "Pedem atenção",
                value: String(needsAttentionCount),
                detail: needsAttentionCount > 0
                  ? "Por casos pastorais ou presença baixa registrada."
                  : "Sem caso pastoral ou presença baixa para destacar agora.",
                tone: needsAttentionCount > 0 ? "warn" : "ok",
              },
              {
                label: "Sem presença recente",
                value: String(team.summary.groupsWithoutPresenceCount),
                detail: team.summary.groupsWithoutPresenceCount > 0
                  ? "Ainda não há presença recente registrada. Talvez o encontro tenha acontecido, mas a presença ainda não foi marcada."
                  : "Todas têm presença recente registrada.",
                tone: team.summary.groupsWithoutPresenceCount > 0 ? "neutral" : "ok",
              },
            ]}
          />
        </div>

        <section id={SUPERVISORS_SECTION_ID} className="scroll-mt-4">
          <SectionTitle detail="Busque e filtre supervisores e células listadas abaixo.">Estrutura da equipe</SectionTitle>
          <TeamStructureSearch query={query} filter={activeFilter} sectionId={SUPERVISORS_SECTION_ID} />
        </section>

        <section>
          <SectionTitle detail="Resumo por supervisor, priorizando casos pastorais e presença baixa.">Supervisores</SectionTitle>
          {supervisorList.length > 0 ? (
            <ProgressiveList
              initialCount={SUPERVISOR_SECTION_LIMIT}
              step={SUPERVISOR_SECTION_LIMIT}
              moreLabel="Ver mais supervisores"
              lessLabel="Mostrar menos supervisores"
            >
              {supervisorList}
            </ProgressiveList>
          ) : (
            <EmptyState>
              {isFiltered ? "Nenhum supervisor ou célula encontrado nesse recorte." : "Nenhum supervisor cadastrado para esta igreja."}
            </EmptyState>
          )}
        </section>

        {unassignedGroupList.length > 0 ? (
          <section>
            <SectionTitle detail="Células ativas que ainda não têm supervisor vinculado.">Sem supervisor</SectionTitle>
            <ProgressiveList
              initialCount={SECTION_LIMIT}
              step={SECTION_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos células"
            >
              {unassignedGroupList}
            </ProgressiveList>
          </section>
        ) : null}

        {inactiveGroupList.length > 0 ? (
          <section>
            <SectionTitle detail="Fora das superfícies padrão, encontros e check-in. Abra para reativar ou ajustar dados básicos.">Células inativas</SectionTitle>
            <ProgressiveList
              initialCount={SECTION_LIMIT}
              step={SECTION_LIMIT}
              moreLabel="Ver mais células inativas"
              lessLabel="Mostrar menos células inativas"
            >
              {inactiveGroupList}
            </ProgressiveList>
          </section>
        ) : null}

        <SectionTitle>Consulta</SectionTitle>
        <InfoCard>
          Abra uma célula para ver liderança, membros e histórico de presença.
        </InfoCard>
      </div>
    </AppShell>
  );
}
