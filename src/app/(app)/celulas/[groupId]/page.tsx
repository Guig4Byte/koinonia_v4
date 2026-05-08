import Link from "next/link";
import { CalendarCheck2, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { GroupResponsibilityRole, PersonStatus, SignalStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole } from "@/features/navigation/app-nav";
import { BackLink, ContextSummary, EmptyState, InfoCard, PersonMiniCard, PulseCard, SectionTitle } from "@/components/cards";
import { type BadgeTone } from "@/components/ui/badge";
import { ProgressiveList } from "@/components/progressive-list";
import { presenceTone } from "@/features/events/presence-display";
import { isPresenceRecordedEvent, summarizeEventPresence, summarizeEventsPresence, summarizePresenceTrend } from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { memberCardTone, memberMatchesFilter, membersFilterHref, MEMBERS_FILTERS, readMembersFilter } from "@/features/people/member-filters";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canManageGroups, canViewGroup, isGroupLeader } from "@/features/permissions/permissions";
import { escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { signalDetailForViewer, type SignalBadgeTone } from "@/features/signals/display";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";
import { getPastoralSectionSignalsByPerson, isSupportRequest, isUrgentOrPastoralCase } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";
import { firstParam } from "@/lib/search-params";

const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

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

function groupMeetingText(day?: number | null, time?: string | null) {
  if (day === null || day === undefined) return time ? `Horário: ${time}` : "Encontro sem horário fixo informado.";
  return `${dayLabels[day] ?? "Dia informado"}${time ? ` · ${time}` : ""}`;
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

function groupPastoralPulse({
  role,
  urgentOrPastoralCount,
  supportCount,
  localAttentionCount,
  inCareCount,
  hasRecentPresence,
  presenceRate,
  hasPendingEvent,
}: {
  role: UserRole;
  urgentOrPastoralCount: number;
  supportCount: number;
  localAttentionCount: number;
  inCareCount: number;
  hasRecentPresence: boolean;
  presenceRate: number;
  hasPendingEvent: boolean;
}): PastoralPulseMessage {
  return buildPastoralPulseMessage({
    viewerRole: role,
    scope: "groupDetail",
    counts: {
      urgentOrPastoral: urgentOrPastoralCount,
      support: supportCount,
      attention: localAttentionCount,
      inCare: inCareCount,
      hasRecentPresence,
      presenceRate,
      hasPendingEvent,
    },
  });
}

export default async function GroupDetailPage({ params, searchParams }: GroupDetailPageProps) {
  const user = await getCurrentUser();
  const { groupId } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const activeMembersFilter = readMembersFilter(firstParam(queryParams.membros));
  const savedParam = firstParam(queryParams.salvo);

  const group = await prisma.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      leader: true,
      supervisor: true,
      responsibilities: {
        where: { activeUntil: null },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
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

  const leadershipName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, group.leader?.name ?? "não informada");
  const supervisionName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.SUPERVISOR, group.supervisor?.name ?? "");

  const referenceDate = new Date();
  const homeHref = homeHrefForRole(user.role);
  const isPastorView = user.role === UserRole.PASTOR || user.role === UserRole.ADMIN;
  const isSupervisorView = user.role === UserRole.SUPERVISOR;
  const secondaryNavHref = secondaryNavHrefForRole(user.role);
  const backHref = isPastorView || isSupervisorView ? secondaryNavHref : homeHref;
  const backLabel = isPastorView ? "Voltar para equipe" : isSupervisorView ? "Voltar para células" : "Voltar para visão";
  const attentionPeople = getPastoralSectionSignalsByPerson(group.signals, user);
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const urgentOrPastoralSignals = attentionPeople.filter(isUrgentOrPastoralCase);
  const localAttentionCount = attentionPeople.length - urgentOrPastoralSignals.length - supportRequests.length;
  const inCareCount = group.memberships.filter((membership) => membership.person.status === PersonStatus.COOLING_AWAY).length;
  const hasRiskSignal = urgentOrPastoralSignals.length > 0;
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
  const pastoralPulse = groupPastoralPulse({
    role: user.role,
    urgentOrPastoralCount: urgentOrPastoralSignals.length,
    supportCount: supportRequests.length,
    localAttentionCount,
    inCareCount,
    hasRecentPresence,
    presenceRate: presence.presenceRate,
    hasPendingEvent: Boolean(pendingEvent),
  });
  const canRegisterPendingEvent = user.role === UserRole.LEADER && isGroupLeader(user, group);
  const pendingEventStatusLabel = canRegisterPendingEvent ? "Presença pendente" : "Aguardando registro";
  const pendingEventActionLabel = canRegisterPendingEvent ? "Registrar presença" : "Abrir encontro";
  const members: MemberDisplay[] = group.memberships
    .map((membership) => {
      const attentionSignal = attentionSignalByPersonId.get(membership.personId);
      const memberBadge = personEffectiveBadgeForViewer(membership.person, attentionSignal, user);
      const escalationSubtitle = attentionSignal ? escalationStatusDetailForViewer(attentionSignal, user) : null;
      const signalSubtitle = attentionSignal ? escalationSubtitle ?? signalDetailForViewer(attentionSignal, user) : undefined;
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
  const visibleMembers = members.filter((member) => memberMatchesFilter(member, activeMembersFilter, {
    attentionMaxPriorityRank: 4,
  }));
  const priorityMembers = members.filter((member) => member.priorityRank <= 4);
  const activeMembers = members.filter((member) => member.priorityRank >= 5);
  const regularMembers = activeMembersFilter === "todos" ? activeMembers : visibleMembers;
  const membersSectionDetail = activeMembersFilter === "todos"
    ? `${members.length} ${members.length === 1 ? "membro" : "membros"}${priorityMembers.length > 0 ? ` · ${priorityMembers.length} em atenção` : ""}`
    : `${visibleMembers.length} ${visibleMembers.length === 1 ? "pessoa neste recorte" : "pessoas neste recorte"}`;
  const canEditGroup = canManageGroups(user);
  const savedMessage = savedParam === "celula-criada"
    ? "Célula criada."
    : savedParam === "celula-atualizada"
      ? "Célula atualizada."
      : null;

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: navIndicator })}
    >
      <div className="group-detail-page">
        <BackLink href={backHref}>{backLabel}</BackLink>

        {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

        {canEditGroup ? (
          <div className="mb-4 flex justify-end">
            <Link
              href={`/celulas/${group.id}/editar`}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98]"
            >
              Editar célula
            </Link>
          </div>
        ) : null}

        <section className="group-detail-hero">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Célula</p>
            <h2 className="mt-1 text-[1.45rem] font-extrabold leading-tight tracking-[-0.02em] text-[var(--color-text-primary)]">{group.name}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              Liderança: {leadershipName}
              {supervisionName ? ` · Supervisão: ${supervisionName}` : ""}
            </p>
          </div>
          <p className="group-detail-hero-chip mt-3">
            {groupMeetingText(group.meetingDayOfWeek, group.meetingTime)}
            {group.locationName ? ` · ${group.locationName}` : ""}
          </p>
        </section>

        <div className="group-detail-pulse">
          <PulseCard
            title={pastoralPulse.title}
            subtitle={pastoralPulse.subtitle}
            tone={pastoralPulse.tone}
          />
        </div>

        <div className="group-detail-summary">
          <ContextSummary
            variant="balanced"
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
                tone: presenceTone(hasRecentPresence, presence.presenceRate),
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

        <section id="membros" className="scroll-mt-6">
          <SectionTitle detail={membersSectionDetail}>Membros</SectionTitle>
          <div className="group-member-filter-row mb-3">
            {MEMBERS_FILTERS.map((option) => {
              const active = option.value === activeMembersFilter;

              return (
                <Link
                  key={option.value}
                  href={membersFilterHref(`/celulas/${group.id}`, option.value)}
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
                    moreLabel="Ver mais pessoas em atenção"
                    lessLabel="Mostrar menos pessoas em atenção"
                  >
                    {priorityMembers.map((member) => (
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
                    initialCount={5}
                    step={5}
                    moreLabel="Ver mais membros"
                    lessLabel="Mostrar menos membros"
                  >
                    {regularMembers.map((member) => (
                      <PersonMiniCard
                        key={member.membershipId}
                        href={`/pessoas/${member.personId}`}
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
                    key={member.membershipId}
                    href={`/pessoas/${member.personId}`}
                    initials={member.initials}
                    name={member.name}
                    context={member.subtitle}
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

        <section>
          <SectionTitle>Últimos encontros registrados</SectionTitle>
          <div className="group-detail-list">
            <ProgressiveList
              initialCount={4}
              step={4}
              moreLabel="Ver mais encontros"
              lessLabel="Mostrar menos encontros"
            >
              {completedEvents.map((event) => {
              const metrics = summarizeEventPresence(event);
              const presenceBadgeTone = presenceTone(metrics.hasPresenceData, metrics.presenceRate);
              const presenceLabel = metrics.hasPresenceData ? `${metrics.presenceRate}%` : "Sem registro";
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
