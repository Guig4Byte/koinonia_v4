import Link from "next/link";
import { CalendarCheck2, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { PersonStatus, SignalSeverity, SignalStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { BackLink, ContextSummary, EmptyState, PersonMiniCard, SectionTitle } from "@/components/cards";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ProgressiveList } from "@/components/progressive-list";
import { isPresenceRecordedEvent, summarizeEventPresence, summarizeEventsPresence, summarizePresenceTrend } from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canViewGroup } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson } from "@/features/signals/attention";
import { escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { groupAttentionLabel, signalReasonForViewer, type SignalBadge, type SignalBadgeTone } from "@/features/signals/display";
import { getPastoralSectionSignalsByPerson, isSupportRequest, isUrgentOrPastoralCase } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

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
  if (presenceRate < 50) return "risk" as const;
  if (presenceRate < 70) return "warn" as const;
  return "ok" as const;
}

function badgeToneForPresence(hasPresenceData: boolean, presenceRate: number): BadgeTone {
  if (!hasPresenceData) return "neutral";
  if (presenceRate < 50) return "risk";
  if (presenceRate < 70) return "warn";
  return "ok";
}

function encounterToneVars(tone: BadgeTone): CSSProperties {
  if (tone === "risk") {
    return {
      "--encounter-tone": "var(--color-badge-risco-text)",
      "--encounter-tone-soft": "var(--color-badge-risco-bg)",
    } as CSSProperties;
  }

  if (tone === "warn") {
    return {
      "--encounter-tone": "var(--color-badge-atencao-text)",
      "--encounter-tone-soft": "var(--color-badge-atencao-bg)",
    } as CSSProperties;
  }

  if (tone === "ok") {
    return {
      "--encounter-tone": "var(--color-metric-presenca)",
      "--encounter-tone-soft": "var(--color-badge-estavel-bg)",
    } as CSSProperties;
  }

  return {
    "--encounter-tone": "var(--color-text-secondary)",
    "--encounter-tone-soft": "var(--surface-alt)",
  } as CSSProperties;
}

function memberCardTone(badgeTone: BadgeTone): MemberDisplay["cardTone"] {
  if (badgeTone === "risk" || badgeTone === "support" || badgeTone === "warn" || badgeTone === "care") return badgeTone;
  return undefined;
}

