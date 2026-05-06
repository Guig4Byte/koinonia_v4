import Link from "next/link";
import { isAfter } from "date-fns";
import { notFound } from "next/navigation";
import { AttendanceStatus } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { CheckInList } from "@/components/check-in-list";
import { BackLink, ContextSummary, InfoCard, SectionTitle } from "@/components/cards";
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

function presenceSummaryTone(hasPresenceData: boolean, presenceRate: number): "ok" | "warn" | "risk" | "neutral" {
  if (!hasPresenceData) return "neutral";
  if (presenceRate < 50) return "risk";
  if (presenceRate < 70) return "warn";
  return "ok";
}

function sortMembersByName<T extends { fullName: string }>(members: T[]) {
  return [...members].sort((left, right) => left.fullName.localeCompare(right.fullName, "pt-BR"));
}

function AttendanceMemberRow({ member }: { member: ReadOnlyMember }) {
  return (
    <Link
      href={`/pessoas/${member.personId}`}
      className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 transition active:scale-[0.99]"
    >
      <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">{member.fullName}</span>
      <Badge tone={statusTone(member.currentStatus)} className="px-2 py-0.5 text-[11px]">
        {member.currentStatus ? attendanceLabels[member.currentStatus] : "Pendente"}
      </Badge>
    </Link>
  );
}

function AttendanceGroup({
  title,
  members,
  description,
}: {
  title: string;
  members: ReadOnlyMember[];
  description: string;
}) {
  if (members.length === 0) return null;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
      </div>
      <div className="space-y-1.5">
        {members.map((member) => (
          <AttendanceMemberRow key={member.personId} member={member} />
        ))}
      </div>
    </div>
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

  const absentMembers = sortMembersByName(members.filter((member) => member.currentStatus === AttendanceStatus.ABSENT));
  const justifiedMembers = sortMembersByName(members.filter((member) => member.currentStatus === AttendanceStatus.JUSTIFIED));
  const pendingMembers = sortMembersByName(members.filter((member) => !member.currentStatus));
  const presentMembers = sortMembersByName(members.filter((member) => member.currentStatus === AttendanceStatus.PRESENT));
  const memberSummary = [
    countLabel(members.length, "membro"),
    countLabel(presentMembers.length, "presente"),
    countLabel(absentMembers.length, "ausente"),
    justifiedMembers.length > 0 ? justifiedCountLabel(justifiedMembers.length) : null,
    pendingMembers.length > 0 ? countLabel(pendingMembers.length, "pendente") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hasPriorityAttention = absentMembers.length > 0 || justifiedMembers.length > 0 || pendingMembers.length > 0;

  return (
    <section className="space-y-3">
      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <p className="font-semibold text-[var(--color-text-primary)]">Membros</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{memberSummary}</p>

        <div className="mt-4 space-y-4">
          <AttendanceGroup
            title={`Ausentes (${absentMembers.length})`}
            description="Quem faltou neste encontro."
            members={absentMembers}
          />

          <AttendanceGroup
            title={`Justificaram (${justifiedMembers.length})`}
            description="Quem avisou e justificou a ausência."
            members={justifiedMembers}
          />

          <AttendanceGroup
            title={`Pendentes (${pendingMembers.length})`}
            description="Membros ainda sem marcação explícita."
            members={pendingMembers}
          />

          {!hasPriorityAttention ? (
            <p className="rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
              Nenhuma ausência, justificativa ou pendência registrada.
            </p>
          ) : null}
        </div>

        {presentMembers.length > 0 ? (
          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] px-3 py-2 text-sm transition active:scale-[0.99]">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Presentes ({presentMembers.length})</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  Quem esteve no encontro. Abra só se quiser conferir a lista completa.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
                <span className="group-open:hidden">Mostrar</span>
                <span className="hidden group-open:inline">Ocultar</span>
              </span>
            </summary>
            <div className="mt-2 space-y-1.5">
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
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Pessoas novas ou visitantes marcados neste encontro.
          </p>
          <div className="mt-3 space-y-1.5">
            {sortMembersByName(visitors).map((visitor) => (
              <Link
                key={visitor.id}
                href={`/pessoas/${visitor.personId}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 transition active:scale-[0.99]"
              >
                <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">{visitor.fullName}</span>
                <Badge tone="info" className="px-2 py-0.5 text-[11px]">Visitante</Badge>
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
  const eventStatusLabel = completed ? "Presença registrada" : isFutureEvent ? "Agendado" : canEditCheckIn ? "Presença pendente" : "Aguardando registro";
  const eventStatusTone = completed ? "ok" : isFutureEvent ? "info" : "warn";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "events" })}
    >
      <BackLink href="/eventos">Encontros</BackLink>

      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              {checkInLabel}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{event.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {event.group?.name ?? "Encontro geral"} · {formatShortDate(event.startsAt)}, {formatTime(event.startsAt)}
            </p>
            {event.group ? (
              <Link href={`/celulas/${event.group.id}`} className="mt-3 inline-flex text-sm font-semibold text-[var(--color-brand)]">
                Abrir célula →
              </Link>
            ) : null}
          </div>
          <Badge tone={eventStatusTone}>{eventStatusLabel}</Badge>
        </div>

        <div className="mt-4">
          <ContextSummary
            surface="inset"
            variant="balanced"
            items={[
              {
                label: "Presença",
                detail: hasPresenceData ? "Ritmo do encontro registrado." : "Ainda sem presença registrada.",
                value: hasPresenceData ? `${presence.presenceRate}%` : "—",
                tone: presenceSummaryTone(hasPresenceData, presence.presenceRate),
              },
              {
                label: "Visitantes",
                detail: visitors.length > 0 ? "Pessoas novas ou visitantes marcados." : "Nenhum visitante marcado neste encontro.",
                value: String(visitors.length),
                tone: "neutral",
              },
              {
                label: "Membros da célula",
                detail: "Base do encontro, sem contar visitantes.",
                value: String(members.length),
                tone: "neutral",
              },
            ]}
          />
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
