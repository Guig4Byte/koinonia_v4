import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus, PersonStatus, SignalSeverity, SignalStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, PersonSignalCard, SectionTitle } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { canViewGroup } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson, isPastoralSignal } from "@/features/signals/attention";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const personStatusLabels: Record<PersonStatus, string> = {
  ACTIVE: "Ativo",
  VISITOR: "Visitante",
  NEW: "Novo",
  NEEDS_ATTENTION: "Em atenção",
  COOLING_AWAY: "Esfriando",
  INACTIVE: "Inativo",
};

const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusTone(status: PersonStatus): "ok" | "warn" | "risk" | "info" {
  if (status === PersonStatus.ACTIVE) return "ok";
  if (status === PersonStatus.VISITOR || status === PersonStatus.NEW) return "info";
  return "warn";
}

function eventMetrics(event: { status: string; attendances: Array<{ status: AttendanceStatus }> }) {
  const accountable = event.attendances.filter((attendance) => attendance.status !== AttendanceStatus.VISITOR);
  const present = accountable.filter((attendance) => attendance.status === AttendanceStatus.PRESENT).length;
  const visitors = event.attendances.filter((attendance) => attendance.status === AttendanceStatus.VISITOR).length;
  const completed = event.status === "COMPLETED" || event.attendances.length > 0;

  return {
    completed,
    presenceRate: percent(present, accountable.length),
    visitors,
  };
}

function groupMeetingText(day?: number | null, time?: string | null) {
  if (day === null || day === undefined) return time ? `Horário: ${time}` : "Encontro sem horário fixo informado.";
  return `${dayLabels[day] ?? "Dia informado"}${time ? ` · ${time}` : ""}`;
}

