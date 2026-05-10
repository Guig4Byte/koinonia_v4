import Link from "next/link";
import { notFound } from "next/navigation";
import { EventType, GroupResponsibilityRole, MembershipRole, SignalStatus, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { BackLink, ContextSummary, InfoCard, PulseCard, SectionTitle } from "@/components/base-cards";
import { GroupPendingEventCard } from "@/components/group-pending-event-card";
import { GroupRegisteredEncountersList } from "@/components/group-registered-encounters-list";
import { MemberPriorityList } from "@/components/member-priority-list";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { isPresenceRecordedEvent, splitPresenceTrendSamples, summarizeEventsPresence, summarizePresenceTrend } from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import {
  buildGroupMemberDisplays,
  buildGroupMembersView,
  groupMeetingText,
  groupPastoralPulse,
  GROUP_DETAIL_EVENT_HISTORY_LIMIT,
  GROUP_REGULAR_MEMBER_INITIAL_COUNT,
  GROUP_REGULAR_MEMBER_STEP,
} from "@/features/groups/group-detail-view";
import { FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { activeGroupResponsibilitiesInclude } from "@/features/groups/group-query";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { isInCarePerson } from "@/features/people/person-status";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole } from "@/features/navigation/app-nav";
import { readMembersFilter } from "@/features/people/member-filters";
import { canManageGroups, canViewGroup, isGroupLeader } from "@/features/permissions/permissions";
import { getPastoralSectionSignalsByPerson, isSupportRequest, isUrgentOrPastoralCase } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { ROUTES } from "@/lib/routes";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GroupDetailPage({ params, searchParams }: GroupDetailPageProps) {
  const user = await getCurrentUser();
  const { groupId } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const activeMembersFilter = readMembersFilter(firstParam(queryParams.membros));
  const savedParam = firstParam(queryParams.salvo);

  const group = await prisma.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      responsibilities: activeGroupResponsibilitiesInclude,
      memberships: {
        where: { leftAt: null, role: { not: MembershipRole.VISITOR } },
        include: { person: true },
        orderBy: { person: { fullName: "asc" } },
      },
      signals: {
        where: { status: SignalStatus.OPEN },
        include: { person: true, assignedTo: true },
        orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      },
      events: {
        where: { type: EventType.CELL_MEETING },
        include: { attendances: true },
        orderBy: { startsAt: "desc" },
        take: GROUP_DETAIL_EVENT_HISTORY_LIMIT,
      },
    },
  });

  if (!group || !canViewGroup(user, group)) notFound();

  const leadershipName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, FALLBACK_LEADER_NAME);
  const supervisionName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.SUPERVISOR, "");

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
  const inCareCount = group.memberships.filter((membership) => isInCarePerson(membership.person)).length;
  const hasRiskSignal = urgentOrPastoralSignals.length > 0;
  const navIndicator = hasRiskSignal ? "risk" : attentionPeople.length > 0 ? "attention" : inCareCount > 0 ? "care" : undefined;
  const recordedPresenceEvents = group.events.filter((event) => event.startsAt <= referenceDate && isPresenceRecordedEvent(event));
  const { recentItems: recentPresenceEvents, previousItems: previousPresenceEvents } = splitPresenceTrendSamples(recordedPresenceEvents);
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
  const members = buildGroupMemberDisplays({
    memberships: group.memberships,
    attentionSignalsByPersonId: attentionSignalByPersonId,
    viewer: user,
  });
  const membersView = buildGroupMembersView(members, activeMembersFilter);
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
              href={ROUTES.editGroup(group.id)}
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
                value: formatPresenceRate(hasRecentPresence, presence.presenceRate),
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
          <GroupPendingEventCard
            event={pendingEvent}
            statusLabel={pendingEventStatusLabel}
            actionLabel={pendingEventActionLabel}
          />
        ) : null}

        <section id="membros" className="scroll-mt-6">
          <SectionTitle detail={membersView.sectionDetail}>Membros</SectionTitle>
          <MemberPriorityList
            basePath={ROUTES.group(group.id)}
            activeFilter={activeMembersFilter}
            priorityMembers={membersView.priorityMembers}
            regularMembers={membersView.regularMembers}
            keyForMember={(member) => member.membershipId}
            hrefForMember={(member) => ROUTES.person(member.personId)}
            priorityContextForMember={(member) => member.subtitle}
            filteredContextForMember={(member) => member.subtitle}
            priorityMoreLabel="Ver mais pessoas em atenção"
            priorityLessLabel="Mostrar menos pessoas em atenção"
            regularInitialCount={GROUP_REGULAR_MEMBER_INITIAL_COUNT}
            regularStep={GROUP_REGULAR_MEMBER_STEP}
          />
        </section>

        <GroupRegisteredEncountersList events={completedEvents} />
      </div>
    </AppShell>
  );
}
