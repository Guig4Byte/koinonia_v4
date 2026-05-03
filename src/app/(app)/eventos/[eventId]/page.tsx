import Link from "next/link";
import { isAfter } from "date-fns";
import { notFound } from "next/navigation";
import { AttendanceStatus } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { CheckInList } from "@/components/check-in-list";
import { BackLink, InfoCard, SectionTitle } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { summarizeEventPresence } from "@/features/events/presence-summary";
import { canCheckInEvent, canViewEvent } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const attendanceLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
  VISITOR: "Visitante",
};

function statusTone(status?: AttendanceStatus | null): "ok" | "warn" | "risk" | "info" {
  if (status === AttendanceStatus.PRESENT) return "ok";
  if (status === AttendanceStatus.JUSTIFIED) return "warn";
  if (status === AttendanceStatus.ABSENT) return "risk";
  return "info";
}

type ReadOnlyMember = {
  personId: string;
  fullName: string;
  currentStatus?: AttendanceStatus | null;
};

type ReadOnlyVisitor = {
  id: string;
  personId: string;
  fullName: string;
};

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function justifiedCountLabel(count: number) {
  return count === 1 ? "1 justificou" : `${count} justificaram`;
}

function AttendanceMemberRow({ member }: { member: ReadOnlyMember }) {
  return (
    <Link
      href={`/pessoas/${member.personId}`}
      className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 transition active:scale-[0.99]"
    >
      <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">{member.fullName}</span>
      <Badge tone={statusTone(member.currentStatus)}>
        {member.currentStatus ? attendanceLabels[member.currentStatus] : "Pendente"}
      </Badge>
    </Link>
  );
}

