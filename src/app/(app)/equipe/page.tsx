import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, EmptyState, GroupCard, InfoCard, PastoralListSection, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getPastorTeamOverview } from "@/features/dashboard/queries";
import { canUsePastorDashboard } from "@/features/permissions/permissions";
import type { SignalBadgeTone } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { initials } from "@/lib/text";

const SECTION_LIMIT = 4;
const GROUPS_PER_SUPERVISOR = 4;

type TeamOverview = Awaited<ReturnType<typeof getPastorTeamOverview>>;
type SupervisorTeam = TeamOverview["supervisors"][number];
type TeamGroup = SupervisorTeam["groups"][number];

function groupSubtitle(group: TeamGroup) {
  const membersLabel = `${group.membersCount} ${group.membersCount === 1 ? "membro" : "membros"}`;
  return `Liderança: ${group.leadershipName} · ${membersLabel}`;
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
    return `${supervisor.groupsNeedingAttentionCount} ${supervisor.groupsNeedingAttentionCount === 1 ? "célula pede" : "células pedem"} atenção por sinais ou presença.`;
  }

  return "Sem célula pedindo atenção agora.";
}

function supervisorBadgeTone(supervisor: SupervisorTeam): SignalBadgeTone {
  if (supervisor.urgentCount > 0 || supervisor.pastoralCasesCount > 0) return "risk";
  if (supervisor.groupsNeedingAttentionCount > 0) return "warn";
  return "neutral";
}

function SupervisorCard({ supervisor }: { supervisor: SupervisorTeam }) {
  const visibleGroups = supervisor.groups.slice(0, GROUPS_PER_SUPERVISOR);
  const hiddenGroups = supervisor.groups.slice(GROUPS_PER_SUPERVISOR);

  return (
    <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-sm font-bold text-[var(--color-avatar-text)]">
            {initials(supervisor.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text-primary)]">{supervisor.name}</p>
            <p className="mt-0.5 truncate text-sm text-[var(--color-text-secondary)]">{supervisor.email}</p>
          </div>
        </div>
        <Badge tone={supervisorBadgeTone(supervisor)}>
          {supervisor.groups.length} {supervisor.groups.length === 1 ? "célula" : "células"}
        </Badge>
      </div>

      <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {supervisorSummary(supervisor)}
      </p>

      <div className="mt-3 space-y-3">
        {visibleGroups.length > 0 ? visibleGroups.map(renderGroupCard) : (
          <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
        )}

        {hiddenGroups.length > 0 ? (
          <details className="group rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98] [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Ver mais células</span>
              <span className="hidden group-open:inline">Mostrar menos</span>
            </summary>
            <div className="mt-3 space-y-3">{hiddenGroups.map(renderGroupCard)}</div>
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
  const visibleSupervisors = team.supervisors.slice(0, SECTION_LIMIT);
  const hiddenSupervisors = team.supervisors.slice(SECTION_LIMIT);
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
        Veja quem acompanha quais células. A ordem prioriza onde há sinais, casos pastorais ou leitura de presença que pede atenção.
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
              ? "Por casos, sinais, ausência de registro ou presença baixa."
              : "Sem sinal ou presença baixa para destacar agora.",
            tone: needsAttentionCount > 0 ? "warn" : "ok",
          },
        ]}
      />

      <PastoralListSection
        title="Células que pedem atenção"
        detail="Casos pastorais vêm primeiro; depois pedidos, atenções locais e leitura de presença."
        emptyMessage="Nenhuma célula pede atenção agora."
        hiddenChildren={hiddenPriorityGroups.map(renderGroupCard)}
      >
        {visiblePriorityGroups.map(renderGroupCard)}
      </PastoralListSection>

      <PastoralListSection
        title="Supervisores"
        detail="A lista é ordenada pela pior situação pastoral das células acompanhadas; quando tudo está estável, segue por nome."
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
