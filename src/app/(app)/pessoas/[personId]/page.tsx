import { notFound } from "next/navigation";
import { CareKind, GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/layout/app-shell";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole, secondaryNavLabelForRole } from "@/features/navigation/app-nav";
import { CareActions } from "@/features/care/components/care-actions";
import { CARE_COPY } from "@/features/care/care-copy";
import { PersonStatusActions } from "@/features/care/components/person-status-actions";
import { BackLink, EmptyState, SectionTitle } from "@/components/shared/base-cards";
import { SignalSupportActions } from "@/features/signals/components/signal-support-actions";
import { CareTouchHistory, type CareTouchHistoryItem } from "@/features/care/components/care-touch-history";
import { PersonPresenceCard } from "@/features/people/components/person-presence-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CardLink } from "@/components/ui/card-link";
import { PriorityCard } from "@/components/ui/priority-card";
import { canRegisterCare, canViewGroup, canViewPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT, buildPersonPresenceView, careKindLabels } from "@/features/people/person-detail-view";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusChipForViewer } from "@/features/signals/escalation";
import { signalBadgeForViewer, signalDescriptionForViewer, signalTitleForViewer } from "@/features/signals/display";
import { isUrgentOrPastoralCase, sortSignalsForPastoralViewer } from "@/features/signals/sections";
import { groupNameOrFallback, FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { activeGroupResponsibilitiesInclude } from "@/features/groups/group-query";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { isInCarePerson } from "@/features/people/person-status";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/routes";
import styles from "./person-detail-page.module.css";

export default async function PersonDetailPage({ params }: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await params;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      memberships: {
        where: { leftAt: null },
        include: { group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
      },
    },
  });

  if (!person || person.churchId !== user.churchId) notFound();
  if (!canViewPerson(user, person)) notFound();

  const visibleOpenSignalWhere = getVisibleOpenSignalWhere(user);
  const visibleEventWhere = getVisibleEventWhere(user);
  const visibleCareTouchWhere = getVisibleCareTouchWhere(user, person.id);
  const referenceDate = new Date();
  const recordedEventWhere = {
    ...visibleEventWhere,
    startsAt: { lte: referenceDate },
  };

  const [signals, attendances, careTouches] = await Promise.all([
    prisma.careSignal.findMany({
      where: { ...visibleOpenSignalWhere, personId: person.id },
      include: { assignedTo: true, group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    }),
    prisma.attendance.findMany({
      where: { personId: person.id, event: recordedEventWhere },
      include: { event: { include: { group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
      take: PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT,
    }),
    prisma.careTouch.findMany({
      where: visibleCareTouchWhere,
      include: { actor: true, group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
      orderBy: { happenedAt: "desc" },
    }),
  ]);

  const primaryMembership = person.memberships.find((membership) => canViewGroup(user, membership.group));
  const primaryGroup = primaryMembership?.group;
  const primaryLeadershipName = primaryGroup
    ? responsibilityNames(primaryGroup.responsibilities, GroupResponsibilityRole.LEADER, "")
    : "";
  const primarySupervisionName = primaryGroup
    ? responsibilityNames(primaryGroup.responsibilities, GroupResponsibilityRole.SUPERVISOR, "")
    : "";
  const homeHref = homeHrefForRole(user.role);
  const openSignalsCount = signals.length;
  const hasCareTouch = careTouches.length > 0;
  const secondaryNavHref = secondaryNavHrefForRole(user.role);
  const secondaryNavLabel = secondaryNavLabelForRole(user.role);
  const isLeader = user.role === UserRole.LEADER;
  const backHref = isLeader ? secondaryNavHref : homeHref;
  const backLabel = isLeader ? secondaryNavLabel : "Visão";
  const canMarkActive = isInCarePerson(person) && canRegisterCare(user, person);
  const hasRiskSignal = signals.some(isUrgentOrPastoralCase);
  const navIndicator = hasRiskSignal ? "risk" : openSignalsCount > 0 ? "attention" : isInCarePerson(person) ? "care" : undefined;
  const pastoralOrderedSignals = sortSignalsForPastoralViewer(signals, user);
  const primarySignal = pastoralOrderedSignals[0];
  const personBadge = personEffectiveBadgeForViewer(person, primarySignal, user);
  const presenceView = buildPersonPresenceView(attendances);
  const careTouchHistoryItems: CareTouchHistoryItem[] = careTouches.map((touch) => ({
    id: touch.id,
    title: careKindLabels[touch.kind],
    actorName: touch.actor?.name ?? "Koinonia",
    happenedAtLabel: `${formatShortDate(touch.happenedAt)}, ${formatTime(touch.happenedAt)}`,
    note: touch.note,
  }));
  const pastoralEscalationActorByGroupId = new Map<string, string>();
  let pastoralEscalationActorWithoutGroup: string | undefined;

  for (const touch of careTouches) {
    if (touch.kind !== CareKind.ESCALATED_TO_PASTOR) continue;

    const actorName = touch.actor?.name;
    if (!actorName) continue;

    if (touch.groupId) {
      if (!pastoralEscalationActorByGroupId.has(touch.groupId)) {
        pastoralEscalationActorByGroupId.set(touch.groupId, actorName);
      }
    } else if (!pastoralEscalationActorWithoutGroup) {
      pastoralEscalationActorWithoutGroup = actorName;
    }
  }

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: isLeader ? "secondary" : "none", indicator: navIndicator })}
      headerVariant="compact"
    >
      <div className={styles.page}>
      <BackLink href={backHref} className={styles.backLink}>{backLabel}</BackLink>

      <PriorityCard as="section" priorityTone={personBadge.tone} radius="lg" className={cn("card-hover-lift", styles.personHero)}>
        <div className={styles.personHeroContent}>
          <Avatar name={person.fullName} size="xl" className={styles.avatar} />
          <div className={styles.personMain}>
            <div className={styles.personHeader}>
              <div className={styles.personTitleBlock}>
                <p className={styles.eyebrow}>Pessoa</p>
                <h2 className={styles.personTitle}>{person.fullName}</h2>
                <p className={styles.personMeta}>
                  {groupNameOrFallback(primaryGroup)}
                  {primaryLeadershipName ? ` · ${primaryLeadershipName}` : ""}
                </p>
              </div>
              <Badge tone={personBadge.tone} className={styles.personBadge}>{personBadge.label}</Badge>
            </div>

            {person.shortNote ? (
              <p className={styles.shortNote}>
                {person.shortNote}
              </p>
            ) : null}
          </div>
        </div>

        <CareActions personId={person.id} phone={person.phone} />
        {canMarkActive ? <PersonStatusActions personId={person.id} /> : null}
      </PriorityCard>

      <SectionTitle>Ritmo de presença</SectionTitle>
      <PersonPresenceCard view={presenceView} />

      <SectionTitle>{openSignalsCount > 0 ? "Por que merece atenção" : "Situação atual"}</SectionTitle>
      <div className={styles.sectionStack}>
        {pastoralOrderedSignals.map((signal) => {
          const pastoralEscalationActorName = signal.groupId
            ? pastoralEscalationActorByGroupId.get(signal.groupId)
            : pastoralEscalationActorWithoutGroup;
          const signalForDisplay = { ...signal, pastoralEscalationActorName };
          const signalTone = signalBadgeForViewer(signalForDisplay, user).tone;
          const signalDescription = signalDescriptionForViewer(signalForDisplay, user, { useDetailedDescription: true });
          const assignmentMessage = escalationStatusChipForViewer(signalForDisplay, user);
          const canRequestSupervisor = canRequestSupervisorSupport(user, signal);
          const canEscalatePastor = canEscalateSignalToPastor(user, signal);

          return (
            <PriorityCard key={signal.id} priorityTone={signalTone} className={cn("card-hover-lift", styles.signalCard)}>
              <div className={styles.signalHeader}>
                <p className={styles.signalTitle}>{signalTitleForViewer(signalForDisplay, user)}</p>
                <p className={styles.signalMeta}>
                  {signal.group?.name ?? groupNameOrFallback(primaryGroup)} · {formatShortDate(signal.detectedAt)}, {formatTime(signal.detectedAt)}
                </p>
              </div>
              {signalDescription ? <p className={styles.signalDescription}>{signalDescription}</p> : null}
              <SignalSupportActions
                signalId={signal.id}
                assignmentMessage={assignmentMessage}
                canRequestSupervisor={canRequestSupervisor}
                canEscalatePastor={canEscalatePastor}
              />
            </PriorityCard>
          );
        })}

        {openSignalsCount === 0 ? (
          <EmptyState className={styles.emptyState}>
            {hasCareTouch
              ? "Sem motivo de atenção agora. O cuidado mais recente aparece abaixo, e a pessoa continua no radar enquanto estiver em cuidado."
              : "Sem motivo de atenção agora. Esta pessoa pode ser consultada normalmente pela busca."}
          </EmptyState>
        ) : null}
      </div>

      <SectionTitle>Cuidado recente</SectionTitle>
      {careTouchHistoryItems.length > 0 ? (
        <CareTouchHistory items={careTouchHistoryItems} className={styles.historyCard} />
      ) : (
        <EmptyState className={styles.emptyState}>{CARE_COPY.history.empty}</EmptyState>
      )}

      {primaryGroup ? (
        <>
          <SectionTitle>Contexto da célula</SectionTitle>
          <CardLink
            href={ROUTES.group(primaryGroup.id)}
            priorityTone="muted"
            className={styles.contextCard}
          >
            <div className={styles.contextHeader}>
              <div className={styles.contextCopy}>
                <p className={styles.contextTitle}>{primaryGroup.name}</p>
                <p className={styles.contextMeta}>
                  Liderança: {primaryLeadershipName || FALLBACK_LEADER_NAME}
                  {primarySupervisionName ? ` · Supervisão: ${primarySupervisionName}` : ""}
                </p>
              </div>
              <span className={styles.contextAction}>Abrir célula →</span>
            </div>
          </CardLink>
        </>
      ) : null}
      </div>
    </AppShell>
  );
}
