import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { CheckInList } from "@/components/check-in-list";
import { SectionTitle } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { canCheckInEvent, canViewEvent } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime, percent } from "@/lib/format";
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
  fullName: string;
};

function EventReadOnlySummary({
  completed,
  members,
  visitors,
}: {
  completed: boolean;
  members: ReadOnlyMember[];
  visitors: ReadOnlyVisitor[];
}) {
  if (!completed) {
    return (
      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)] shadow-card">
        A presença ainda não foi registrada. O líder da célula faz o check-in; pastor e supervisor acompanham o resumo quando ele estiver pronto.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <p className="font-semibold text-[var(--color-text-primary)]">Membros</p>
        <div className="mt-3 space-y-2">
          {members.map((member) => (
            <div key={member.personId} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2">
              <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">{member.fullName}</span>
              <Badge tone={statusTone(member.currentStatus)}>
                {member.currentStatus ? attendanceLabels[member.currentStatus] : "Não marcado"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {visitors.length > 0 ? (
        <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
          <p className="font-semibold text-[var(--color-text-primary)]">Visitantes</p>
          <div className="mt-3 space-y-2">
            {visitors.map((visitor) => (
              <div key={visitor.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2">
                <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">{visitor.fullName}</span>
                <Badge tone="info">Visitante</Badge>
              </div>
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
  const accountable = event.attendances.filter((attendance) => attendance.status !== "VISITOR");
  const present = accountable.filter((attendance) => attendance.status === "PRESENT").length;
  const visitors = event.attendances.filter((attendance) => attendance.status === "VISITOR");
  const presenceRate = percent(present, accountable.length);
  const completed = event.status === "COMPLETED" || event.attendances.length > 0;

  const members = event.group?.memberships.map((membership) => ({
    personId: membership.personId,
    fullName: membership.person.fullName,
    currentStatus: event.attendances.find((attendance) => attendance.personId === membership.personId)?.status,
  })) ?? [];

  const visitorRows = visitors.map((attendance) => ({
    id: attendance.id,
    fullName: attendance.person.fullName,
  }));

  const checkInLabel = canEditCheckIn ? (completed ? "Ajuste de presença" : "Check-in") : "Resumo de presença";
  const checkInSectionTitle = canEditCheckIn ? (completed ? "Ajustar presença" : "Registrar presença") : "Resumo da presença";
  const checkInSubmitLabel = completed ? "Atualizar" : "Finalizar";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor", label: "Visão", icon: "home" },
        { href: "/pessoas", label: "Pessoas", icon: "people" },
        { href: "/eventos", label: "Eventos", icon: "calendar", active: true },
        { href: "#buscar", label: "Busca", icon: "search" },
      ]}
    >
      <Link href="/eventos" className="mb-4 inline-flex text-sm font-semibold text-[var(--color-brand)]">
        ← Eventos
      </Link>

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
          </div>
          <Badge tone={completed ? "ok" : "warn"}>{completed ? "feito" : "pendente"}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-[var(--metric-card-bg)] p-3">
            <p className="text-lg font-bold text-[var(--color-metric-presenca)]">{presenceRate}%</p>
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
          <CheckInList eventId={event.id} members={members} initialVisitorCount={visitors.length} submitLabel={checkInSubmitLabel} />
        ) : (
          <EventReadOnlySummary completed={completed} members={members} visitors={visitorRows} />
        )
      ) : (
        <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
          Este evento não está vinculado a uma célula. O check-in completo entra depois.
        </p>
      )}
    </AppShell>
  );
}
