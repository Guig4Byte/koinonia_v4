import { notFound } from "next/navigation";
import { CareKind, GroupResponsibilityRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole, secondaryNavLabelForRole } from "@/features/navigation/app-nav";
import { CareActions } from "@/components/care-actions";
import { PersonStatusActions } from "@/components/person-status-actions";
import { BackLink, DetailLinkCard, EmptyState, SectionTitle } from "@/components/base-cards";
import { priorityCardClass } from "@/components/card-priority";
import { SignalSupportActions } from "@/components/signal-support-actions";
import { CareTouchHistory, type CareTouchHistoryItem } from "@/components/care-touch-history";
import { PersonPresenceCard } from "@/components/person-presence-card";
import { Badge } from "@/components/ui/badge";
import { canRegisterCare, canViewGroup, canViewPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT, buildPersonPresenceView, careKindLabels } from "@/features/people/person-detail-view";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusChipForViewer } from "@/features/signals/escalation";
import { signalBadgeForViewer, signalDescriptionForViewer, signalDetailForViewer } from "@/features/signals/display";
import { isUrgentOrPastoralCase, sortSignalsForPastoralViewer } from "@/features/signals/sections";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { avatarColorForName, initials } from "@/lib/text";

export default async function PersonDetailPage({ params }: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await params;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      memberships: {
        where: { leftAt: null },
        include: { group: { include: { leader: true, supervisor: true, responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } },
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
      include: { assignedTo: true, group: { include: { leader: true, supervisor: true, responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    }),
    prisma.attendance.findMany({
      where: { personId: person.id, event: recordedEventWhere },
      include: { event: { include: { group: { include: { responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
      take: PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT,
    }),
    prisma.careTouch.findMany({
      where: visibleCareTouchWhere,
      include: { actor: true, group: { include: { responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } },
      orderBy: { happenedAt: "desc" },
    }),
  ]);

  const primaryMembership = person.memberships.find((membership) => canViewGroup(user, membership.group));
  const primaryGroup = primaryMembership?.group;
  const primaryLeadershipName = primaryGroup
    ? responsibilityNames(primaryGroup.responsibilities, GroupResponsibilityRole.LEADER, primaryGroup.leader?.name ?? "")
    : "";
  const primarySupervisionName = primaryGroup
    ? responsibilityNames(primaryGroup.responsibilities, GroupResponsibilityRole.SUPERVISOR, primaryGroup.supervisor?.name ?? "")
    : "";
  const homeHref = homeHrefForRole(user.role);
  const openSignalsCount = signals.length;
  const hasCareTouch = careTouches.length > 0;
  const secondaryNavHref = secondaryNavHrefForRole(user.role);
  const secondaryNavLabel = secondaryNavLabelForRole(user.role);
  const isLeader = user.role === UserRole.LEADER;
  const backHref = isLeader ? secondaryNavHref : homeHref;
  const backLabel = isLeader ? secondaryNavLabel : "Visão";
  const canMarkActive = person.status === PersonStatus.COOLING_AWAY && canRegisterCare(user, person);
  const hasRiskSignal = signals.some(isUrgentOrPastoralCase);
  const navIndicator = hasRiskSignal ? "risk" : openSignalsCount > 0 ? "attention" : person.status === PersonStatus.COOLING_AWAY ? "care" : undefined;
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
    >
      <BackLink href={backHref}>{backLabel}</BackLink>

      <section className={`card-hover-lift rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card ${priorityCardClass(personBadge.tone)}`}>
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: avatarColorForName(person.fullName).bg, color: avatarColorForName(person.fullName).text }}
          >
            {initials(person.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-2xl font-semibold leading-tight text-[var(--color-text-primary)]">{person.fullName}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {primaryGroup?.name ?? "Sem célula"}
                  {primaryLeadershipName ? ` · ${primaryLeadershipName}` : ""}
                </p>
              </div>
              <Badge tone={personBadge.tone}>{personBadge.label}</Badge>
            </div>

            {person.shortNote ? (
              <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-primary)]">
                {person.shortNote}
              </p>
            ) : null}
          </div>
        </div>

        <CareActions personId={person.id} phone={person.phone} />
        {canMarkActive ? <PersonStatusActions personId={person.id} /> : null}
      </section>

      <SectionTitle>Ritmo de presença</SectionTitle>
      <PersonPresenceCard view={presenceView} />

      <SectionTitle>{openSignalsCount > 0 ? "Por que merece atenção" : "Situação atual"}</SectionTitle>
      <div className="space-y-3">
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
            <article key={signal.id} className={`card-hover-lift rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card ${priorityCardClass(signalTone)}`}>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text-primary)]">{signalDetailForViewer(signalForDisplay, user)}</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {signal.group?.name ?? primaryGroup?.name ?? "Sem célula"} · {formatShortDate(signal.detectedAt)}, {formatTime(signal.detectedAt)}
                </p>
              </div>
              {signalDescription ? <p className="mt-3 whitespace-pre-line border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{signalDescription}</p> : null}
              <SignalSupportActions
                signalId={signal.id}
                assignmentMessage={assignmentMessage}
                canRequestSupervisor={canRequestSupervisor}
                canEscalatePastor={canEscalatePastor}
              />
            </article>
          );
        })}

        {openSignalsCount === 0 ? (
          <EmptyState>
            {hasCareTouch
              ? "Sem motivo de atenção agora. O cuidado mais recente aparece abaixo, e a pessoa continua no radar enquanto estiver em cuidado."
              : "Sem motivo de atenção agora. Esta pessoa pode ser consultada normalmente pela busca."}
          </EmptyState>
        ) : null}
      </div>

      <SectionTitle>Cuidado recente</SectionTitle>
      {careTouchHistoryItems.length > 0 ? (
        <CareTouchHistory items={careTouchHistoryItems} />
      ) : (
        <EmptyState>Nenhum cuidado registrado ainda. Use “Já houve contato?” quando houver um contato real para guardar.</EmptyState>
      )}

      {primaryGroup ? (
        <>
          <SectionTitle>Contexto da célula</SectionTitle>
          <DetailLinkCard
            href={`/celulas/${primaryGroup.id}`}
            title={primaryGroup.name}
            meta={
              <>
                Liderança: {primaryLeadershipName || "não informada"}
                {primarySupervisionName ? ` · Supervisão: ${primarySupervisionName}` : ""}
              </>
            }
            actionLabel="Ver célula"
          />
        </>
      ) : null}
    </AppShell>
  );
}
