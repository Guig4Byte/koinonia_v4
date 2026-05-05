import { redirect } from "next/navigation";
import { MembershipRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { PersonMiniCard, SectionTitle } from "@/components/cards";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { SearchBox } from "@/components/search-box";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

const MEMBER_LIST_LIMIT = 24;

export default async function PeoplePage() {
  const user = await getCurrentUser();

  if (user.role === UserRole.SUPERVISOR) {
    redirect("/celulas");
  }

  if (user.role === UserRole.PASTOR || user.role === UserRole.ADMIN) {
    redirect("/equipe");
  }

  const memberMembershipWhere = {
    ...getVisibleMembershipWhere(user),
    role: { not: MembershipRole.VISITOR },
  };

  const [openSignals, visibleMembers, inCarePeople] = await Promise.all([
    prisma.careSignal.findMany({
      where: getVisibleOpenSignalWhere(user),
      include: { person: true, assignedTo: true, group: { include: { leader: true } } },
      orderBy: { detectedAt: "desc" },
      take: 80,
    }),
    prisma.person.findMany({
      where: {
        AND: [
          getVisiblePersonWhere(user),
          { memberships: { some: memberMembershipWhere } },
        ],
      },
      include: {
        memberships: {
          where: memberMembershipWhere,
          include: { group: true },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
      take: 80,
    }),
    prisma.person.findMany({
      where: {
        AND: [
          getVisiblePersonWhere(user),
          { status: PersonStatus.COOLING_AWAY },
          { memberships: { some: memberMembershipWhere } },
        ],
      },
      include: {
        memberships: {
          where: memberMembershipWhere,
          include: { group: true },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
  ]);

  const pastoralSections = splitPastoralSections({
    signals: openSignals,
    inCarePeople,
    viewer: user,
  });
  const attentionPeople = [
    ...pastoralSections.urgentOrPastoralCases,
    ...pastoralSections.supportRequests,
    ...pastoralSections.localAttention,
  ];
  const navIndicator = attentionPeople.length > 0
    ? "attention"
    : pastoralSections.inCarePeople.length > 0
      ? "care"
      : undefined;
  const visibleMemberList = visibleMembers.slice(0, MEMBER_LIST_LIMIT);
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: navIndicator })}
    >
      <SearchBox placeholder="Buscar membro..." />

      <PastoralSignalSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem primeiro."
        emptyMessage="Nenhum membro da sua célula está em atenção agora."
        signals={pastoralSections.urgentOrPastoralCases}
        viewer={user}
      />

      <PastoralSignalSection
        title="Pedidos de apoio"
        detail="Casos trazidos para apoio de supervisão, sem virar obrigação administrativa."
        emptyMessage="Nenhum pedido de apoio agora."
        signals={pastoralSections.supportRequests}
        viewer={user}
      />

      <PastoralSignalSection
        title="Acompanhar de perto"
        detail="Atenções locais que merecem contato simples."
        emptyMessage="Nenhuma outra pessoa em atenção agora."
        signals={pastoralSections.localAttention}
        viewer={user}
      />

      <InCareSection
        title="Acolhidos em cuidado"
        detail="Pessoas que já receberam cuidado e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado agora."
        people={pastoralSections.inCarePeople}
      />

      <SectionTitle detail="Lista curta para consulta rápida. Para encontrar alguém fora dos primeiros nomes, use a busca.">Membros da célula</SectionTitle>
      <div className="space-y-2">
        {visibleMemberList.map((person) => {
          const attentionSignal = attentionSignalByPersonId.get(person.id);
          const badge = personEffectiveBadgeForViewer(person, attentionSignal, user);

          return (
            <PersonMiniCard
              key={person.id}
              href={`/pessoas/${person.id}`}
              initials={initials(person.fullName)}
              name={person.fullName}
              context={person.memberships[0]?.group.name ?? "Sua célula"}
              badgeLabel={badge.label}
              badgeTone={badge.tone}
            />
          );
        })}
      </div>
    </AppShell>
  );
}
