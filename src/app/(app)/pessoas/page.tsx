import Link from "next/link";
import { MembershipRole, SignalSeverity, UserRole } from "../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { ListMoreHint, PersonSignalCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson } from "@/features/signals/attention";
import { signalBadgeForViewer, signalReasonForViewer } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

const PRIORITY_PEOPLE_LIMIT = 5;
const SECONDARY_PEOPLE_LIMIT = 6;
const MEMBER_LIST_LIMIT = 24;

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

  const [openSignals, visibleMembers] = await Promise.all([
    prisma.careSignal.findMany({
      where: pastorSignalWhere,
      include: { person: true, assignedTo: true, group: { include: { leader: true } } },
      orderBy: { detectedAt: "desc" },
      take: 50,
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
  ]);

  const attentionPeople = isPastoralOverview
    ? getPastoralSignalsByPerson(openSignals)
    : getPrimarySignalsByPerson(openSignals);
  const naturallyPrioritySignals = attentionPeople.filter((signal) => (
    signal.severity === SignalSeverity.URGENT ||
    signal.assignedToId === user.id ||
    signal.assignedTo?.role === UserRole.PASTOR ||
    signal.assignedTo?.role === UserRole.ADMIN
  ));
  const prioritySignals = naturallyPrioritySignals.length > 0
    ? naturallyPrioritySignals
    : attentionPeople.slice(0, PRIORITY_PEOPLE_LIMIT);
  const prioritySignalIds = new Set(prioritySignals.map((signal) => signal.id));
  const secondarySignals = attentionPeople.filter((signal) => !prioritySignalIds.has(signal.id));
  const visiblePrioritySignals = prioritySignals.slice(0, PRIORITY_PEOPLE_LIMIT);
  const visibleSecondarySignals = secondarySignals.slice(0, SECONDARY_PEOPLE_LIMIT);
  const visibleMemberList = visibleMembers.slice(0, MEMBER_LIST_LIMIT);
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const attentionTitle = isLeader ? "Precisa de atenção agora" : isPastoralOverview ? "Casos pastorais" : "Pedidos e atenções";
  const secondaryTitle = isPastoralOverview ? "Outros casos pastorais" : isLeader ? "Acompanhar" : "Outras pessoas em atenção";
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
        { href: "/pessoas", label: peopleLabel, icon: "people", active: true, attention: attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder={searchPlaceholder} />

      <SectionTitle detail="A lista começa pelo que merece decisão. Use a busca quando estiver procurando alguém específico.">{attentionTitle}</SectionTitle>
      <div className="space-y-3">
        {visiblePrioritySignals.map((signal) => {
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
              ctaLabel={!isPastoralOverview && signal.assignedToId === user.id ? "Abrir apoio" : "Abrir pessoa"}
            />
          );
        })}
        <ListMoreHint hiddenCount={Math.max(0, prioritySignals.length - visiblePrioritySignals.length)} label="Use a busca para ir direto ao nome sem percorrer uma lista longa." />
        {attentionPeople.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">
            {emptyAttentionMessage}
          </p>
        ) : null}
      </div>

      {secondarySignals.length > 0 ? (
        <>
          <SectionTitle>{secondaryTitle}</SectionTitle>
          <div className="space-y-3">
            {visibleSecondarySignals.map((signal) => {
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
                  ctaLabel={!isPastoralOverview && signal.assignedToId === user.id ? "Abrir apoio" : "Abrir pessoa"}
                />
              );
            })}
            <ListMoreHint hiddenCount={Math.max(0, secondarySignals.length - visibleSecondarySignals.length)} label="Use a busca para consultar o restante com menos rolagem." />
          </div>
        </>
      ) : null}

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
            <ListMoreHint hiddenCount={Math.max(0, visibleMembers.length - visibleMemberList.length)} label="Busque pelo nome para abrir um membro sem rolar a lista inteira." />
          </div>
        </>
      ) : (
        <>
          <SectionTitle>Consulta</SectionTitle>
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)] shadow-card">
            {isPastoralOverview
              ? "Esta tela não lista toda atenção operacional. O pastor vê casos graves por padrão e pode buscar qualquer pessoa quando precisar."
              : "A lista acima mostra apenas quem merece atenção. Para consultar outra pessoa do seu escopo, use a busca pelo nome."}
          </p>
        </>
      )}
    </AppShell>
  );
}