function EventReadOnlySummary({
  completed,
  isFutureEvent,
  members,
  visitors,
}: {
  completed: boolean;
  isFutureEvent: boolean;
  members: ReadOnlyMember[];
  visitors: ReadOnlyVisitor[];
}) {
  if (!completed) {
    return (
      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)] shadow-card">
        {isFutureEvent
          ? "Este encontro ainda não começou. A presença poderá ser registrada depois que começar."
          : "A presença ainda não foi registrada. O líder da célula registra o encontro; pastor e supervisor acompanham o resumo quando ele estiver pronto."}
      </section>
    );
  }

  const absentMembers = members.filter((member) => member.currentStatus === AttendanceStatus.ABSENT);
  const justifiedMembers = members.filter((member) => member.currentStatus === AttendanceStatus.JUSTIFIED);
  const pendingMembers = members.filter((member) => !member.currentStatus);
  const presentMembers = members.filter((member) => member.currentStatus === AttendanceStatus.PRESENT);
  const attentionMembers = [...absentMembers, ...justifiedMembers, ...pendingMembers];
  const memberSummary = [
    countLabel(members.length, "membro"),
    countLabel(presentMembers.length, "presente"),
    countLabel(absentMembers.length, "ausente"),
    justifiedMembers.length > 0 ? justifiedCountLabel(justifiedMembers.length) : null,
    pendingMembers.length > 0 ? countLabel(pendingMembers.length, "pendente") : null,
  ].filter(Boolean).join(" · ");

  return (
    <section className="space-y-3">
      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <p className="font-semibold text-[var(--color-text-primary)]">Membros</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{memberSummary}</p>

        {attentionMembers.length > 0 ? (
          <div className="mt-3 space-y-2">
            {attentionMembers.map((member) => (
              <AttendanceMemberRow key={member.personId} member={member} />
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            Nenhuma ausência ou justificativa registrada.
          </p>
        )}

        {presentMembers.length > 0 ? (
          <details className="group mt-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-divider)] px-3 py-2 text-sm font-semibold text-[var(--color-brand)] transition active:scale-[0.99]">
              <span>{countLabel(presentMembers.length, "presente")}</span>
              <span>
                <span className="group-open:hidden">Ver presentes</span>
                <span className="hidden group-open:inline">Ocultar presentes</span>
              </span>
            </summary>
            <div className="mt-2 space-y-2">
              {presentMembers.map((member) => (
                <AttendanceMemberRow key={member.personId} member={member} />
              ))}
            </div>
          </details>
        ) : null}
      </div>

      {visitors.length > 0 ? (
        <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
          <p className="font-semibold text-[var(--color-text-primary)]">Visitantes</p>
          <div className="mt-3 space-y-2">
            {visitors.map((visitor) => (
              <Link
                key={visitor.id}
                href={`/pessoas/${visitor.personId}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 transition active:scale-[0.99]"
              >
                <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">{visitor.fullName}</span>
                <Badge tone="info">Visitante</Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: {
        include: {
          leader: true,
          supervisor: true,
          memberships: {
            where: { leftAt: null, role: { not: "VISITOR" } },
            include: { person: true },
          },
        },
      },
      attendances: { include: { person: true } },
    },
  });

  if (!event || event.churchId !== user.churchId) notFound();

  if (!canViewEvent(user, event)) notFound();

  const canEditCheckIn = canCheckInEvent(user, event);
  const presence = summarizeEventPresence(event);
  const visitors = event.attendances.filter((attendance) => attendance.status === "VISITOR");
  const completed = presence.hasPresenceData;
  const hasPresenceData = presence.hasPresenceData;

  const members = event.group?.memberships.map((membership) => ({
    personId: membership.personId,
    fullName: membership.person.fullName,
    currentStatus: event.attendances.find((attendance) => attendance.personId === membership.personId)?.status,
  })) ?? [];

  const visitorRows = visitors.map((attendance) => ({
    id: attendance.id,
    personId: attendance.personId,
    fullName: attendance.person.fullName,
  }));

  const isFutureEvent = isAfter(event.startsAt, new Date());
  const checkInLabel = canEditCheckIn ? (completed ? "Ajuste de presença" : "Registrar presença") : isFutureEvent ? "Encontro agendado" : "Resumo de presença";
  const checkInSectionTitle = canEditCheckIn ? (completed ? "Ajustar presença" : "Registrar presença") : isFutureEvent ? "Sobre o encontro" : "Resumo da presença";
  const checkInSubmitLabel = completed ? "Salvar ajuste" : "Salvar presença";
  const eventStatusLabel = completed ? "Presença registrada" : isFutureEvent ? "Agendado" : canEditCheckIn ? "Presença pendente" : "Presença ainda não registrada";
  const eventStatusTone = completed ? "ok" : isFutureEvent ? "info" : "warn";
  const isPastorLike = user.role === "PASTOR" || user.role === "ADMIN";
  const secondaryNavHref = isPastorLike ? "/equipe" : "/pessoas";
  const secondaryNavLabel = isPastorLike ? "Equipe" : user.role === "LEADER" ? "Membros" : "Pessoas";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor", label: "Visão", icon: "home" },
        { href: secondaryNavHref, label: secondaryNavLabel, icon: "people" },
        { href: "/eventos", label: "Eventos", icon: "calendar", active: true },
      ]}
    >
      <BackLink href="/eventos">Eventos</BackLink>

      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              {checkInLabel}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{event.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {event.group?.name ?? "Evento geral"} · {formatShortDate(event.startsAt)}, {formatTime(event.startsAt)}
            </p>
            {event.group ? (
              <Link href={`/celulas/${event.group.id}`} className="mt-3 inline-flex text-sm font-semibold text-[var(--color-brand)]">
                Abrir célula →
              </Link>
            ) : null}
          </div>
          <Badge tone={eventStatusTone}>{eventStatusLabel}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-[var(--metric-card-bg)] p-3">
            <p className="text-lg font-bold text-[var(--color-metric-presenca)]">{hasPresenceData ? `${presence.presenceRate}%` : "—"}</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">presença</p>
          </div>
          <div className="rounded-2xl bg-[var(--metric-card-bg)] p-3">
            <p className="text-lg font-bold text-[var(--color-metric-visitantes)]">{visitors.length}</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">visitantes</p>
          </div>
          <div className="rounded-2xl bg-[var(--metric-card-bg)] p-3">
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{members.length}</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">membros</p>
          </div>
        </div>
      </section>

      <SectionTitle>{checkInSectionTitle}</SectionTitle>
      {event.groupId ? (
        canEditCheckIn ? (
          <CheckInList
            eventId={event.id}
            members={members}
            initialVisitors={visitorRows}
            submitLabel={checkInSubmitLabel}
            mode={completed ? "adjust" : "register"}
            attentionHref={event.groupId ? `/celulas/${event.groupId}` : "/pessoas"}
            attentionLabel="Ver atenção da célula"
          />
        ) : (
          <EventReadOnlySummary completed={completed} isFutureEvent={isFutureEvent} members={members} visitors={visitorRows} />
        )
      ) : (
        <InfoCard>Este evento não está vinculado a uma célula. A presença completa entra depois.</InfoCard>
      )}
    </AppShell>
  );
}
