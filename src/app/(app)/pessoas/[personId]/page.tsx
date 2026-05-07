import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus, CareKind, GroupResponsibilityRole, PersonStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole, secondaryNavLabelForRole } from "@/features/navigation/app-nav";
import { CareActions } from "@/components/care-actions";
import { PersonStatusActions } from "@/components/person-status-actions";
import { BackLink, DetailLinkCard, EmptyState, SectionTitle, priorityCardClass } from "@/components/cards";
import { SignalSupportActions } from "@/components/signal-support-actions";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { canRegisterCare, canViewGroup, canViewPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { signalBadgeForViewer, signalDetailForViewer } from "@/features/signals/display";
import { isUrgentOrPastoralCase, sortSignalsForPastoralViewer } from "@/features/signals/sections";
import { summarizePresenceFromAttendances, summarizePresenceTrend } from "@/features/events/presence-summary";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { formatBrasiliaMonthName, startOfBrasiliaMonth, startOfNextBrasiliaMonth, startOfPreviousBrasiliaMonth } from "@/lib/brasilia-time";
import { avatarColorForName, initials } from "@/lib/text";

const attendanceLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
  VISITOR: "Visitante",
};

const careKindLabels: Record<CareKind, string> = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  VISIT: "Visita",
  PRAYER: "Oração",
  MARKED_CARED: "Contato feito",
  NOTE: "Anotação",
  REQUESTED_SUPPORT: "Pedido de apoio",
  ESCALATED_TO_PASTOR: "Encaminhado ao pastor",
};

function careTouchBadge(kind: CareKind): { label: string; tone: BadgeTone } {
  if (kind === CareKind.REQUESTED_SUPPORT) return { label: "Apoio solicitado", tone: "support" };
  if (kind === CareKind.ESCALATED_TO_PASTOR) return { label: "Encaminhado", tone: "risk" };
  return { label: "Cuidado realizado", tone: "care" };
}

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

