import { redirect } from "next/navigation";
import { MembershipRole, PersonStatus, SignalSeverity, UserRole } from "../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { InfoCard, PersonMiniCard, SectionTitle } from "@/components/cards";
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
  const isLeader = user.role === UserRole.LEADER;
  const isSupervisor = user.role === UserRole.SUPERVISOR;
  const isPastoralOverview = user.role === UserRole.PASTOR || user.role === UserRole.ADMIN;

  if (isPastoralOverview) {
    redirect("/equipe");
  }

  if (isSupervisor) {
    redirect("/celulas");
  }
  const homeHref = isLeader ? "/lider" : user.role === UserRole.SUPERVISOR ? "/supervisor" : "/pastor";
  const peopleLabel = isLeader ? "Membros" : "Pessoas";
  const searchPlaceholder = isLeader
    ? "Buscar membro..."
    : user.role === UserRole.SUPERVISOR
      ? "Buscar pessoa nas suas células..."
      : "Buscar qualquer pessoa...";

  const memberMembershipWhere = {
    ...getVisibleMembershipWhere(user),
    role: { not: MembershipRole.VISITOR },
  };

  const visibleOpenSignalWhere = getVisibleOpenSignalWhere(user);
  const pastorSignalWhere = isPastoralOverview
    ? {
        AND: [
          visibleOpenSignalWhere,
          {
            OR: [
              { severity: SignalSeverity.URGENT },
              { assignedTo: { is: { role: { in: [UserRole.PASTOR, UserRole.ADMIN] } } } },
            ],
          },
        ],
      }
    : visibleOpenSignalWhere;

  const inCareWhere = isPastoralOverview
    ? {
        AND: [
          getVisiblePersonWhere(user),
          { status: PersonStatus.COOLING_AWAY },
          { memberships: { some: memberMembershipWhere } },
          {
            careTouches: {
              some: { actor: { is: { role: { in: [UserRole.PASTOR, UserRole.ADMIN] } } } },
            },
          },
        ],
      }
    : {
        AND: [
          getVisiblePersonWhere(user),
          { status: PersonStatus.COOLING_AWAY },
          { memberships: { some: memberMembershipWhere } },
        ],
      };

  const [openSignals, visibleMembers, inCarePeople] = await Promise.all([
    prisma.careSignal.findMany({
      where: pastorSignalWhere,
      include: { person: true, assignedTo: true, group: { include: { leader: true } } },
      orderBy: { detectedAt: "desc" },
      take: 80,
    }),
    isLeader
      ? prisma.person.findMany({
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
        })
      : Promise.resolve([]),
    prisma.person.findMany({
      where: inCareWhere,
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
  const urgentSignals = pastoralSections.urgentOrPastoralCases;
  const supportSignals = pastoralSections.supportRequests;
  const attentionSignals = pastoralSections.localAttention;
  const scopedInCarePeople = pastoralSections.inCarePeople;
  const navIndicator = urgentSignals.length > 0 ? "risk" : attentionPeople.length > 0 ? "attention" : scopedInCarePeople.length > 0 ? "care" : undefined;
  const visibleMemberList = visibleMembers.slice(0, MEMBER_LIST_LIMIT);
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const emptyAttentionMessage = isLeader
    ? "Nenhum membro da sua célula está em atenção agora."
    : isPastoralOverview
      ? "Nenhum caso pastoral urgente ou encaminhado agora. Use a busca para consultar uma pessoa específica."
      : "Nenhuma pessoa em atenção agora.";



  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: homeHref, label: "Visão", icon: "home" },
        { href: "/pessoas", label: peopleLabel, icon: "people", active: true, indicator: navIndicator },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder={searchPlaceholder} />

      <PastoralSignalSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem primeiro."
        emptyMessage={emptyAttentionMessage}
        signals={urgentSignals}
        viewer={user}
      />

      {!isPastoralOverview ? (
        <>
          <PastoralSignalSection
            title="Pedidos de apoio"
            detail="Casos trazidos para apoio de supervisão, sem virar obrigação administrativa."
            emptyMessage="Nenhum pedido de apoio agora."
            signals={supportSignals}
            viewer={user}
          />

          <PastoralSignalSection
            title="Acompanhar de perto"
            detail="Atenções locais que merecem contato simples."
            emptyMessage="Nenhuma outra pessoa em atenção agora."
            signals={attentionSignals}
            viewer={user}
          />
        </>
      ) : null}

      <InCareSection
        title={isPastoralOverview ? "Acolhidos em cuidado pastoral" : "Acolhidos em cuidado"}
        detail={isPastoralOverview ? "Pessoas que receberam cuidado pastoral e seguem no radar." : "Pessoas que já receberam cuidado e seguem no radar."}
        emptyMessage={isPastoralOverview ? "Nenhuma pessoa em cuidado pastoral agora." : "Nenhuma pessoa em cuidado agora."}
        people={scopedInCarePeople}
      />

      {isLeader ? (
        <>
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
        </>
      ) : (
        <>
          <SectionTitle>Consulta</SectionTitle>
          <InfoCard>
            {isPastoralOverview
              ? "Esta tela destaca casos pastorais e cuidados pastorais recentes. A atenção local continua com líderes e supervisores; use a busca para consultar uma pessoa específica."
              : "As seções acima mostram quem merece atenção. Para consultar outra pessoa dentro da sua responsabilidade, use a busca pelo nome."}
          </InfoCard>
        </>
      )}
    </AppShell>
  );
}
