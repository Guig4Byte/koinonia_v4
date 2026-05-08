import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus, CareKind, GroupResponsibilityRole, PersonStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole, secondaryNavLabelForRole } from "@/features/navigation/app-nav";
import { CareActions } from "@/components/care-actions";
import { PersonStatusActions } from "@/components/person-status-actions";
import { BackLink, DetailLinkCard, EmptyState, SectionTitle, priorityCardClass } from "@/components/cards";
import { SignalSupportActions } from "@/components/signal-support-actions";
import { CareTouchHistory, type CareTouchHistoryItem } from "@/components/care-touch-history";
import { Badge } from "@/components/ui/badge";
import { canRegisterCare, canViewGroup, canViewPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusChipForViewer } from "@/features/signals/escalation";
import { signalBadgeForViewer, signalDescriptionForViewer, signalDetailForViewer } from "@/features/signals/display";
import { isUrgentOrPastoralCase, sortSignalsForPastoralViewer } from "@/features/signals/sections";
import { summarizePresenceFromAttendances, summarizePresenceTrend } from "@/features/events/presence-summary";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { avatarColorForName, initials } from "@/lib/text";

const attendanceLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
  VISITOR: "Visitante",
};

const careKindLabels: Record<CareKind, string> = {
  CALL: "Contato feito",
  WHATSAPP: "Contato feito",
  VISIT: "Contato feito",
  PRAYER: "Contato feito",
  MARKED_CARED: "Contato feito",
  NOTE: "Anotação",
  REQUESTED_SUPPORT: "Pedido de apoio à supervisão",
  ESCALATED_TO_PASTOR: "Encaminhado ao cuidado pastoral",
};

function attendanceTone(status?: AttendanceStatus | null): "ok" | "warn" | "risk" | "info" {
  if (status === AttendanceStatus.PRESENT) return "ok";
  if (status === AttendanceStatus.JUSTIFIED) return "warn";
  if (status === AttendanceStatus.ABSENT) return "risk";
  return "info";
}

function presenceTone(hasPresenceData: boolean, presenceRate: number): "ok" | "warn" | "risk" | "neutral" {
  if (!hasPresenceData) return "neutral";
  if (presenceRate < 50) return "risk";
  if (presenceRate < 70) return "warn";
  return "ok";
}

function presenceToneClass(tone: "ok" | "warn" | "risk" | "neutral") {
  if (tone === "risk") return "text-[var(--color-metric-atencoes)]";
  if (tone === "warn") return "text-[var(--color-badge-atencao-text)]";
  if (tone === "ok") return "text-[var(--color-metric-presenca)]";
  return "text-[var(--color-text-primary)]";
}

function presenceTrendToneClass(direction: "up" | "down", currentTone: "ok" | "warn" | "risk" | "neutral") {
  if (direction === "up") return "text-[var(--color-metric-presenca)]";
  if (currentTone === "ok") return "text-[var(--color-badge-atencao-text)]";
  return "text-[var(--color-metric-atencoes)]";
}

function recentPresenceCountLabel(presentCount: number, encountersCount: number) {
  if (encountersCount === 1) {
    return presentCount === 1 ? "Presente no único encontro" : "Faltou no único encontro";
  }

  if (presentCount === 0) {
    return encountersCount === 1
      ? "Faltou no único encontro"
      : `Nenhuma presença em ${encountersCount} encontros`;
  }

  if (presentCount === encountersCount) {
    return encountersCount === 1
      ? "Presente no único encontro"
      : `Presente em todos os ${encountersCount} encontros`;
  }

  if (presentCount === 1) return `1 vez presente em ${encountersCount} encontros`;
  return `${presentCount} vezes presente em ${encountersCount} encontros`;
}

function recentPresenceTrendLabel(
  trend: { direction: "up" | "down"; delta: number },
  currentTone: "ok" | "warn" | "risk" | "neutral",
) {
  if (trend.direction === "up") return "Presença mais constante que nos encontros anteriores.";
  if (currentTone === "ok") return "Ainda há boa presença, mesmo com queda nos encontros recentes.";
  return "A presença caiu em relação aos encontros anteriores. Vale se aproximar com cuidado.";
}