function monthPresenceCountLabel(presentCount: number, encountersCount: number) {
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

function monthPresenceTrendLabel(
  trend: { direction: "up" | "down"; delta: number },
  currentTone: "ok" | "warn" | "risk" | "neutral",
) {
  if (trend.direction === "up") return "Presença mais constante que no mês anterior.";
  if (currentTone === "ok") return "Ainda há boa presença, mesmo com queda em relação ao mês anterior.";
  return "A presença caiu em relação ao mês anterior. Vale se aproximar com cuidado.";
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
  const monthStart = startOfBrasiliaMonth(referenceDate);
  const nextMonthStart = startOfNextBrasiliaMonth(referenceDate);
  const previousMonthStart = startOfPreviousBrasiliaMonth(referenceDate);
  const monthLabel = formatBrasiliaMonthName(referenceDate);
  const recordedEventWhere = {
    ...visibleEventWhere,
    startsAt: { lte: referenceDate },
  };

  const [signals, attendances, monthAttendances, previousMonthAttendances, careTouches] = await Promise.all([
    prisma.careSignal.findMany({
      where: { ...visibleOpenSignalWhere, personId: person.id },
      include: { assignedTo: true, group: { include: { leader: true, supervisor: true, responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    }),
    prisma.attendance.findMany({
      where: { personId: person.id, event: recordedEventWhere },
      include: { event: { include: { group: { include: { responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
      take: 8,
    }),
    prisma.attendance.findMany({
      where: {
        personId: person.id,
        status: { not: AttendanceStatus.VISITOR },
        event: {
          ...recordedEventWhere,
          startsAt: { gte: monthStart, lt: nextMonthStart, lte: referenceDate },
        },
      },
      include: { event: { include: { group: { include: { responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
    }),
    prisma.attendance.findMany({
      where: {
        personId: person.id,
        status: { not: AttendanceStatus.VISITOR },
        event: {
          ...recordedEventWhere,
          startsAt: { gte: previousMonthStart, lt: monthStart },
        },
      },
      include: { event: { include: { group: { include: { responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
    }),
    prisma.careTouch.findMany({
      where: visibleCareTouchWhere,
      include: { actor: true, group: { include: { responsibilities: { where: { activeUntil: null }, include: { user: true }, orderBy: { createdAt: "asc" } } } } },
      orderBy: { happenedAt: "desc" },
      take: 5,
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
  const latestAttendance = attendances[0];
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
  const monthPresence = summarizePresenceFromAttendances(monthAttendances);
  const previousMonthPresence = summarizePresenceFromAttendances(previousMonthAttendances);
  const monthPresenceTrend = summarizePresenceTrend(monthPresence, previousMonthPresence);
  const monthPresenceTone = presenceTone(monthPresence.hasPresenceData, monthPresence.presenceRate);
  const recentMonthAttendances = monthAttendances.slice(0, 4);
  const hiddenMonthAttendancesCount = Math.max(monthAttendances.length - recentMonthAttendances.length, 0);

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
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Presença no mês</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Ritmo registrado em {monthLabel}. Ajuda a perceber se vale se aproximar.
            </p>
            {monthPresenceTrend ? (
              <p className={`mt-1 text-xs leading-relaxed ${presenceTrendToneClass(monthPresenceTrend.direction, monthPresenceTone)}`}>
                {monthPresenceTrendLabel(monthPresenceTrend, monthPresenceTone)}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-[21px] font-bold leading-none tracking-[-0.02em] ${presenceToneClass(monthPresenceTone)}`}>
              {monthPresence.hasPresenceData ? `${monthPresence.presenceRate}%` : "—"}
            </p>
            {monthPresenceTrend ? (
              <p
                className={`mt-1 text-[13px] font-bold leading-none ${presenceTrendToneClass(monthPresenceTrend.direction, monthPresenceTone)}`}
                aria-label={`${monthPresenceTrend.direction === "up" ? "subiu" : "caiu"} ${monthPresenceTrend.delta} pontos em relação ao mês anterior`}
                title={`${monthPresenceTrend.direction === "up" ? "Subiu" : "Caiu"} ${monthPresenceTrend.delta} pontos em relação ao mês anterior`}
              >
                {monthPresenceTrend.direction === "up" ? "↑" : "↓"} {monthPresenceTrend.delta} pts
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 border-t border-[var(--color-border-divider)] pt-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Encontros do mês</p>
            {monthPresence.hasPresenceData ? (
              <p className="shrink-0 text-xs text-[var(--color-text-secondary)]">
                {monthPresenceCountLabel(monthPresence.presentCount, monthPresence.accountableCount)}
              </p>
            ) : null}
          </div>

          {recentMonthAttendances.length > 0 ? (
            <>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {recentMonthAttendances.map((attendance) => (
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
              {hiddenMonthAttendancesCount > 0 ? (
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  Mais {hiddenMonthAttendancesCount} {hiddenMonthAttendancesCount === 1 ? "encontro deste mês entra" : "encontros deste mês entram"} no cálculo.
                </p>
              ) : null}
            </>
          ) : (
            <EmptyState compact>Ainda não há presença registrada neste mês.</EmptyState>
          )}
        </div>
      </section>

      <SectionTitle>{openSignalsCount > 0 ? "Por que merece atenção" : "Situação atual"}</SectionTitle>
      <div className="space-y-3">
        {pastoralOrderedSignals.map((signal) => {
          const signalTone = signalBadgeForViewer(signal, user).tone;
          const assignmentMessage = escalationStatusDetailForViewer(signal, user);
          const canRequestSupervisor = canRequestSupervisorSupport(user, signal);
          const canEscalatePastor = canEscalateSignalToPastor(user, signal);

          return (
            <article key={signal.id} className={`card-hover-lift rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card ${priorityCardClass(signalTone)}`}> 
              <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)]">{signalDetailForViewer(signal, user)}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {signal.group?.name ?? primaryGroup?.name ?? "Sem célula"} · {formatShortDate(signal.detectedAt)}, {formatTime(signal.detectedAt)}
                  </p>
              </div>
              {signal.evidence ? <p className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{signal.evidence}</p> : null}
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
      <div className="space-y-3">
        {careTouches.map((touch) => {
          const badge = careTouchBadge(touch.kind);

          return (
            <article key={touch.id} className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{careKindLabels[touch.kind]}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {touch.actor?.name ?? "Koinonia"} · {formatShortDate(touch.happenedAt)}, {formatTime(touch.happenedAt)}
                  </p>
                </div>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>
              {touch.note ? <p className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">{touch.note}</p> : null}
            </article>
          );
        })}

        {careTouches.length === 0 ? (
          <EmptyState>Nenhum contato registrado ainda. Use as ações acima quando houver ligação, WhatsApp ou cuidado real.</EmptyState>
        ) : null}
      </div>

      <SectionTitle>Último encontro</SectionTitle>
      {latestAttendance ? (
        <DetailLinkCard
          href={`/eventos/${latestAttendance.event.id}`}
          title={latestAttendance.event.title}
          meta={`${latestAttendance.event.group?.name ?? "Encontro"} · ${formatShortDate(latestAttendance.event.startsAt)}, ${formatTime(latestAttendance.event.startsAt)}`}
          badgeLabel={attendanceLabels[latestAttendance.status]}
          badgeTone={attendanceTone(latestAttendance.status)}
          actionLabel="Abrir encontro"
        />
      ) : (
        <EmptyState>Ainda não há presença registrada para esta pessoa.</EmptyState>
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