function reasonForViewer(reason: string, role: UserRole) {
  if (role !== UserRole.LEADER) return reason;
  return reason.replace("Líder pediu apoio da supervisão", "Apoio solicitado à supervisão");
}

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await getCurrentUser();
  const { groupId } = await params;

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
  const attentionPeople = getPrimarySignalsByPerson(group.signals);
  const pastoralAttentionPeople = getPastoralSignalsByPerson(group.signals);
  const localAttentionPeople = attentionPeople.filter((signal) => !isPastoralSignal(signal));
  const attentionPersonIds = new Set(attentionPeople.map((signal) => signal.personId));
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const completedEvents = group.events.filter((event) => eventMetrics(event).completed);
  const accountableAttendances = completedEvents.flatMap((event) => event.attendances.filter((attendance) => attendance.status !== AttendanceStatus.VISITOR));
  const presentAttendances = accountableAttendances.filter((attendance) => attendance.status === AttendanceStatus.PRESENT);
  const presenceRate = percent(presentAttendances.length, accountableAttendances.length);
  const relevantEvent = selectRelevantCheckInEvent(group.events);
  const pendingEvent = relevantEvent && !hasRecordedPresence(relevantEvent) ? relevantEvent : null;
  const headerBadgeTone: "ok" | "warn" | "risk" = pastoralAttentionPeople.length > 0 ? "risk" : attentionPeople.length > 0 ? "warn" : "ok";
  const headerBadgeLabel = pastoralAttentionPeople.length > 0
    ? `${pastoralAttentionPeople.length} ${pastoralAttentionPeople.length === 1 ? "caso pastoral" : "casos pastorais"}`
    : attentionPeople.length > 0
      ? isPastorView ? "Atenções locais" : "Em atenção"
      : "Estável";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: homeHref, label: "Visão", icon: "home" },
        { href: "/pessoas", label: user.role === UserRole.LEADER ? "Membros" : "Pessoas", icon: "people", attention: attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <Link href={homeHref} className="mb-4 inline-flex text-sm font-semibold text-[var(--color-brand)]">
        ← Visão
      </Link>

      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Célula</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{group.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Líder: {group.leader?.name ?? "não informado"}
              {group.supervisor?.name ? ` · Supervisor: ${group.supervisor.name}` : ""}
            </p>
          </div>
          <Badge tone={headerBadgeTone}>{headerBadgeLabel}</Badge>
        </div>
        <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {groupMeetingText(group.meetingDayOfWeek, group.meetingTime)}
          {group.locationName ? ` · ${group.locationName}` : ""}
        </p>
      </section>

      <ContextSummary
        items={[
          { label: "Membros", value: String(group.memberships.length), detail: "Pessoas ativas nesta célula.", tone: "neutral" },
          {
            label: "Presença recente",
            value: completedEvents.length > 0 ? `${presenceRate}%` : "—",
            detail: completedEvents.length > 0 ? "Nos últimos encontros registrados." : "Ainda sem presença registrada.",
            tone: completedEvents.length === 0 ? "neutral" : presenceRate < 65 ? "risk" : presenceRate < 75 ? "warn" : "ok",
          },
          {
            label: isPastorView ? "Atenções da célula" : "Pessoas em atenção",
            value: String(attentionPeople.length),
            detail: isPastorView ? "Visíveis porque você abriu esta célula." : "Motivos ativos nesta célula.",
            tone: attentionPeople.length > 0 ? "warn" : "ok",
          },
        ]}
      />

      {isPastorView ? (
        <>
          <SectionTitle>Casos pastorais da célula</SectionTitle>
          <div className="space-y-3">
            {pastoralAttentionPeople.slice(0, 4).map((signal) => (
              <PersonSignalCard
                key={signal.id}
                initials={initials(signal.person.fullName)}
                name={signal.person.fullName}
                detailHref={`/pessoas/${signal.person.id}`}
                context="Membro da célula"
                reason={signal.reason}
                severity={signal.severity === SignalSeverity.URGENT ? "risk" : "warn"}
                ctaLabel="Abrir pessoa"
              />
            ))}
            {pastoralAttentionPeople.length === 0 ? (
              <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
                Nenhum caso urgente ou encaminhado ao pastor nesta célula.
              </p>
            ) : null}
          </div>

          <SectionTitle>Atenções locais da célula</SectionTitle>
          <div className="space-y-3">
            {localAttentionPeople.slice(0, 4).map((signal) => (
              <PersonSignalCard
                key={signal.id}
                initials={initials(signal.person.fullName)}
                name={signal.person.fullName}
                detailHref={`/pessoas/${signal.person.id}`}
                context="No cuidado do líder ou da supervisão"
                reason={signal.reason}
                severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
                ctaLabel="Abrir pessoa"
              />
            ))}
            {localAttentionPeople.length === 0 ? (
              <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
                Nenhuma atenção local fora dos casos pastorais agora.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <SectionTitle>Quem merece atenção</SectionTitle>
          <div className="space-y-3">
            {attentionPeople.slice(0, 4).map((signal) => (
              <PersonSignalCard
                key={signal.id}
                initials={initials(signal.person.fullName)}
                name={signal.person.fullName}
                detailHref={`/pessoas/${signal.person.id}`}
                context="Membro da célula"
                reason={reasonForViewer(signal.reason, user.role)}
                severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
                ctaLabel="Abrir pessoa"
              />
            ))}
            {attentionPeople.length === 0 ? (
              <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
                Nenhuma pessoa desta célula está em atenção agora.
              </p>
            ) : null}
          </div>
        </>
      )}

      <SectionTitle>Encontro pendente</SectionTitle>
      {pendingEvent ? (
        <Link href={`/eventos/${pendingEvent.id}`} className="block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{pendingEvent.title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {formatShortDate(pendingEvent.startsAt)}, {formatTime(pendingEvent.startsAt)}
              </p>
            </div>
            <Badge tone="warn">Presença pendente</Badge>
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--color-brand)]">Abrir encontro →</p>
        </Link>
      ) : (
        <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
          Nenhum encontro pendente encontrado para esta célula.
        </p>
      )}

      <SectionTitle>Últimos encontros</SectionTitle>
      <div className="space-y-3">
        {group.events.filter((event) => eventMetrics(event).completed).slice(0, 3).map((event) => {
          const metrics = eventMetrics(event);

          return (
            <Link key={event.id} href={`/eventos/${event.id}`} className="block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{event.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {formatShortDate(event.startsAt)}, {formatTime(event.startsAt)} · {metrics.visitors} {metrics.visitors === 1 ? "visitante" : "visitantes"}
                  </p>
                </div>
                <Badge tone="ok">{metrics.presenceRate}%</Badge>
              </div>
            </Link>
          );
        })}
        {completedEvents.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
            Ainda não há encontros registrados para resumir presença.
          </p>
        ) : null}
      </div>

      <SectionTitle>Membros</SectionTitle>
      <div className="space-y-2">
        {group.memberships.map((membership) => {
          const attentionSignal = attentionSignalByPersonId.get(membership.personId);
          const isInAttention = attentionPersonIds.has(membership.personId);
          const isPastoralAttention = attentionSignal ? isPastoralSignal(attentionSignal) : false;
          const memberBadgeLabel = isInAttention
            ? isPastorView
              ? isPastoralAttention ? "Caso pastoral" : "Atenção local"
              : "Em atenção"
            : personStatusLabels[membership.person.status];
          const memberBadgeTone: "ok" | "warn" | "risk" | "info" = isInAttention ? (isPastoralAttention ? "risk" : "warn") : statusTone(membership.person.status);

          return (
            <Link key={membership.id} href={`/pessoas/${membership.personId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]">
              <span className="min-w-0 text-sm font-semibold text-[var(--color-text-primary)]">{membership.person.fullName}</span>
              <Badge tone={memberBadgeTone}>{memberBadgeLabel}</Badge>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