function responsibilityNames(
  responsibilities: Array<{ role: GroupResponsibilityRole; user: { name: string } }>,
  role: GroupResponsibilityRole,
  fallback = "",
) {
  const names = responsibilities
    .filter((responsibility) => responsibility.role === role)
    .map((responsibility) => responsibility.user.name);

  return names.length > 0 ? names.join(" e ") : fallback;
}

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
      take: 12,
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
  const accountableRecentAttendances = attendances.filter((attendance) => attendance.status !== AttendanceStatus.VISITOR);
  const recentPresenceAttendances = accountableRecentAttendances.slice(0, 4);
  const previousRecentPresenceAttendances = accountableRecentAttendances.slice(4, 8);
  const recentPresence = summarizePresenceFromAttendances(recentPresenceAttendances);
  const previousRecentPresence = summarizePresenceFromAttendances(previousRecentPresenceAttendances);
  const recentPresenceTrend = summarizePresenceTrend(recentPresence, previousRecentPresence);
  const recentPresenceTone = presenceTone(recentPresence.hasPresenceData, recentPresence.presenceRate);
  const hiddenRecentAttendancesCount = Math.max(accountableRecentAttendances.length - recentPresenceAttendances.length, 0);
  const hasPartialTrendHistory = previousRecentPresence.accountableCount > 0 && previousRecentPresence.accountableCount < 3;
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
      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Presença recente</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {recentPresence.hasPresenceData
                ? "Ritmo dos últimos encontros registrados. Ajuda a perceber se vale se aproximar."
                : "Ainda sem presença registrada em encontros recentes."}
            </p>
            {recentPresenceTrend ? (
              <p className={`mt-1 text-xs leading-relaxed ${presenceTrendToneClass(recentPresenceTrend.direction, recentPresenceTone)}`}>
                {recentPresenceTrendLabel(recentPresenceTrend, recentPresenceTone)}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-[21px] font-bold leading-none tracking-[-0.02em] ${presenceToneClass(recentPresenceTone)}`}>
              {recentPresence.hasPresenceData ? `${recentPresence.presenceRate}%` : "—"}
            </p>
            {recentPresenceTrend ? (
              <p
                className={`mt-1 text-[13px] font-bold leading-none ${presenceTrendToneClass(recentPresenceTrend.direction, recentPresenceTone)}`}
                aria-label={`${recentPresenceTrend.direction === "up" ? "subiu" : "caiu"} ${recentPresenceTrend.delta} pontos em relação aos encontros anteriores`}
                title={`${recentPresenceTrend.direction === "up" ? "Subiu" : "Caiu"} ${recentPresenceTrend.delta} pontos em relação aos encontros anteriores`}
              >
                {recentPresenceTrend.direction === "up" ? "↑" : "↓"} {recentPresenceTrend.delta} pts
              </p>
            ) : null}
          </div>
        </div>

        {recentPresenceAttendances.length > 0 ? (
          <div className="mt-3 border-t border-[var(--color-border-divider)] pt-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Últimos encontros</p>
              <p className="shrink-0 text-xs text-[var(--color-text-secondary)]">
                {recentPresenceCountLabel(recentPresence.presentCount, recentPresence.accountableCount)}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {recentPresenceAttendances.map((attendance) => (
                <Link
                  key={attendance.id}
                  href={`/eventos/${attendance.event.id}`}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-[var(--surface-alt)] px-3 py-2 transition active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                      {formatShortDate(attendance.event.startsAt)} · {formatTime(attendance.event.startsAt)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">
                      {attendance.event.group?.name ?? "Encontro"}
                    </span>
                  </span>
                  <Badge tone={attendanceTone(attendance.status)} className="px-2 py-0.5 text-[11px]">
                    {attendanceLabels[attendance.status]}
                  </Badge>
                </Link>
              ))}
            </div>
            {recentPresenceTrend ? (
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                Tendência comparada com os {previousRecentPresence.accountableCount} encontros anteriores.
              </p>
            ) : hasPartialTrendHistory ? (
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                Ainda sem histórico suficiente para comparar tendência.
              </p>
            ) : hiddenRecentAttendancesCount > 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                Mais {hiddenRecentAttendancesCount} {hiddenRecentAttendancesCount === 1 ? "encontro recente fica" : "encontros recentes ficam"} fora da lista resumida.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

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
