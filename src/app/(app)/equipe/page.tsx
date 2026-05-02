import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, EmptyState, InfoCard, PastoralListSection, SectionTitle, priorityCardClass } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { getPastorTeamOverview } from "@/features/dashboard/queries";
import { canUsePastorDashboard } from "@/features/permissions/permissions";
import type { SignalBadgeTone } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/text";

const SECTION_LIMIT = 4;
const SUPERVISOR_SECTION_LIMIT = 4;
const GROUPS_PER_SUPERVISOR_LIMIT = 3;

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

    if (groups.length === 0) return [];
    return [withFilteredGroups(supervisor, groups)];
  });
}

function teamFilterHref(filter: TeamFilter, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filter !== "todos") params.set("filtro", filter);

  const queryString = params.toString();
  return queryString ? `/equipe?${queryString}` : "/equipe";
}

function TeamStructureSearch({ query, filter }: { query: string; filter: TeamFilter }) {
  return (
    <section className="team-tools">
      <form action="/equipe" className="team-search-form">
        <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
        <input
          name="q"
          defaultValue={query}
          aria-label="Buscar supervisor ou célula"
          placeholder="Buscar supervisor ou célula..."
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
        {filter !== "todos" ? <input type="hidden" name="filtro" value={filter} /> : null}
        <button type="submit" className="team-search-submit">
          Buscar
        </button>
      </form>

      <div className="team-filter-row">
        {TEAM_FILTERS.map((option) => {
          const active = option.value === filter;

          return (
            <Link
              key={option.value}
              href={teamFilterHref(option.value, query)}
              className={cn(
                "team-filter-chip",
                active && "team-filter-chip-active",
              )}
            >
              {option.label}
            </Link>
          );
        })}
        {query || filter !== "todos" ? (
          <Link href="/equipe" className="team-filter-chip">
            Limpar
          </Link>
        ) : null}
      </div>
    </section>
  );
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

function SupervisorCard({ supervisor }: { supervisor: SupervisorTeam }) {
  const visibleGroups = supervisor.groups.slice(0, GROUPS_PER_SUPERVISOR_LIMIT);
  const hiddenGroups = supervisor.groups.slice(GROUPS_PER_SUPERVISOR_LIMIT);
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
            <p className="mt-0.5 truncate text-[13px] leading-snug text-[var(--color-text-secondary)]">{supervisor.email}</p>
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
                {visibleGroups.map((group) => (
                  <CompactGroupLink key={group.id} group={group} />
                ))}
                {hiddenGroups.length > 0 ? (
                  <details className="group/more">
                    <summary className="team-inline-action team-inline-action-secondary">
                      <span className="group-open/more:hidden">Ver mais células</span>
                      <span className="hidden group-open/more:inline">Mostrar menos células</span>
                    </summary>
                    <div className="team-cell-list mt-2">
                      {hiddenGroups.map((group) => (
                        <CompactGroupLink key={group.id} group={group} />
                      ))}
                    </div>
                  </details>
                ) : null}
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
  const team = await getPastorTeamOverview(user);
  const filteredSupervisors = filterSupervisors(team.supervisors, normalizedQuery, activeFilter);
  const filteredUnassignedGroups = filterGroups(team.unassignedGroups, normalizedQuery, activeFilter);
  const visibleSupervisors = filteredSupervisors.slice(0, SUPERVISOR_SECTION_LIMIT);
  const hiddenSupervisors = filteredSupervisors.slice(SUPERVISOR_SECTION_LIMIT);
  const visibleUnassignedGroups = filteredUnassignedGroups.slice(0, SECTION_LIMIT);
  const hiddenUnassignedGroups = filteredUnassignedGroups.slice(SECTION_LIMIT);
  const needsAttentionCount = team.summary.groupsNeedingAttentionCount;
  const isFiltered = Boolean(query) || activeFilter !== "todos";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      compactHeader
      nav={[
        { href: "/pastor", label: "Visão", icon: "home" },
        { href: "/equipe", label: "Equipe", icon: "people", active: true, attention: needsAttentionCount > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <div className="team-page">
        <h2 className="team-title">Equipe</h2>
        <p className="team-description">
          Supervisores e células em ordem de atenção pastoral, com presença baixa destacada sem duplicar listas.
        </p>

        <TeamStructureSearch query={query} filter={activeFilter} />

        <div className="team-summary-block">
          <SectionTitle>Resumo</SectionTitle>
          <ContextSummary
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

        <PastoralListSection
          title="Supervisores"
          detail="Resumo por supervisor, priorizando casos pastorais e presença baixa."
          emptyMessage={isFiltered ? "Nenhum supervisor ou célula encontrado nesse recorte." : "Nenhum supervisor cadastrado para esta igreja."}
          moreLabel="Ver mais supervisores"
          hiddenChildren={renderSupervisorCards(hiddenSupervisors)}
        >
          {renderSupervisorCards(visibleSupervisors)}
        </PastoralListSection>

        {filteredUnassignedGroups.length > 0 ? (
          <PastoralListSection
            title="Sem supervisor"
            detail="Células ativas que ainda não têm supervisor vinculado."
            moreLabel="Ver mais células"
            hiddenChildren={hiddenUnassignedGroups.map((group) => (
              <CompactGroupLink key={group.id} group={group} />
            ))}
          >
            {visibleUnassignedGroups.map((group) => (
              <CompactGroupLink key={group.id} group={group} />
            ))}
          </PastoralListSection>
        ) : null}

        <SectionTitle>Consulta</SectionTitle>
        <InfoCard>
          Abra uma célula para ver liderança, membros e histórico de presença.
        </InfoCard>
      </div>
    </AppShell>
  );
}
