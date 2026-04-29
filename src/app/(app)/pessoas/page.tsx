import Link from "next/link";
import { MembershipRole, PersonStatus, SignalSeverity, UserRole } from "../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { PastoralListSection, PersonSignalCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson } from "@/features/signals/attention";
import { signalBadgeForViewer, signalReasonForViewer } from "@/features/signals/display";
import { isInCarePerson, isSupportRequest, isUrgentOrPastoralCase } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

const SECTION_LIMIT = 4;
const MEMBER_LIST_LIMIT = 24;

type PersonSignalListItem = {
  id: string;
  personId: string;
  reason: string;
  severity: SignalSeverity;
  assignedToId?: string | null;
  assignedTo?: { role: UserRole } | null;
  person: { id: string; fullName: string };
  group?: { name: string; leader?: { name: string | null } | null } | null;
};

function renderSignalCards(
  signals: PersonSignalListItem[],
  user: { id: string; role: UserRole },
  ctaLabelForSupport = "Abrir apoio",
) {
  return signals.map((signal) => {
    const badge = signalBadgeForViewer(signal, user);

    return (
      <PersonSignalCard
        key={signal.id}
        initials={initials(signal.person.fullName)}
        name={signal.person.fullName}
        detailHref={`/pessoas/${signal.person.id}`}
        context={`${signal.group?.name ?? "Sem célula"} · ${signal.group?.leader?.name ?? "Sem líder"}`}
        reason={signalReasonForViewer(signal.reason, user)}
        severity={signal.severity === "URGENT" ? "risk" : "warn"}
        badgeLabel={badge.label}
        badgeTone={badge.tone}
        ctaLabel={isSupportRequest(signal, user) ? ctaLabelForSupport : "Abrir pessoa"}
      />
    );
  });
}

export default async function PeoplePage() {
  const user = await getCurrentUser();
  const isLeader = user.role === UserRole.LEADER;
  const isPastoralOverview = user.role === UserRole.PASTOR || user.role === UserRole.ADMIN;
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
        ...visibleOpenSignalWhere,
        OR: [
          { severity: SignalSeverity.URGENT },
          { assignedTo: { is: { role: { in: [UserRole.PASTOR, UserRole.ADMIN] } } } },
        ],
      }
    : visibleOpenSignalWhere;

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
      where: {
        AND: [
          getVisiblePersonWhere(user),
          { status: PersonStatus.COOLING_AWAY },
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

  const attentionPeople = isPastoralOverview
    ? getPastoralSignalsByPerson(openSignals)
    : getPrimarySignalsByPerson(openSignals);
  const activeAttentionPersonIds = new Set(attentionPeople.map((signal) => signal.personId));
  const urgentSignals = attentionPeople.filter(isUrgentOrPastoralCase);
  const supportSignals = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const handledSignalIds = new Set([...urgentSignals, ...supportSignals].map((signal) => signal.id));
  const attentionSignals = attentionPeople.filter((signal) => !handledSignalIds.has(signal.id));
  const scopedInCarePeople = inCarePeople.filter((person) => isInCarePerson(person) && !activeAttentionPersonIds.has(person.id));
  const visibleMemberList = visibleMembers.slice(0, MEMBER_LIST_LIMIT);
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const emptyAttentionMessage = isLeader
    ? "Nenhum membro da sua célula está em atenção agora."
    : isPastoralOverview
      ? "Nenhum caso pastoral urgente ou encaminhado agora. Use a busca para consultar uma pessoa específica."
      : "Nenhuma pessoa em atenção agora.";

  const renderInCareLinks = (people: typeof scopedInCarePeople) => people.map((person) => (
    <Link
      key={person.id}
      href={`/pessoas/${person.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{person.fullName}</span>
        <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)]">{person.memberships[0]?.group.name ?? "Sem célula"}</span>
      </span>
      <Badge tone="care">Em cuidado</Badge>
    </Link>
  ));

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: homeHref, label: "Visão", icon: "home" },
        { href: "/pessoas", label: peopleLabel, icon: "people", active: true, attention: attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder={searchPlaceholder} />

      <PastoralListSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem primeiro."
        emptyMessage={emptyAttentionMessage}
        hiddenChildren={renderSignalCards(urgentSignals.slice(SECTION_LIMIT), user)}
      >
        {renderSignalCards(urgentSignals.slice(0, SECTION_LIMIT), user)}
      </PastoralListSection>

      <PastoralListSection
        title="Pedidos de apoio"
        detail="Casos trazidos para apoio de supervisão, sem virar fila burocrática."
        emptyMessage="Nenhum pedido de apoio agora."
        hiddenChildren={renderSignalCards(supportSignals.slice(SECTION_LIMIT), user)}
      >
        {renderSignalCards(supportSignals.slice(0, SECTION_LIMIT), user)}
      </PastoralListSection>

      <PastoralListSection
        title="Acompanhar de perto"
        detail="Atenções locais que merecem contato simples."
        emptyMessage="Nenhuma outra pessoa em atenção agora."
        hiddenChildren={renderSignalCards(attentionSignals.slice(SECTION_LIMIT), user)}
      >
        {renderSignalCards(attentionSignals.slice(0, SECTION_LIMIT), user)}
      </PastoralListSection>

      <PastoralListSection
        title="Acolhidos em cuidado"
        detail="Pessoas que já receberam cuidado e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado agora."
        hiddenChildren={renderInCareLinks(scopedInCarePeople.slice(SECTION_LIMIT))}
      >
        {renderInCareLinks(scopedInCarePeople.slice(0, SECTION_LIMIT))}
      </PastoralListSection>

      {isLeader ? (
        <>
          <SectionTitle detail="Lista curta para consulta rápida. Para encontrar alguém fora dos primeiros nomes, use a busca.">Membros da célula</SectionTitle>
          <div className="space-y-2">
            {visibleMemberList.map((person) => {
              const attentionSignal = attentionSignalByPersonId.get(person.id);
              const badge = personEffectiveBadgeForViewer(person, attentionSignal, user);

              return (
                <Link
                  key={person.id}
                  href={`/pessoas/${person.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{person.fullName}</span>
                    <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)]">{person.memberships[0]?.group.name ?? "Sua célula"}</span>
                  </span>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <SectionTitle>Consulta</SectionTitle>
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)] shadow-card">
            {isPastoralOverview
              ? "Esta tela organiza os casos por intenção pastoral. Use a busca para consultar qualquer pessoa quando precisar."
              : "As seções acima mostram quem merece atenção. Para consultar outra pessoa do seu escopo, use a busca pelo nome."}
          </p>
        </>
      )}
    </AppShell>
  );
}
