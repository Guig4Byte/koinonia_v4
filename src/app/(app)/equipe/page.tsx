import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, EmptyState, GroupCard, InfoCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getPastorTeamOverview } from "@/features/dashboard/queries";
import { canUsePastorDashboard } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { initials } from "@/lib/text";

type TeamOverview = Awaited<ReturnType<typeof getPastorTeamOverview>>;
type SupervisorTeam = TeamOverview["supervisors"][number];
type TeamGroup = SupervisorTeam["groups"][number];

function groupSubtitle(group: TeamGroup) {
  return `${group.leaderName} · ${group.membersCount} ${group.membersCount === 1 ? "membro" : "membros"}`;
}

function SupervisorCard({ supervisor }: { supervisor: SupervisorTeam }) {
  const pastoralCasesCount = supervisor.groups.reduce((total, group) => total + group.pastoralCasesCount, 0);

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
        <Badge tone={pastoralCasesCount > 0 ? "risk" : "neutral"}>
          {supervisor.groups.length} {supervisor.groups.length === 1 ? "célula" : "células"}
        </Badge>
      </div>

      <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {pastoralCasesCount > 0
          ? `${pastoralCasesCount} ${pastoralCasesCount === 1 ? "caso pastoral" : "casos pastorais"} sob esta supervisão.`
          : "Sem caso pastoral destacado nesta supervisão agora."}
      </p>

      <div className="mt-3 space-y-3">
        {supervisor.groups.length > 0 ? supervisor.groups.map((group) => (
          <GroupCard
            key={group.id}
            name={group.name}
            subtitle={groupSubtitle(group)}
            presenceRate={group.presenceRate}
            attentionCount={group.pastoralCasesCount}
            attentionLabelKind="pastoral"
            href={`/celulas/${group.id}`}
            hasPresenceData={group.hasPresenceData}
          />
        )) : (
          <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
        )}
      </div>
    </section>
  );
}

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!canUsePastorDashboard(user)) {
    redirect("/");
  }

  const team = await getPastorTeamOverview(user);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/pastor", label: "Visão", icon: "home" },
        { href: "/equipe", label: "Equipe", icon: "people", active: true, attention: team.summary.pastoralCasesCount > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder="Buscar qualquer pessoa..." />

      <h2 className="mb-2 text-2xl font-semibold text-[var(--color-text-primary)]">Equipe</h2>
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        Veja quem acompanha quais células. A busca continua sendo o caminho para consultar uma pessoa específica.
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
            label: "Casos pastorais",
            value: String(team.summary.pastoralCasesCount),
            detail: "Urgentes ou encaminhados ao cuidado pastoral.",
            tone: team.summary.pastoralCasesCount > 0 ? "risk" : "ok",
          },
        ]}
      />

      <SectionTitle detail="Células agrupadas por quem acompanha os líderes.">Supervisores</SectionTitle>
      <div className="space-y-3">
        {team.supervisors.length > 0 ? team.supervisors.map((supervisor) => (
          <SupervisorCard key={supervisor.id} supervisor={supervisor} />
        )) : (
          <EmptyState>Nenhum supervisor cadastrado para esta igreja.</EmptyState>
        )}
      </div>

      {team.unassignedGroups.length > 0 ? (
        <>
          <SectionTitle detail="Células ativas que ainda não têm supervisor vinculado.">Sem supervisor</SectionTitle>
          <div className="space-y-3">
            {team.unassignedGroups.map((group) => (
              <GroupCard
                key={group.id}
                name={group.name}
                subtitle={groupSubtitle(group)}
                presenceRate={group.presenceRate}
                attentionCount={group.pastoralCasesCount}
                attentionLabelKind="pastoral"
                href={`/celulas/${group.id}`}
                hasPresenceData={group.hasPresenceData}
              />
            ))}
          </div>
        </>
      ) : null}

      <SectionTitle>Consulta</SectionTitle>
      <InfoCard>
        Esta tela mostra a estrutura de cuidado. Para abrir o perfil de alguém, use a busca ou entre na célula correspondente.
      </InfoCard>
    </AppShell>
  );
}
