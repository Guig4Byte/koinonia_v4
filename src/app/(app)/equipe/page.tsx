import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, EmptyState, GroupCard, InfoCard, PastoralListSection, SectionTitle, priorityCardClass } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getPastorTeamOverview } from "@/features/dashboard/queries";
import { canUsePastorDashboard } from "@/features/permissions/permissions";
import type { SignalBadgeTone } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/text";

const SECTION_LIMIT = 4;
const SUPERVISOR_SECTION_LIMIT = 6;
const HIGHLIGHTED_GROUPS_PER_SUPERVISOR = 2;

type TeamOverview = Awaited<ReturnType<typeof getPastorTeamOverview>>;
type SupervisorTeam = TeamOverview["supervisors"][number];
type TeamGroup = SupervisorTeam["groups"][number];

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
  if (group.supportRequestsCount > 0) return "support";
  if (group.localAttentionCount > 0) return "warn";
  if (!group.hasPresenceData) return "neutral";
  if (group.presenceRate < 70) return "warn";
  return "ok";
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
      badgeLabel={group.statusLabel}
      badgeTone={groupBadgeTone(group)}
    />
  );
}

function supervisorSummary(supervisor: SupervisorTeam) {
  if (supervisor.urgentCount > 0) {
    return `${supervisor.urgentCount} ${supervisor.urgentCount === 1 ? "urgente" : "urgentes"} sob esta supervisão.`;
  }

  if (supervisor.pastoralCasesCount > 0) {
    return `${supervisor.pastoralCasesCount} ${supervisor.pastoralCasesCount === 1 ? "caso pastoral" : "casos pastorais"} sob esta supervisão.`;
  }

  if (supervisor.groupsNeedingAttentionCount > 0) {
    return `${supervisor.groupsNeedingAttentionCount} ${supervisor.groupsNeedingAttentionCount === 1 ? "célula pede" : "células pedem"} atenção por sinais ou presença baixa registrada.`;
  }

  if (supervisor.groupsWithoutPresenceCount > 0) {
    return `${supervisor.groupsWithoutPresenceCount} ${supervisor.groupsWithoutPresenceCount === 1 ? "célula está" : "células estão"} sem presença recente registrada.`;
  }

  return "Sem célula pedindo atenção agora.";
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
        <Badge tone={tone}>{group.statusLabel}</Badge>
        <span className="text-sm font-bold text-[var(--color-brand)] opacity-60" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

function SupervisorCard({ supervisor }: { supervisor: SupervisorTeam }) {
  const priorityGroups = supervisor.groups.filter((group) => group.pastoralPriorityScore > 0);
  const stableGroups = supervisor.groups.filter((group) => group.pastoralPriorityScore <= 0);
  const highlightedGroups = priorityGroups.slice(0, HIGHLIGHTED_GROUPS_PER_SUPERVISOR);
  const expandedPriorityGroups = priorityGroups.slice(HIGHLIGHTED_GROUPS_PER_SUPERVISOR);
  const remainingPriorityCount = Math.max(priorityGroups.length - highlightedGroups.length, 0);
  const expandedGroups = [...expandedPriorityGroups, ...stableGroups];
  const hasGroups = supervisor.groups.length > 0;
  const hasExpandedGroups = expandedGroups.length > 0;
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
        {highlightedGroups.length > 0 ? highlightedGroups.map((group) => (
          <CompactGroupLink key={group.id} group={group} emphasized />
        )) : hasGroups ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Sem célula pedindo atenção agora.
          </p>
        ) : (
          <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
        )}

        {remainingPriorityCount > 0 ? (
          <p className="px-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Mais {remainingPriorityCount} {remainingPriorityCount === 1 ? "célula pede" : "células pedem"} atenção.
          </p>
        ) : null}

        {hasExpandedGroups ? (
          <details className="group rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98] [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Ver células acompanhadas</span>
              <span className="hidden group-open:inline">Mostrar menos</span>
            </summary>
            <div className="mt-3 space-y-2">
              {expandedGroups.map((group) => (
                <CompactGroupLink key={group.id} group={group} />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
}

function renderSupervisorCards(supervisors: SupervisorTeam[]) {
  return supervisors.map((supervisor) => (
    <SupervisorCard key={supervisor.id} supervisor={supervisor} />
  ));
}

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!canUsePastorDashboard(user)) {
    redirect("/");
  }

  const team = await getPastorTeamOverview(user);
  const visiblePriorityGroups = team.priorityGroups.slice(0, SECTION_LIMIT);
  const hiddenPriorityGroups = team.priorityGroups.slice(SECTION_LIMIT);
  const visibleReadingPendingGroups = team.readingPendingGroups.slice(0, SECTION_LIMIT);
  const hiddenReadingPendingGroups = team.readingPendingGroups.slice(SECTION_LIMIT);
  const visibleSupervisors = team.supervisors.slice(0, SUPERVISOR_SECTION_LIMIT);
  const hiddenSupervisors = team.supervisors.slice(SUPERVISOR_SECTION_LIMIT);
  const visibleUnassignedGroups = team.unassignedGroups.slice(0, SECTION_LIMIT);
  const hiddenUnassignedGroups = team.unassignedGroups.slice(SECTION_LIMIT);
  const needsAttentionCount = team.summary.groupsNeedingAttentionCount;

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
      <SearchBox placeholder="Buscar qualquer pessoa..." />

      <h2 className="mb-2 text-2xl font-semibold text-[var(--color-text-primary)]">Equipe</h2>
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        Veja quem acompanha quais células. A ordem prioriza casos, sinais e presença baixa registrada; quando falta registro, a célula aparece como “Sem presença recente”.
      </p>

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
              ? "Por casos, sinais ou presença baixa registrada."
              : "Sem sinal ou presença baixa para destacar agora.",
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
        title="Células que pedem atenção"
        detail="Casos pastorais vêm primeiro; depois pedidos, atenções locais e presença baixa com dado registrado."
        emptyMessage="Nenhuma célula pede atenção agora."
        hiddenChildren={hiddenPriorityGroups.map(renderGroupCard)}
      >
        {visiblePriorityGroups.map(renderGroupCard)}
      </PastoralListSection>

      {team.readingPendingGroups.length > 0 ? (
        <PastoralListSection
          title="Sem presença recente"
          detail="Ainda não há presença recente registrada. Talvez o encontro tenha acontecido, mas a presença ainda não foi marcada."
          moreLabel="Ver mais células"
          hiddenChildren={hiddenReadingPendingGroups.map(renderGroupCard)}
        >
          {visibleReadingPendingGroups.map(renderGroupCard)}
        </PastoralListSection>
      ) : null}

      <PastoralListSection
        title="Supervisores"
        detail="Resumo por supervisor, com prioridade pastoral antes da estrutura completa."
        emptyMessage="Nenhum supervisor cadastrado para esta igreja."
        moreLabel="Ver mais supervisores"
        hiddenChildren={renderSupervisorCards(hiddenSupervisors)}
      >
        {renderSupervisorCards(visibleSupervisors)}
      </PastoralListSection>

      {team.unassignedGroups.length > 0 ? (
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
        Esta tela mostra a estrutura de cuidado. Para abrir o perfil de alguém, use a busca ou entre na célula correspondente.
      </InfoCard>
    </AppShell>
  );
}
