import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus, CareKind, PersonStatus } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { CareActions } from "@/components/care-actions";
import { PersonStatusActions } from "@/components/person-status-actions";
import { BackLink, DetailLinkCard, EmptyState, SectionTitle, priorityCardClass } from "@/components/cards";
import { SignalSupportActions } from "@/components/signal-support-actions";
import { Badge } from "@/components/ui/badge";
import { canRegisterCare, canViewGroup, canViewPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { signalBadgeForViewer, signalDetailForViewer } from "@/features/signals/display";
import { isUrgentOrPastoralCase, sortSignalsForPastoralViewer } from "@/features/signals/sections";
import { summarizePresenceFromAttendances, summarizePresenceTrend } from "@/features/events/presence-summary";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

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

function monthPresenceCountLabel(presentCount: number, encountersCount: number) {
  if (encountersCount === 1) {
    return presentCount === 1 ? "1 vez presente em 1 encontro" : "Nenhuma presença em 1 encontro";
  }

  if (presentCount === 0) return `Nenhuma presença em ${encountersCount} encontros`;
  if (presentCount === 1) return `1 vez presente em ${encountersCount} encontros`;
  return `${presentCount} vezes presente em ${encountersCount} encontros`;
}

function monthPresenceTrendLabel(
  trend: { direction: "up" | "down"; delta: number },
  currentTone: "ok" | "warn" | "risk" | "neutral",
) {
  if (trend.direction === "up") return `Participação subiu ${trend.delta} pts em relação ao mês anterior.`;
  if (currentTone === "ok") return `Participação segue frequente, mas caiu ${trend.delta} pts em relação ao mês anterior.`;
  return `Participação caiu ${trend.delta} pts em relação ao mês anterior. Vale acompanhar de perto.`;
}

export default async function PersonDetailPage({ params }: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await params;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      memberships: {
        where: { leftAt: null },
        include: { group: { include: { leader: true, supervisor: true } } },
      },
    },
  });

  if (!person || person.churchId !== user.churchId) notFound();
  if (!canViewPerson(user, person)) notFound();

  const visibleOpenSignalWhere = getVisibleOpenSignalWhere(user);
  const visibleEventWhere = getVisibleEventWhere(user);
  const visibleCareTouchWhere = getVisibleCareTouchWhere(user, person.id);
  const referenceDate = new Date();
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const nextMonthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  const previousMonthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(referenceDate);
  const recordedEventWhere = {
    ...visibleEventWhere,
    startsAt: { lte: referenceDate },
  };

  const [signals, attendances, monthAttendances, previousMonthAttendances, careTouches] = await Promise.all([
    prisma.careSignal.findMany({
      where: { ...visibleOpenSignalWhere, personId: person.id },
      include: { assignedTo: true, group: { include: { leader: true, supervisor: true } } },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    }),
    prisma.attendance.findMany({
      where: { personId: person.id, event: recordedEventWhere },
      include: { event: { include: { group: true } } },
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
      include: { event: { include: { group: true } } },
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
      include: { event: { include: { group: true } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
    }),
    prisma.careTouch.findMany({
      where: visibleCareTouchWhere,
      include: { actor: true, group: true },
      orderBy: { happenedAt: "desc" },
      take: 5,
    }),
  ]);

  const primaryMembership = person.memberships.find((membership) => canViewGroup(user, membership.group));
  const primaryGroup = primaryMembership?.group;
  const latestAttendance = attendances[0];
  const homeHref = user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor";
  const openSignalsCount = signals.length;
  const hasCareTouch = careTouches.length > 0;
  const isPastorLike = user.role === "PASTOR" || user.role === "ADMIN";
  const isSupervisor = user.role === "SUPERVISOR";
  const secondaryNavHref = isPastorLike ? "/equipe" : isSupervisor ? "/celulas" : "/pessoas";
  const secondaryNavLabel = isPastorLike ? "Equipe" : isSupervisor ? "Células" : "Membros";
  const backHref = isPastorLike || isSupervisor ? homeHref : "/pessoas";
  const backLabel = isPastorLike || isSupervisor ? "Visão" : secondaryNavLabel;
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
      nav={[
        { href: homeHref, label: "Visão", icon: "home" },
        { href: secondaryNavHref, label: secondaryNavLabel, icon: "people", active: user.role === "LEADER", indicator: navIndicator },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <BackLink href={backHref}>{backLabel}</BackLink>

      <section className={`rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card ${priorityCardClass(personBadge.tone)}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-sm font-bold text-[var(--color-avatar-text)]">
            {initials(person.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-2xl font-semibold leading-tight text-[var(--color-text-primary)]">{person.fullName}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {primaryGroup?.name ?? "Sem célula"}
                  {primaryGroup?.leader?.name ? ` · ${primaryGroup.leader.name}` : ""}
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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Presença no mês</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Ritmo registrado em {monthLabel}.
            </p>
            {monthPresenceTrend ? (
              <p className={`mt-1 text-xs leading-relaxed ${presenceTrendToneClass(monthPresenceTrend.direction, monthPresenceTone)}`}>
                {monthPresenceTrendLabel(monthPresenceTrend, monthPresenceTone)}
              </p>
            ) : null}
          </div>
          <p className={`shrink-0 text-2xl font-bold tracking-[-0.02em] ${presenceToneClass(monthPresenceTone)}`}>
            {monthPresence.hasPresenceData ? `${monthPresence.presenceRate}%` : "—"}
            {monthPresenceTrend ? (
              <span
                className={`ml-1 align-middle text-xs font-bold ${presenceTrendToneClass(monthPresenceTrend.direction, monthPresenceTone)}`}
                aria-label={`${monthPresenceTrend.direction === "up" ? "subiu" : "caiu"} ${monthPresenceTrend.delta} pontos em relação ao mês anterior`}
                title={`${monthPresenceTrend.direction === "up" ? "Subiu" : "Caiu"} ${monthPresenceTrend.delta} pontos em relação ao mês anterior`}
              >
                {monthPresenceTrend.direction === "up" ? "↑" : "↓"} {monthPresenceTrend.delta} pts
              </span>
            ) : null}
          </p>
        </div>

        <div className="mt-3 border-t border-[var(--color-border-divider)] pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Últimos encontros do mês</p>
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
            <article key={signal.id} className={`rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card ${priorityCardClass(signalTone)}`}> 
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
        {careTouches.map((touch) => (
          <article key={touch.id} className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{careKindLabels[touch.kind]}</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {touch.actor?.name ?? "Koinonia"} · {formatShortDate(touch.happenedAt)}, {formatTime(touch.happenedAt)}
                </p>
              </div>
              <Badge tone="care">Cuidado realizado</Badge>
            </div>
            {touch.note ? <p className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">{touch.note}</p> : null}
          </article>
        ))}

        {careTouches.length === 0 ? (
          <EmptyState>Nenhum contato registrado ainda. Use as ações acima quando houver ligação, WhatsApp ou cuidado real.</EmptyState>
        ) : null}
      </div>

      <SectionTitle>Último encontro</SectionTitle>
      {latestAttendance ? (
        <DetailLinkCard
          href={`/eventos/${latestAttendance.event.id}`}
          title={latestAttendance.event.title}
          meta={`${latestAttendance.event.group?.name ?? "Evento"} · ${formatShortDate(latestAttendance.event.startsAt)}, ${formatTime(latestAttendance.event.startsAt)}`}
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
                Liderança: {primaryGroup.leader?.name ?? "não informada"}
                {primaryGroup.supervisor?.name ? ` · Supervisor: ${primaryGroup.supervisor.name}` : ""}
              </>
            }
            actionLabel="Abrir célula"
          />
        </>
      ) : null}
    </AppShell>
  );
}
