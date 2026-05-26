import { notFound } from "next/navigation";
import { CareKind, GroupResponsibilityRole, MembershipRole, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/layout/app-shell";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole, secondaryNavLabelForRole } from "@/features/navigation/app-nav";
import { CareActions } from "@/features/care/components/care-actions";
import { CareOverviewCard } from "@/features/care/components/care-overview-card";
import { careContactInfo } from "@/features/care/care-actions-view";
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
import { buildPersonCareOverviewView } from "@/features/people/person-care-overview";
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

const membershipRoleLabels: Record<MembershipRole, string> = {
  MEMBER: "Membro",
  VISITOR: "Visitante",
  HOST: "Anfitrião",
  LEADER: "Líder",
};

function membershipRoleLabel(role?: MembershipRole | null) {
  return role ? membershipRoleLabels[role] : "Pessoa";
}

function personProfileEyebrow({
  openSignalsCount,
  isInCare,
}: {
  openSignalsCount: number;
  isInCare: boolean;
}) {
  if (openSignalsCount > 0) return "Pessoa no radar";
  if (isInCare) return "Pessoa em cuidado";
  return "Perfil pastoral";
}

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

  const visibleMemberships = person.memberships.filter((membership) => canViewGroup(user, membership.group));
  const primaryMembership = visibleMemberships[0];
  const primaryGroup = primaryMembership?.group;
  const primaryLeadershipName = primaryGroup
    ? responsibilityNames(primaryGroup.responsibilities, GroupResponsibilityRole.LEADER, "")
    : "";
  const homeHref = homeHrefForRole(user.role);
  const openSignalsCount = signals.length;
  const hasCareTouch = careTouches.length > 0;
  const secondaryNavHref = secondaryNavHrefForRole(user.role);
  const secondaryNavLabel = secondaryNavLabelForRole(user.role);
  const isLeader = user.role === UserRole.LEADER;
  const backHref = isLeader ? secondaryNavHref : homeHref;
  const backLabel = isLeader ? secondaryNavLabel : "Visão";
  const personIsInCare = isInCarePerson(person);
  const canRegisterPersonCare = canRegisterCare(user, person);
  const canMarkActive = personIsInCare && canRegisterPersonCare && openSignalsCount === 0;
  const hasRiskSignal = signals.some(isUrgentOrPastoralCase);
  const navIndicator = hasRiskSignal ? "risk" : openSignalsCount > 0 ? "attention" : personIsInCare ? "care" : undefined;
  const pastoralOrderedSignals = sortSignalsForPastoralViewer(signals, user);
  const primarySignal = pastoralOrderedSignals[0];
  const personBadge = personEffectiveBadgeForViewer(person, primarySignal, user);
  const presenceView = buildPersonPresenceView(attendances);
  const profileEyebrow = personProfileEyebrow({ openSignalsCount, isInCare: personIsInCare });
  const primaryGroupName = groupNameOrFallback(primaryGroup);
  const primaryMembershipLabel = membershipRoleLabel(primaryMembership?.role);
  const personMeta = primaryGroup
    ? `${primaryMembershipLabel} · ${primaryGroupName}${primaryLeadershipName ? ` · ${primaryLeadershipName}` : ""}`
    : primaryMembershipLabel;
  const contactInfo = careContactInfo(person.phone);
  const careTouchHistoryItems: CareTouchHistoryItem[] = careTouches.map((touch) => ({
    id: touch.id,
    title: careKindLabels[touch.kind],
    actorName: touch.actor?.name ?? "Koinonia",
    happenedAtLabel: `${formatShortDate(touch.happenedAt)}, ${formatTime(touch.happenedAt)}`,
    contextLabel: touch.group?.name ?? null,
    note: touch.note,
  }));
  const careOverviewView = buildPersonCareOverviewView({
    openSignalsCount,
    hasRiskSignal,
    isInCare: personIsInCare,
    hasPhone: contactInfo.hasPhone,
    canRegisterCare: canRegisterPersonCare,
    primaryGroupName,
    primaryLeadershipName,
    assignedActorName: primarySignal?.assignedTo?.name,
  });
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
                  <p className={styles.eyebrow}>{profileEyebrow}</p>
                  <h2 className={styles.personTitle}>{person.fullName}</h2>
                  <p className={styles.personMeta}>{personMeta}</p>
                </div>
                <Badge tone={personBadge.tone} className={styles.personBadge}>{personBadge.label}</Badge>
              </div>

            </div>
          </div>
        </PriorityCard>

        <SectionTitle detail="O que precisa ser feito agora, sem repetir o histórico.">Próximo cuidado</SectionTitle>
        <CareOverviewCard id="registrar-cuidado" view={careOverviewView} className={styles.primaryCareCard}>
          <CareActions personId={person.id} phone={person.phone} className={styles.careActions} />
          {canMarkActive ? <PersonStatusActions personId={person.id} /> : null}
        </CareOverviewCard>

        <SectionTitle detail={openSignalsCount > 0 ? "Entenda o motivo antes de agir." : undefined}>
          {openSignalsCount > 0 ? "Por que merece atenção" : "Situação atual"}
        </SectionTitle>
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
                    {signal.group?.name ?? primaryGroupName} · {formatShortDate(signal.detectedAt)}, {formatTime(signal.detectedAt)}
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
            <EmptyState className={styles.emptyState} title="Nada exige ação agora.">
              {hasCareTouch
                ? "O cuidado mais recente aparece abaixo, e a pessoa continua disponível para acompanhamento pastoral."
                : "Esta pessoa segue disponível para consulta quando houver um contato real de cuidado."}
            </EmptyState>
          ) : null}
        </div>

        <SectionTitle>Ritmo de presença</SectionTitle>
        <PersonPresenceCard view={presenceView} />

        <div id="historico-cuidado" className={styles.anchorSection}>
          <SectionTitle detail="Linha do tempo dos contatos, anotações e encaminhamentos.">Histórico de cuidado</SectionTitle>
          {careTouchHistoryItems.length > 0 ? (
            <CareTouchHistory items={careTouchHistoryItems} />
          ) : (
            <EmptyState className={styles.emptyState}>{CARE_COPY.history.empty}</EmptyState>
          )}
        </div>

        {visibleMemberships.length > 0 ? (
          <>
            <SectionTitle>{visibleMemberships.length > 1 ? "Contexto das células" : "Contexto da célula"}</SectionTitle>
            <div className={styles.contextList}>
              {visibleMemberships.map((membership) => {
                const group = membership.group;
                const leadershipName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, "");
                const supervisionName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.SUPERVISOR, "");

                return (
                  <CardLink
                    key={membership.id}
                    href={ROUTES.group(group.id)}
                    priorityTone="muted"
                    className={styles.contextCard}
                  >
                    <div className={styles.contextHeader}>
                      <div className={styles.contextCopy}>
                        <p className={styles.contextTitle}>{group.name}</p>
                        <p className={styles.contextMeta}>
                          {membershipRoleLabel(membership.role)} · Liderança: {leadershipName || FALLBACK_LEADER_NAME}
                          {supervisionName ? ` · Supervisão: ${supervisionName}` : ""}
                        </p>
                      </div>
                      <span className={styles.contextAction}>Abrir célula →</span>
                    </div>
                  </CardLink>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
