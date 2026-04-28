import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus, PersonStatus, SignalSeverity, SignalStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, PersonSignalCard, SectionTitle } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { canViewGroup } from "@/features/permissions/permissions";
import { getPrimarySignalsByPerson } from "@/features/signals/attention";
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
  if (status === PersonStatus.INACTIVE) return "warn";
  return "risk";
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
        include: { person: true },
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
  const attentionPeople = getPrimarySignalsByPerson(group.signals);
  const completedEvents = group.events.filter((event) => eventMetrics(event).completed);
  const accountableAttendances = completedEvents.flatMap((event) => event.attendances.filter((attendance) => attendance.status !== AttendanceStatus.VISITOR));
  const presentAttendances = accountableAttendances.filter((attendance) => attendance.status === AttendanceStatus.PRESENT);
  const presenceRate = percent(presentAttendances.length, accountableAttendances.length);
  const pendingEvent = group.events.find((event) => !eventMetrics(event).completed);

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
          <Badge tone={attentionPeople.length > 0 ? "warn" : "ok"}>{attentionPeople.length > 0 ? "Em atenção" : "Estável"}</Badge>
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
            label: "Pessoas em atenção",
            value: String(attentionPeople.length),
            detail: "Motivos pastorais ativos nesta célula.",
            tone: attentionPeople.length > 0 ? "warn" : "ok",
          },
        ]}
      />

      <SectionTitle>Quem merece atenção</SectionTitle>
      <div className="space-y-3">
        {attentionPeople.slice(0, 4).map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            detailHref={`/pessoas/${signal.person.id}`}
            context="Membro da célula"
            reason={signal.reason}
            severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
          />
        ))}
        {attentionPeople.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
            Nenhuma pessoa desta célula está em atenção agora.
          </p>
        ) : null}
      </div>

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
        {group.memberships.map((membership) => (
          <Link key={membership.id} href={`/pessoas/${membership.personId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]">
            <span className="min-w-0 text-sm font-semibold text-[var(--color-text-primary)]">{membership.person.fullName}</span>
            <Badge tone={statusTone(membership.person.status)}>{personStatusLabels[membership.person.status]}</Badge>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