function memberMatchesFilter(member: MemberDisplay, filter: MembersFilter) {
  if (filter === "atencao") return member.priorityRank <= 4;
  if (filter === "em-cuidado") return member.status === PersonStatus.COOLING_AWAY;
  if (filter === "ativos") return member.status === PersonStatus.ACTIVE && member.priorityRank >= 5;
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
        take: 12,
      },
    },
  });

  if (!group || !canViewGroup(user, group)) notFound();

  const referenceDate = new Date();
  const homeHref = user.role === UserRole.LEADER ? "/lider" : user.role === UserRole.SUPERVISOR ? "/supervisor" : "/pastor";
  const isPastorView = user.role === UserRole.PASTOR || user.role === UserRole.ADMIN;
  const isSupervisorView = user.role === UserRole.SUPERVISOR;
  const secondaryNavHref = isPastorView ? "/equipe" : isSupervisorView ? "/celulas" : "/pessoas";
  const secondaryNavLabel = isPastorView ? "Equipe" : isSupervisorView ? "Células" : "Membros";
  const backHref = isPastorView || isSupervisorView ? secondaryNavHref : homeHref;
  const backLabel = isPastorView ? "Voltar para equipe" : isSupervisorView ? "Voltar para células" : "Voltar para visão";
  const attentionPeople = getPastoralSectionSignalsByPerson(group.signals, user);
  const pastoralAttentionPeople = getPastoralSignalsByPerson(group.signals);
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const urgentAttentionPeople = attentionPeople.filter((signal) => signal.severity === SignalSeverity.URGENT);
  const inCareCount = group.memberships.filter((membership) => membership.person.status === PersonStatus.COOLING_AWAY).length;
  const hasRiskSignal = attentionPeople.some(isUrgentOrPastoralCase);
  const navIndicator = hasRiskSignal ? "risk" : attentionPeople.length > 0 ? "attention" : inCareCount > 0 ? "care" : undefined;
  const recordedPresenceEvents = group.events.filter((event) => event.startsAt <= referenceDate && isPresenceRecordedEvent(event));
  const recentPresenceEvents = recordedPresenceEvents.slice(0, 4);
  const previousPresenceEvents = recordedPresenceEvents.slice(4, 8);
  const completedEvents = recordedPresenceEvents;
  const presence = summarizeEventsPresence(recentPresenceEvents);
  const previousPresence = summarizeEventsPresence(previousPresenceEvents);
  const presenceTrend = summarizePresenceTrend(presence, previousPresence);
  const hasRecentPresence = presence.hasPresenceData;
  const relevantEvent = selectRelevantCheckInEvent(group.events, referenceDate);
  const pendingEvent = relevantEvent && !hasRecordedPresence(relevantEvent) ? relevantEvent : null;
  const canRegisterPendingEvent = user.role === UserRole.LEADER && group.leaderUserId === user.id;
  const pendingEventStatusLabel = canRegisterPendingEvent ? "Presença pendente" : "Aguardando registro";
  const pendingEventActionLabel = canRegisterPendingEvent ? "Registrar presença" : "Abrir encontro";
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
      const escalationSubtitle = attentionSignal ? escalationStatusDetailForViewer(attentionSignal, user) : null;
      const signalSubtitle = attentionSignal ? escalationSubtitle ?? signalReasonForViewer(attentionSignal.reason, user) : undefined;
      const subtitle = signalSubtitle
        ?? (membership.person.status === PersonStatus.COOLING_AWAY ? "Em cuidado" : undefined);
      const priorityRank = (() => {
        if (attentionSignal && isUrgentOrPastoralCase(attentionSignal)) return 1;
        if (attentionSignal && isSupportRequest(attentionSignal, user)) return 2;
        if (attentionSignal) return 3;
        if (membership.person.status === PersonStatus.COOLING_AWAY) return 4;
        if (membership.person.status === PersonStatus.ACTIVE) return 5;
        return 6;
      })();

      return {
        membershipId: membership.id,
        personId: membership.personId,
        name: membership.person.fullName,
        initials: initials(membership.person.fullName),
        subtitle,
        badgeLabel: memberBadge.label,
        badgeTone: memberBadge.tone,
        cardTone: memberCardTone(memberBadge.tone),
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

        <div className="group-detail-summary">
          <ContextSummary
            detailTone="strong"
            trendLayout="stacked"
            items={[
              {
                label: "Membros acompanhados",
                value: String(group.memberships.length),
                detail: "Pessoas sob cuidado e convivência desta célula.",
                tone: "neutral",
              },
              {
                label: "Presença recente",
                value: hasRecentPresence ? `${presence.presenceRate}%` : "—",
                detail: hasRecentPresence
                  ? "Média dos últimos encontros registrados."
                  : "Ainda sem presença recente registrada.",
                tone: metricToneForPresence(hasRecentPresence, presence.presenceRate),
                trend: presenceTrend,
              },
              {
                label: isPastorView ? "Pedem cuidado" : "Pedem proximidade",
                value: String(attentionPeople.length),
                detail: attentionPeople.length > 0
                  ? "Pessoas que merecem acompanhamento próximo."
                  : "Nenhum sinal aberto pedindo cuidado agora.",
                tone: attentionPeople.length > 0 ? hasRiskSignal ? "risk" : "warn" : "ok",
              },
            ]}
          />
        </div>

        {pendingEvent ? (
          <section className="group-pending-event-section">
            <Link href={`/eventos/${pendingEvent.id}`} className={cn("group-pending-event-card", "priority-card priority-card-warn")}>
              <span className="group-pending-event-top">
                <span>{pendingEventStatusLabel}</span>
              </span>
              <span className="group-pending-event-body">
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-[var(--color-text-primary)]">{pendingEvent.title}</span>
                  <span className="mt-1 block text-xs font-medium leading-relaxed text-[var(--color-text-secondary)]">
                    {formatShortDate(pendingEvent.startsAt)} · {formatTime(pendingEvent.startsAt)}
                  </span>
                </span>
                <span className="group-pending-event-action">
                  {pendingEventActionLabel} →
                </span>
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
          <div className="group-detail-list">
            <ProgressiveList
              initialCount={6}
              step={6}
              moreLabel="Ver mais membros"
              lessLabel="Mostrar menos membros"
            >
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
            </ProgressiveList>
            {visibleMembers.length === 0 ? (
              <EmptyState compact>Nenhum membro encontrado nesse recorte.</EmptyState>
            ) : null}
          </div>
        </section>

        <section>
          <SectionTitle>Últimos encontros do mês</SectionTitle>
          <div className="group-detail-list">
            <ProgressiveList
              initialCount={4}
              step={4}
              moreLabel="Ver mais encontros"
              lessLabel="Mostrar menos encontros"
            >
              {completedEvents.map((event) => {
              const metrics = summarizeEventPresence(event);
              const presenceBadgeTone = badgeToneForPresence(metrics.hasPresenceData, metrics.presenceRate);
              const presenceLabel = metrics.hasPresenceData ? `${metrics.presenceRate}%` : "sem registro";
              const presenceProgress = metrics.hasPresenceData ? metrics.presenceRate : 0;

              return (
                <Link
                  key={event.id}
                  href={`/eventos/${event.id}`}
                  className="group-encounter-card relative min-h-[74px] gap-3 overflow-hidden py-3 pr-4 pl-5"
                  style={encounterToneVars(presenceBadgeTone)}
                >
                  <span className="absolute inset-y-0 left-0 w-1 bg-[var(--encounter-tone)]" aria-hidden="true" />
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--encounter-tone-soft)] text-[var(--encounter-tone)]"
                    aria-hidden="true"
                  >
                    <CalendarCheck2 className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--color-text-secondary)]">
                      {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)}
                    </span>
                    <span className="mt-2 flex min-w-0 items-center gap-2 text-xs leading-none text-[var(--color-text-muted)]">
                      <span className="h-1 w-24 overflow-hidden rounded-full bg-[var(--color-border-divider)]" aria-hidden="true">
                        <span
                          className="block h-full rounded-full bg-[var(--encounter-tone)]"
                          style={{ width: `${presenceProgress}%` }}
                        />
                      </span>
                      <strong className="min-w-8 font-bold text-[var(--encounter-tone)]">{presenceLabel}</strong>
                      <span className="h-3 w-px bg-[var(--color-border-divider)]" aria-hidden="true" />
                      <span className="flex min-w-0 items-center gap-1 truncate font-medium text-[var(--color-text-secondary)]">
                        <UsersRound className="h-3 w-3 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                        {metrics.visitorCount} {metrics.visitorCount === 1 ? "visitante" : "visitantes"}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 self-center text-xs font-semibold text-[var(--color-text-secondary)]">
                    Abrir →
                  </span>
                </Link>
              );
              })}
            </ProgressiveList>
            {completedEvents.length === 0 ? (
              <EmptyState compact>Ainda não há encontros registrados para resumir presença.</EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
