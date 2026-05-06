import Link from "next/link";
import { redirect } from "next/navigation";
import { MembershipRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { EmptyState, PersonMiniCard, SectionTitle } from "@/components/cards";
import { ProgressiveList } from "@/components/progressive-list";
import { SearchBox } from "@/components/search-box";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { signalDetailForViewer, type SignalBadgeTone } from "@/features/signals/display";
import { isSupportRequest, isUrgentOrPastoralCase, splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

type MembersFilter = "todos" | "atencao" | "em-cuidado" | "ativos";

type PeoplePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type MemberDisplay = {
  id: string;
  name: string;
  initials: string;
  context: string;
  subtitle?: string;
  badgeLabel: string;
  badgeTone: SignalBadgeTone;
  cardTone?: SignalBadgeTone | "muted";
  status: PersonStatus;
  priorityRank: number;
};

const MEMBERS_FILTERS: Array<{ value: MembersFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Atenção" },
  { value: "em-cuidado", label: "Em cuidado" },
  { value: "ativos", label: "Ativos" },
];

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function readMembersFilter(value: string): MembersFilter {
  return MEMBERS_FILTERS.some((filter) => filter.value === value) ? value as MembersFilter : "todos";
}

function membersFilterHref(filter: MembersFilter) {
  if (filter === "todos") return "/pessoas#membros";
  return `/pessoas?membros=${filter}#membros`;
}

function memberCardTone(badgeTone: SignalBadgeTone): MemberDisplay["cardTone"] {
  if (badgeTone === "risk" || badgeTone === "support" || badgeTone === "warn" || badgeTone === "care") return badgeTone;
  return undefined;
}

function memberMatchesFilter(member: MemberDisplay, filter: MembersFilter) {
  if (filter === "atencao") return member.priorityRank <= 3;
  if (filter === "em-cuidado") return member.status === PersonStatus.COOLING_AWAY && member.priorityRank === 4;
  if (filter === "ativos") return member.status === PersonStatus.ACTIVE && member.priorityRank >= 5;
  return true;
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const user = await getCurrentUser();
  const queryParams = searchParams ? await searchParams : {};
  const activeMembersFilter = readMembersFilter(firstParam(queryParams.membros));

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
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const inCarePersonIds = new Set(pastoralSections.inCarePeople.map((person) => person.id));

  const members: MemberDisplay[] = visibleMembers
    .map((person) => {
      const attentionSignal = attentionSignalByPersonId.get(person.id);
      const badge = personEffectiveBadgeForViewer(person, attentionSignal, user);
      const groupName = person.memberships[0]?.group.name ?? "Sua célula";
      const subtitle = attentionSignal
        ? signalDetailForViewer(attentionSignal, user)
        : inCarePersonIds.has(person.id)
          ? "Já recebeu cuidado e segue no radar."
          : undefined;
      const priorityRank = (() => {
        if (attentionSignal && isUrgentOrPastoralCase(attentionSignal)) return 1;
        if (attentionSignal && isSupportRequest(attentionSignal, user)) return 2;
        if (attentionSignal) return 3;
        if (inCarePersonIds.has(person.id) || person.status === PersonStatus.COOLING_AWAY) return 4;
        return 5;
      })();

      return {
        id: person.id,
        name: person.fullName,
        initials: initials(person.fullName),
        context: groupName,
        subtitle,
        badgeLabel: badge.label,
        badgeTone: badge.tone,
        cardTone: memberCardTone(badge.tone),
        status: person.status,
        priorityRank,
      };
    })
    .sort((left, right) => {
      const priorityDifference = left.priorityRank - right.priorityRank;
      if (priorityDifference !== 0) return priorityDifference;
      return left.name.localeCompare(right.name, "pt-BR");
    });

  const visibleMembersForFilter = members.filter((member) => memberMatchesFilter(member, activeMembersFilter));
  const priorityMembers = members.filter((member) => member.priorityRank <= 4);
  const activeMembers = members.filter((member) => member.priorityRank >= 5);
  const regularMembers = activeMembersFilter === "todos" ? activeMembers : visibleMembersForFilter;
  const membersSectionDetail = activeMembersFilter === "todos"
    ? `${members.length} ${members.length === 1 ? "membro" : "membros"}${priorityMembers.length > 0 ? ` · ${priorityMembers.length} no radar` : ""}`
    : `${visibleMembersForFilter.length} ${visibleMembersForFilter.length === 1 ? "pessoa neste recorte" : "pessoas neste recorte"}`;

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: navIndicator })}
    >
      <SearchBox placeholder="Buscar membro..." />

      <section id="membros" className="scroll-mt-6">
        <SectionTitle detail={membersSectionDetail}>Membros da célula</SectionTitle>
        <div className="group-member-filter-row mb-3">
          {MEMBERS_FILTERS.map((option) => {
            const active = option.value === activeMembersFilter;

            return (
              <Link
                key={option.value}
                href={membersFilterHref(option.value)}
                aria-current={active ? "page" : undefined}
                className={cn("team-filter-chip", active && "team-filter-chip-active")}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        {activeMembersFilter === "todos" ? (
          <div className="group-detail-list">
            {priorityMembers.length > 0 ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Quem merece proximidade</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {priorityMembers.length} {priorityMembers.length === 1 ? "pessoa no radar" : "pessoas no radar"}
                  </p>
                </div>
                <ProgressiveList
                  initialCount={4}
                  step={4}
                  moreLabel="Ver mais pessoas no radar"
                  lessLabel="Mostrar menos pessoas no radar"
                >
                  {priorityMembers.map((member) => (
                    <PersonMiniCard
                      key={member.id}
                      href={`/pessoas/${member.id}`}
                      initials={member.initials}
                      name={member.name}
                      context={member.subtitle ?? member.context}
                      badgeLabel={member.badgeLabel}
                      badgeTone={member.badgeTone}
                      cardTone={member.cardTone}
                    />
                  ))}
                </ProgressiveList>
              </div>
            ) : null}

            {regularMembers.length > 0 ? (
              <div className={cn("space-y-2", priorityMembers.length > 0 && "pt-1")}>
                {priorityMembers.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Ativos</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      {regularMembers.length} {regularMembers.length === 1 ? "membro sem sinal aberto" : "membros sem sinal aberto"}
                    </p>
                  </div>
                ) : null}
                <ProgressiveList
                  initialCount={6}
                  step={6}
                  moreLabel="Ver mais membros"
                  lessLabel="Mostrar menos membros"
                >
                  {regularMembers.map((member) => (
                    <PersonMiniCard
                      key={member.id}
                      href={`/pessoas/${member.id}`}
                      initials={member.initials}
                      name={member.name}
                      badgeLabel={member.badgeLabel}
                      badgeTone={member.badgeTone}
                      cardTone="muted"
                      compact
                    />
                  ))}
                </ProgressiveList>
              </div>
            ) : null}

            {priorityMembers.length === 0 && regularMembers.length === 0 ? (
              <EmptyState compact>Nenhum membro encontrado nesse recorte.</EmptyState>
            ) : null}
          </div>
        ) : (
          <div className="group-detail-list">
            <ProgressiveList
              initialCount={6}
              step={6}
              moreLabel="Ver mais membros"
              lessLabel="Mostrar menos membros"
            >
              {regularMembers.map((member) => (
                <PersonMiniCard
                  key={member.id}
                  href={`/pessoas/${member.id}`}
                  initials={member.initials}
                  name={member.name}
                  context={member.priorityRank >= 5 ? undefined : member.subtitle ?? member.context}
                  badgeLabel={member.badgeLabel}
                  badgeTone={member.badgeTone}
                  cardTone={member.priorityRank >= 5 ? "muted" : member.cardTone}
                  compact={member.priorityRank >= 5}
                />
              ))}
            </ProgressiveList>
            {regularMembers.length === 0 ? (
              <EmptyState compact>Nenhum membro encontrado nesse recorte.</EmptyState>
            ) : null}
          </div>
        )}
      </section>
    </AppShell>
  );
}
