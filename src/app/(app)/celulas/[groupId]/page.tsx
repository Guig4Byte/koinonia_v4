import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus, PersonStatus, SignalSeverity, SignalStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { BackLink, EmptyState, MetricRow, PersonMiniCard, PersonSignalCard, SectionTitle } from "@/components/cards";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { summarizeEventPresence, summarizeEventsPresence } from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canViewGroup } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson, isPastoralSignal } from "@/features/signals/attention";
import { escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { groupAttentionLabel, signalBadgeForViewer, signalReasonForViewer, type SignalBadge, type SignalBadgeTone } from "@/features/signals/display";
import { isSupportRequest, isUrgentOrPastoralCase } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { formatShortDate, formatTime, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

const MEMBER_LOW_PRESENCE_THRESHOLD = 60;

const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

type MembersFilter = "todos" | "atencao" | "em-cuidado" | "ativos";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type MemberPresenceEvent = {
  startsAt: Date;
  attendances: Array<{
    personId: string;
    status: AttendanceStatus;
  }>;
};

type MemberDisplay = {
  membershipId: string;
  personId: string;
  name: string;
  initials: string;
  subtitle?: string;
  badgeLabel: string;
  badgeTone: BadgeTone;
  cardTone?: SignalBadgeTone | "stable" | "muted";
  priorityRank: number;
  status: PersonStatus;
};

const MEMBERS_FILTERS: Array<{ value: MembersFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Atenção" },
  { value: "em-cuidado", label: "Em cuidado" },
  { value: "ativos", label: "Ativos" },
];

function groupMeetingText(day?: number | null, time?: string | null) {
  if (day === null || day === undefined) return time ? `Horário: ${time}` : "Encontro sem horário fixo informado.";
  return `${dayLabels[day] ?? "Dia informado"}${time ? ` · ${time}` : ""}`;
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function readMembersFilter(value: string): MembersFilter {
  return MEMBERS_FILTERS.some((filter) => filter.value === value) ? value as MembersFilter : "todos";
}

function membersFilterHref(groupId: string, filter: MembersFilter) {
  if (filter === "todos") return `/celulas/${groupId}`;
  return `/celulas/${groupId}?membros=${filter}`;
}

function metricToneForPresence(hasPresenceData: boolean, presenceRate: number) {
  if (!hasPresenceData) return "neutral" as const;
  if (presenceRate < 65) return "risk" as const;
  if (presenceRate < 75) return "warn" as const;
  return "ok" as const;
}

function badgeToneForPresence(hasPresenceData: boolean, presenceRate: number): BadgeTone {
  if (!hasPresenceData) return "neutral";
  if (presenceRate < 65) return "risk";
  if (presenceRate < 75) return "warn";
  return "ok";
}

function summarizeMemberPresence(personId: string, events: MemberPresenceEvent[]) {
  const explicitAttendances = events.flatMap((event) =>
    event.attendances.filter((attendance) => attendance.personId === personId && attendance.status !== AttendanceStatus.VISITOR),
  );
  const presentCount = explicitAttendances.filter((attendance) => attendance.status === AttendanceStatus.PRESENT).length;
  const accountableCount = explicitAttendances.length;
  let lastStatus: AttendanceStatus | undefined;

  for (const event of events) {
    const latestAttendance = event.attendances.find((attendance) => attendance.personId === personId && attendance.status !== AttendanceStatus.VISITOR);

    if (latestAttendance) {
      lastStatus = latestAttendance.status;
      break;
    }
  }

  return {
    hasData: accountableCount > 0,
    presenceRate: percent(presentCount, accountableCount),
    lastStatus,
  };
}

function recentPresenceSubtitle(lastStatus?: AttendanceStatus) {
  if (lastStatus === AttendanceStatus.PRESENT) return "Presente no último encontro";
  if (lastStatus === AttendanceStatus.JUSTIFIED) return "Justificou o último encontro";
  if (lastStatus === AttendanceStatus.ABSENT) return "Ausente no último encontro";
  return undefined;
}

function memberCardTone(badgeTone: BadgeTone, hasPresenceData: boolean, presenceRate: number): MemberDisplay["cardTone"] {
  if (badgeTone === "risk" || badgeTone === "support" || badgeTone === "warn" || badgeTone === "care") return badgeTone;
  if (hasPresenceData && presenceRate < MEMBER_LOW_PRESENCE_THRESHOLD) return "warn";
  if (!hasPresenceData) return "muted";
  return undefined;
}

function memberMatchesFilter(member: MemberDisplay, filter: MembersFilter) {
  if (filter === "atencao") return member.priorityRank <= 6;
  if (filter === "em-cuidado") return member.status === PersonStatus.COOLING_AWAY;
  if (filter === "ativos") return member.status === PersonStatus.ACTIVE && member.priorityRank >= 7;
  return true;
}

export default async function GroupDetailPage({ params, searchParams }: GroupDetailPageProps) {
  const user = await getCurrentUser();
  const { groupId } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const activeMembersFilter = readMembersFilter(firstParam(queryParams.membros));

  const group = await prisma.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      leader: true,
      supervisor: true,
      memberships: {
        where: { leftAt: null, role: { not: "VISITOR" } },
        include: { person: true },
        orderBy: { person: { fullName: "asc" } },
      },
      signals: {
        where: { status: SignalStatus.OPEN },
        include: { person: true, assignedTo: true },
        orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      },
      events: {
        where: { type: "CELL_MEETING" },
        include: { attendances: true },
        orderBy: { startsAt: "desc" },
        take: 6,
      },
    },
  });

  if (!group || !canViewGroup(user, group)) notFound();

  const homeHref = user.role === UserRole.LEADER ? "/lider" : user.role === UserRole.SUPERVISOR ? "/supervisor" : "/pastor";
  const isPastorView = user.role === UserRole.PASTOR || user.role === UserRole.ADMIN;
  const isSupervisorView = user.role === UserRole.SUPERVISOR;
  const secondaryNavHref = isPastorView ? "/equipe" : isSupervisorView ? "/celulas" : "/pessoas";
  const secondaryNavLabel = isPastorView ? "Equipe" : isSupervisorView ? "Células" : "Membros";
  const backHref = isPastorView || isSupervisorView ? secondaryNavHref : homeHref;
  const backLabel = isPastorView ? "Voltar para equipe" : isSupervisorView ? "Voltar para células" : "Voltar para visão";
  const attentionPeople = getPrimarySignalsByPerson(group.signals);
  const pastoralAttentionPeople = getPastoralSignalsByPerson(group.signals);
  const localAttentionPeople = attentionPeople.filter((signal) => !isPastoralSignal(signal));
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const urgentAttentionPeople = attentionPeople.filter((signal) => signal.severity === SignalSeverity.URGENT);
  const inCareCount = group.memberships.filter((membership) => membership.person.status === PersonStatus.COOLING_AWAY).length;
  const hasRiskSignal = attentionPeople.some(isUrgentOrPastoralCase);
  const navIndicator = hasRiskSignal ? "risk" : attentionPeople.length > 0 ? "attention" : inCareCount > 0 ? "care" : undefined;
  const completedEvents = group.events.filter((event) => summarizeEventPresence(event).completed);
  const presence = summarizeEventsPresence(group.events);
  const hasRecentPresence = presence.hasPresenceData;
  const relevantEvent = selectRelevantCheckInEvent(group.events);
  const pendingEvent = relevantEvent && !hasRecordedPresence(relevantEvent) ? relevantEvent : null;
  const pendingEventActionLabel = user.role === UserRole.LEADER && group.leaderUserId === user.id ? "Registrar presença" : "Abrir encontro";
  const prioritySectionTitle = isPastorView ? "Irmãos que precisam de um olhar especial" : "Quem merece atenção";
  const supervisorOtherAttention = isSupervisorView
    ? attentionPeople.filter((signal) => !isSupportRequest(signal, user))
    : [];
  const headerBadge: SignalBadge = (() => {
    if (urgentAttentionPeople.length > 0) {
      return { tone: "risk", label: groupAttentionLabel(urgentAttentionPeople.length, "urgente", "urgentes") };
    }

    if (isPastorView && pastoralAttentionPeople.length > 0) {
      return { tone: "risk", label: groupAttentionLabel(pastoralAttentionPeople.length, "caso pastoral", "casos pastorais") };
    }

    if (!isPastorView && supportRequests.length > 0) {
      const supportLabel = user.role === UserRole.LEADER
        ? groupAttentionLabel(supportRequests.length, "apoio solicitado", "apoios solicitados")
        : groupAttentionLabel(supportRequests.length, "pedido de apoio", "pedidos de apoio");

      return { tone: "support", label: supportLabel };
    }

    if (attentionPeople.length > 0) {
      return {
        tone: "warn",
        label: isPastorView ? groupAttentionLabel(attentionPeople.length, "atenção local", "atenções locais") : groupAttentionLabel(attentionPeople.length, "pessoa em atenção", "pessoas em atenção"),
      };
    }

    if (inCareCount > 0) {
      return { tone: "care", label: groupAttentionLabel(inCareCount, "em cuidado", "em cuidado") };
    }

    return { tone: "ok", label: "Estável" };
  })();

  const members: MemberDisplay[] = group.memberships
    .map((membership) => {
      const attentionSignal = attentionSignalByPersonId.get(membership.personId);
      const memberBadge = personEffectiveBadgeForViewer(membership.person, attentionSignal, user);
      const memberPresence = summarizeMemberPresence(membership.personId, completedEvents);
      const escalationSubtitle = attentionSignal ? escalationStatusDetailForViewer(attentionSignal, user) : null;
      const signalSubtitle = attentionSignal ? escalationSubtitle ?? signalReasonForViewer(attentionSignal.reason, user) : undefined;
      const lowPresence = memberPresence.hasData && memberPresence.presenceRate < MEMBER_LOW_PRESENCE_THRESHOLD;
      const subtitle = signalSubtitle
        ?? (membership.person.status === PersonStatus.COOLING_AWAY ? "Em cuidado" : undefined)
        ?? (lowPresence ? `Presença recente em ${memberPresence.presenceRate}%` : undefined)
        ?? recentPresenceSubtitle(memberPresence.lastStatus)
        ?? (!memberPresence.hasData ? "Sem presença recente registrada" : undefined);
      const priorityRank = (() => {
        if (attentionSignal && isUrgentOrPastoralCase(attentionSignal)) return 1;
        if (attentionSignal && isSupportRequest(attentionSignal, user)) return 2;
        if (attentionSignal) return 3;
        if (membership.person.status === PersonStatus.COOLING_AWAY) return 4;
        if (lowPresence) return 5;
        if (!memberPresence.hasData) return 6;
        if (membership.person.status === PersonStatus.ACTIVE) return 7;
        return 8;
      })();

      return {
        membershipId: membership.id,
        personId: membership.personId,
        name: membership.person.fullName,
        initials: initials(membership.person.fullName),
        subtitle,
        badgeLabel: memberBadge.label,
        badgeTone: memberBadge.tone,
        cardTone: memberCardTone(memberBadge.tone, memberPresence.hasData, memberPresence.presenceRate),
        priorityRank,
        status: membership.person.status,
      };
    })
    .sort((left, right) => {
      const priorityDifference = left.priorityRank - right.priorityRank;
      if (priorityDifference !== 0) return priorityDifference;
      return left.name.localeCompare(right.name, "pt-BR");
    });
  const visibleMembers = members.filter((member) => memberMatchesFilter(member, activeMembersFilter));

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      compactHeader
      nav={[
        { href: homeHref, label: "Visão", icon: "home" },
        { href: secondaryNavHref, label: secondaryNavLabel, icon: "people", active: isPastorView || isSupervisorView || user.role === UserRole.LEADER, indicator: navIndicator },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <div className="group-detail-page">
        <BackLink href={backHref}>{backLabel}</BackLink>

        <section className="group-detail-hero">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Célula</p>
              <h2 className="mt-1 text-[1.45rem] font-extrabold leading-tight tracking-[-0.02em] text-[var(--color-text-primary)]">{group.name}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                Liderança: {group.leader?.name ?? "não informada"}
                {group.supervisor?.name ? ` · Supervisão: ${group.supervisor.name}` : ""}
              </p>
            </div>
            <Badge tone={headerBadge.tone}>{headerBadge.label}</Badge>
          </div>
          <p className="group-detail-hero-chip mt-3">
            {groupMeetingText(group.meetingDayOfWeek, group.meetingTime)}
            {group.locationName ? ` · ${group.locationName}` : ""}
          </p>
        </section>

        <MetricRow
          metrics={[
            { label: "Membros", value: String(group.memberships.length), tone: "neutral" },
            {
              label: "Presença",
              value: hasRecentPresence ? `${presence.presenceRate}%` : "—",
              tone: metricToneForPresence(hasRecentPresence, presence.presenceRate),
            },
            {
              label: isPastorView ? "Atenções" : "Em atenção",
              value: String(attentionPeople.length),
              tone: attentionPeople.length > 0 ? "warn" : "ok",
            },
          ]}
        />

        {isPastorView && pastoralAttentionPeople.length > 0 ? (
          <section className="space-y-3">
            <SectionTitle>{prioritySectionTitle}</SectionTitle>
            {pastoralAttentionPeople.slice(0, 4).map((signal) => {
              const badge = signalBadgeForViewer(signal, user);

              return (
                <PersonSignalCard
                  key={signal.id}
                  initials={initials(signal.person.fullName)}
                  name={signal.person.fullName}
                  detailHref={`/pessoas/${signal.person.id}`}
                  context="Membro da célula"
                  reason={signalReasonForViewer(signal.reason, user)}
                  severity={signal.severity === SignalSeverity.URGENT ? "risk" : "warn"}
                  badgeLabel={badge.label}
                  badgeTone={badge.tone}
                  ctaLabel="Abrir pessoa"
                />
              );
            })}
          </section>
        ) : null}

        {isPastorView && localAttentionPeople.length > 0 ? (
          <section className="space-y-3">
            <SectionTitle>Atenções locais da célula</SectionTitle>
            {localAttentionPeople.slice(0, 4).map((signal) => {
              const badge = signalBadgeForViewer(signal, user);

              return (
                <PersonSignalCard
                  key={signal.id}
                  initials={initials(signal.person.fullName)}
                  name={signal.person.fullName}
                  detailHref={`/pessoas/${signal.person.id}`}
                  context="No cuidado do líder ou da supervisão"
                  reason={signalReasonForViewer(signal.reason, user)}
                  severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
                  badgeLabel={badge.label}
                  badgeTone={badge.tone}
                  ctaLabel="Abrir pessoa"
                />
              );
            })}
          </section>
        ) : null}

        {isSupervisorView && supportRequests.length > 0 ? (
          <section className="space-y-3">
            <SectionTitle>Pedidos de apoio</SectionTitle>
            {supportRequests.slice(0, 4).map((signal) => {
              const badge = signalBadgeForViewer(signal, user);

              return (
                <PersonSignalCard
                  key={signal.id}
                  initials={initials(signal.person.fullName)}
                  name={signal.person.fullName}
                  detailHref={`/pessoas/${signal.person.id}`}
                  context="Membro da célula"
                  reason={signalReasonForViewer(signal.reason, user)}
                  severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
                  badgeLabel={badge.label}
                  badgeTone={badge.tone}
                  ctaLabel="Abrir apoio"
                />
              );
            })}
          </section>
        ) : null}

        {isSupervisorView && supervisorOtherAttention.length > 0 ? (
          <section className="space-y-3">
            <SectionTitle>Acompanhar de perto</SectionTitle>
            {supervisorOtherAttention.slice(0, 4).map((signal) => {
              const badge = signalBadgeForViewer(signal, user);

              return (
                <PersonSignalCard
                  key={signal.id}
                  initials={initials(signal.person.fullName)}
                  name={signal.person.fullName}
                  detailHref={`/pessoas/${signal.person.id}`}
                  context="Membro da célula"
                  reason={signalReasonForViewer(signal.reason, user)}
                  severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
                  badgeLabel={badge.label}
                  badgeTone={badge.tone}
                  ctaLabel="Abrir pessoa"
                />
              );
            })}
          </section>
        ) : null}

        {user.role === UserRole.LEADER && attentionPeople.length > 0 ? (
          <section className="space-y-3">
            <SectionTitle>{prioritySectionTitle}</SectionTitle>
            {attentionPeople.slice(0, 4).map((signal) => {
              const badge = signalBadgeForViewer(signal, user);

              return (
                <PersonSignalCard
                  key={signal.id}
                  initials={initials(signal.person.fullName)}
                  name={signal.person.fullName}
                  detailHref={`/pessoas/${signal.person.id}`}
                  context="Membro da célula"
                  reason={signalReasonForViewer(signal.reason, user)}
                  severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
                  badgeLabel={badge.label}
                  badgeTone={badge.tone}
                  ctaLabel={isSupportRequest(signal, user) ? "Abrir apoio" : "Abrir pessoa"}
                />
              );
            })}
          </section>
        ) : null}

        {pendingEvent ? (
          <section>
            <SectionTitle>Encontro pendente</SectionTitle>
            <Link href={`/eventos/${pendingEvent.id}`} className={cn("group-encounter-card", "priority-card priority-card-warn")}>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[var(--color-text-primary)]">{pendingEvent.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {formatShortDate(pendingEvent.startsAt)} · {formatTime(pendingEvent.startsAt)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                <Badge tone="warn">Presença pendente</Badge>
                <span className="text-[13px] font-bold text-[var(--color-brand)]">{pendingEventActionLabel} →</span>
              </span>
            </Link>
          </section>
        ) : null}

        <section>
          <SectionTitle detail={`${group.memberships.length} ${group.memberships.length === 1 ? "membro" : "membros"} · ${attentionPeople.length} em atenção`}>Membros</SectionTitle>
          <div className="group-member-filter-row mb-3">
            {MEMBERS_FILTERS.map((option) => {
              const active = option.value === activeMembersFilter;

              return (
                <Link
                  key={option.value}
                  href={membersFilterHref(group.id, option.value)}
                  aria-current={active ? "page" : undefined}
                  className={cn("team-filter-chip", active && "team-filter-chip-active")}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
          <div className="space-y-2">
            {visibleMembers.map((member) => (
              <PersonMiniCard
                key={member.membershipId}
                href={`/pessoas/${member.personId}`}
                initials={member.initials}
                name={member.name}
                context={member.subtitle}
                badgeLabel={member.badgeLabel}
                badgeTone={member.badgeTone}
                cardTone={member.cardTone}
              />
            ))}
            {visibleMembers.length === 0 ? (
              <EmptyState compact>Nenhum membro encontrado nesse recorte.</EmptyState>
            ) : null}
          </div>
        </section>

        <section>
          <SectionTitle>Últimos encontros</SectionTitle>
          <div className="space-y-2">
            {completedEvents.slice(0, 3).map((event) => {
              const metrics = summarizeEventPresence(event);
              const presenceBadgeTone = badgeToneForPresence(metrics.hasPresenceData, metrics.presenceRate);

              return (
                <Link key={event.id} href={`/eventos/${event.id}`} className="group-encounter-card">
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--color-text-primary)]">
                      {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      {metrics.visitorCount} {metrics.visitorCount === 1 ? "visitante" : "visitantes"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                    <Badge tone={presenceBadgeTone}>{metrics.hasPresenceData ? `${metrics.presenceRate}%` : "Sem registro"}</Badge>
                    <span className="text-[13px] font-bold text-[var(--color-brand)]">Abrir →</span>
                  </span>
                </Link>
              );
            })}
            {completedEvents.length === 0 ? (
              <EmptyState compact>Ainda não há encontros registrados para resumir presença.</EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}