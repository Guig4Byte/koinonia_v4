import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, EmptyState, GroupCard, InfoCard, SectionTitle } from "@/components/cards";
import { ProgressiveList } from "@/components/progressive-list";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { groupAttentionLabel, type SignalBadge } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";

const SECTION_LIMIT = 4;
const LOW_PRESENCE_THRESHOLD = 70;

type CellsFilter = "todos" | "atencao" | "sem-presenca";

type CellsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SupervisorDashboard = Awaited<ReturnType<typeof getSupervisorDashboard>>;
type SupervisorGroup = SupervisorDashboard["groups"][number];

const CELLS_FILTERS: Array<{ value: CellsFilter; label: string }> = [
  { value: "todos", label: "Todas" },
  { value: "atencao", label: "Pedem atenção" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

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

function readCellsFilter(value: string): CellsFilter {
  return CELLS_FILTERS.some((filter) => filter.value === value) ? value as CellsFilter : "todos";
}

function groupSearchText(group: SupervisorGroup) {
  return normalizeSearch(`${group.name} ${group.leader?.name ?? ""}`);
}

function urgentCount(group: SupervisorGroup) {
  return group.signals.filter((signal) => signal.severity === "URGENT").length;
}

function pastoralEscalatedCount(group: SupervisorGroup) {
  return group.signals.filter((signal) => signal.assignedTo?.role === "PASTOR" || signal.assignedTo?.role === "ADMIN").length;
}

function riskCount(group: SupervisorGroup) {
  return group.signals.filter((signal) => signal.severity === "URGENT" || signal.assignedTo?.role === "PASTOR" || signal.assignedTo?.role === "ADMIN").length;
}

function hasLowPresence(group: SupervisorGroup) {
  return group.hasPresenceData && group.presenceRate < LOW_PRESENCE_THRESHOLD;
}

function groupNeedsAttention(group: SupervisorGroup) {
  return riskCount(group) > 0 || group.supportRequestsCount > 0 || group.attentionCount > 0 || hasLowPresence(group);
}

function groupPriorityScore(group: SupervisorGroup) {
  const risk = riskCount(group);
  const support = group.supportRequestsCount;
  const localAttention = Math.max(group.attentionCount - risk - support, 0);
  const lowPresenceScore = hasLowPresence(group) ? LOW_PRESENCE_THRESHOLD - group.presenceRate : 0;
  const noPresenceScore = group.hasPresenceData ? 0 : 25;

  return risk * 1000 + support * 700 + localAttention * 400 + lowPresenceScore + noPresenceScore;
}

function compareGroups(left: SupervisorGroup, right: SupervisorGroup) {
  const scoreDifference = groupPriorityScore(right) - groupPriorityScore(left);
  if (scoreDifference !== 0) return scoreDifference;

  return left.name.localeCompare(right.name, "pt-BR");
}

function groupMatchesFilter(group: SupervisorGroup, filter: CellsFilter) {
  if (filter === "atencao") return groupNeedsAttention(group);
  if (filter === "sem-presenca") return !group.hasPresenceData;
  return true;
}

function filterGroups(groups: SupervisorGroup[], normalizedQuery: string, filter: CellsFilter) {
  return groups
    .filter((group) => groupMatchesFilter(group, filter))
    .filter((group) => !normalizedQuery || groupSearchText(group).includes(normalizedQuery))
    .sort(compareGroups);
}

function cellsFilterHref(filter: CellsFilter, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filter !== "todos") params.set("filtro", filter);

  const queryString = params.toString();
  return queryString ? `/celulas?${queryString}` : "/celulas";
}

function CellsStructureSearch({ query, filter }: { query: string; filter: CellsFilter }) {
  return (
    <section className="team-tools">
      <form action="/celulas" className="team-search-form">
        <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
        <input
          name="q"
          defaultValue={query}
          aria-label="Buscar célula ou liderança"
          placeholder="Buscar célula ou liderança..."
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
        {filter !== "todos" ? <input type="hidden" name="filtro" value={filter} /> : null}
        <button type="submit" className="team-search-submit">
          Buscar
        </button>
      </form>

      <div className="team-filter-row">
        {CELLS_FILTERS.map((option) => {
          const active = option.value === filter;

          return (
            <Link
              key={option.value}
              href={cellsFilterHref(option.value, query)}
              className={cn("team-filter-chip", active && "team-filter-chip-active")}
            >
              {option.label}
            </Link>
          );
        })}
        {query || filter !== "todos" ? (
          <Link href="/celulas" className="team-filter-chip">
            Limpar
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function groupBadge(group: SupervisorGroup): SignalBadge | null {
  const urgent = urgentCount(group);
  const escalated = pastoralEscalatedCount(group);

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
  const leadership = group.leader?.name ?? "Liderança não informada";
  const membersLabel = `${group.memberships.length} ${group.memberships.length === 1 ? "membro" : "membros"}`;
  const supportText = group.supportRequestsCount > 0
    ? ` · ${group.supportRequestsCount} ${group.supportRequestsCount === 1 ? "pedido de apoio" : "pedidos de apoio"}`
    : "";
  const careText = group.inCareCount > 0 ? ` · ${group.inCareCount} em cuidado` : "";

  return `${leadership} · ${membersLabel}${supportText}${careText}`;
}

function renderGroups(groups: SupervisorGroup[]) {
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
        href={`/celulas/${group.id}`}
        hasPresenceData={group.hasPresenceData}
        noPresenceLabel="Sem presença recente"
      />
    );
  });
}

export default async function CellsPage({ searchParams }: CellsPageProps) {
  const user = await getCurrentUser();

  if (!canUseSupervisorDashboard(user)) {
    redirect(user.role === "PASTOR" || user.role === "ADMIN" ? "/equipe" : user.role === "LEADER" ? "/pessoas" : "/");
  }

  const params = searchParams ? await searchParams : {};
  const query = firstParam(params.q).trim();
  const normalizedQuery = normalizeSearch(query);
  const activeFilter = readCellsFilter(firstParam(params.filtro));
  const dashboard = await getSupervisorDashboard(user);
  const groups = filterGroups(dashboard.groups, normalizedQuery, activeFilter);
  const groupCards = renderGroups(groups);
  const groupsNeedingAttentionCount = dashboard.groups.filter(groupNeedsAttention).length;
  const groupsWithoutPresenceCount = dashboard.groups.filter((group) => !group.hasPresenceData).length;
  const hasRisk = dashboard.groups.some((group) => riskCount(group) > 0);
  const hasCare = dashboard.groups.some((group) => group.inCareCount > 0);
  const navIndicator = hasRisk ? "risk" : groupsNeedingAttentionCount > 0 ? "attention" : hasCare ? "care" : undefined;
  const isFiltered = Boolean(query) || activeFilter !== "todos";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      compactHeader
      nav={[
        { href: "/supervisor", label: "Visão", icon: "home" },
        { href: "/celulas", label: "Células", icon: "people", active: true, indicator: navIndicator },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <div className="team-page">
        <h2 className="team-title">Células</h2>
        <p className="team-description">
          Acompanhe as células sob sua supervisão sem duplicar os sinais de pessoas da Visão.
        </p>

        <CellsStructureSearch query={query} filter={activeFilter} />

        <ContextSummary
          items={[
            {
              label: "Células acompanhadas",
              value: String(dashboard.groups.length),
              detail: "Sob sua supervisão.",
              tone: "neutral",
            },
            {
              label: "Pedem atenção",
              value: String(groupsNeedingAttentionCount),
              detail: groupsNeedingAttentionCount > 0
                ? "Por pedido de apoio, atenção local ou presença baixa registrada."
                : "Nenhuma célula pedindo atenção agora.",
              tone: groupsNeedingAttentionCount > 0 ? "warn" : "ok",
            },
            {
              label: "Sem presença recente",
              value: String(groupsWithoutPresenceCount),
              detail: groupsWithoutPresenceCount > 0
                ? "Talvez o encontro tenha acontecido, mas a presença ainda não foi marcada."
                : "Todas têm presença recente registrada.",
              tone: groupsWithoutPresenceCount > 0 ? "neutral" : "ok",
            },
          ]}
        />

        <section>
          <SectionTitle detail="Use os filtros para ver células com atenção ou sem presença recente.">Células supervisionadas</SectionTitle>
          {groupCards.length > 0 ? (
            <ProgressiveList
              initialCount={SECTION_LIMIT}
              step={SECTION_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos células"
            >
              {groupCards}
            </ProgressiveList>
          ) : (
            <EmptyState>
              {isFiltered ? "Nenhuma célula encontrada nesse recorte." : "Nenhuma célula ativa vinculada à sua supervisão."}
            </EmptyState>
          )}
        </section>

        <SectionTitle>Consulta</SectionTitle>
        <InfoCard>
          Abra uma célula para ver liderança, membros e histórico de presença. Os pedidos de apoio e pessoas em atenção continuam priorizados na Visão.
        </InfoCard>
      </div>
    </AppShell>
  );
}
