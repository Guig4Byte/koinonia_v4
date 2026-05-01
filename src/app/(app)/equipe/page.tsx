import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, EmptyState, GroupCard, InfoCard, PastoralListSection, SectionTitle, priorityCardClass } from "@/components/cards";
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
    <section className="mb-4 space-y-3">
      <form action="/equipe" className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-4 shadow-card">
        <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Buscar supervisor ou célula..."
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
        {filter !== "todos" ? <input type="hidden" name="filtro" value={filter} /> : null}
        <button type="submit" className="rounded-xl bg-[var(--color-btn-secondary-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-btn-secondary-text)]">
          Buscar
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEAM_FILTERS.map((option) => {
          const active = option.value === filter;

          return (
            <Link
              key={option.value}
              href={teamFilterHref(option.value, query)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98]",
                active
                  ? "border-[var(--color-brand)] bg-[var(--metric-card-bg)] text-[var(--color-brand)]"
                  : "border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[var(--color-text-secondary)]",
              )}
            >
              {option.label}
            </Link>
          );
        })}
        {query || filter !== "todos" ? (
          <Link href="/equipe" className="shrink-0 rounded-full border border-[var(--color-border-card)] bg-transparent px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition active:scale-[0.98]">
            Limpar
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function groupSubtitle(group: TeamGroup) {
  const membersLabel = `${group.membersCount} ${group.membersCount === 1 ? "membro" : "membros"}`;
  return `Liderança: ${group.leadershipName} · ${membersLabel}`;
}

function compactGroupSubtitle(group: TeamGroup) {
  const membersLabel = `${group.membersCount} ${group.membersCount === 1 ? "membro" : "membros"}`;
  const presenceLabel = group.hasPresenceData ? `${group.presenceRate}% presença` : "Sem presença recente registrada";
  return `${group.leadershipName} · ${membersLabel} · ${presenceLabel}`;
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

function renderGroupCard(group: TeamGroup) {
  return (
    <GroupCard
      key={group.id}
      name={group.name}
      subtitle={groupSubtitle(group)}
      presenceRate={group.presenceRate}
      attentionCount={group.pastoralCasesCount}
      attentionLabelKind="pastoral"
      href={`/celulas/${group.id}`}
      hasPresenceData={group.hasPresenceData}
      noPresenceLabel="Sem presença recente"
      badgeLabel={shouldShowGroupBadge(group) ? group.statusLabel : undefined}
      badgeTone={groupBadgeTone(group)}
      showBadge={shouldShowGroupBadge(group)}
    />
  );
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
  if (supervisor.groupsNeedingAttentionCount > 0) return "warn";
  return "neutral";
}

function CompactGroupLink({ group, emphasized = false }: { group: TeamGroup; emphasized?: boolean }) {
  const tone = groupBadgeTone(group);

  return (
    <Link
      href={`/celulas/${group.id}`}
      className={cn(
        "flex min-h-[3.6rem] items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-3 py-2.5 transition active:scale-[0.99]",
        emphasized && priorityCardClass(tone),
      )}
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
    <section className={cn("rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card", priorityCardClass(badgeTone))}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-sm font-bold text-[var(--color-avatar-text)]">
            {initials(supervisor.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text-primary)]">{supervisor.name}</p>
            <p className="mt-0.5 truncate text-sm text-[var(--color-text-secondary)]">{supervisor.email}</p>
          </div>
        </div>
        <Badge tone={badgeTone}>
          {supervisor.groups.length} {supervisor.groups.length === 1 ? "célula" : "células"}
        </Badge>
      </div>

      <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {supervisorSummary(supervisor)}
      </p>

      <div className="mt-3 space-y-2">
        {!hasGroups ? (
          <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
        ) : (
          <details className="group rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98] [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Ver células acompanhadas</span>
              <span className="hidden group-open:inline">Mostrar menos</span>
            </summary>
            <div className="mt-3 space-y-2">
              {visibleGroups.map((group) => (
                <CompactGroupLink key={group.id} group={group} emphasized={group.pastoralPriorityScore > 0} />
              ))}
              {hiddenGroups.length > 0 ? (
                <details className="group/more rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98] [&::-webkit-details-marker]:hidden">
                    <span className="group-open/more:hidden">Ver mais células</span>
                    <span className="hidden group-open/more:inline">Mostrar menos células</span>
                  </summary>
                  <div className="mt-3 space-y-2">
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
      nav={[
        { href: "/pastor", label: "Visão", icon: "home" },
        { href: "/equipe", label: "Equipe", icon: "people", active: true, attention: needsAttentionCount > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <h2 className="mb-2 text-2xl font-semibold text-[var(--color-text-primary)]">Equipe</h2>
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        Veja quem acompanha quais células. A ordem prioriza casos pastorais e presença baixa registrada; pedidos de apoio à supervisão permanecem no cuidado da supervisão.
      </p>

      <TeamStructureSearch query={query} filter={activeFilter} />

      <SectionTitle detail="Use os filtros para focar em células que pedem atenção ou estão sem presença recente, sem duplicar listas fora da estrutura da equipe.">
        Resumo da equipe
      </SectionTitle>
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

      <PastoralListSection
        title="Supervisores"
        detail="Quem acompanha cada célula. Use os filtros acima para ver apenas células que pedem atenção ou estão sem presença recente."
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
          hiddenChildren={hiddenUnassignedGroups.map(renderGroupCard)}
        >
          {visibleUnassignedGroups.map(renderGroupCard)}
        </PastoralListSection>
      ) : null}

      <SectionTitle>Consulta</SectionTitle>
      <InfoCard>
        Esta tela mostra a estrutura de cuidado. Para abrir o perfil de alguém, use a busca da Visão ou entre na célula correspondente.
      </InfoCard>
    </AppShell>
  );
}
