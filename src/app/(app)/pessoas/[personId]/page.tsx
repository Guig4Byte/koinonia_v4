import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus, CareKind, PersonStatus, SignalSeverity } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { CareActions } from "@/components/care-actions";
import { SectionTitle } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { canViewGroup, canViewPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

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

const personStatusLabels: Record<PersonStatus, string> = {
  ACTIVE: "Ativo",
  VISITOR: "Visitante",
  NEW: "Novo",
  NEEDS_ATTENTION: "Em atenção",
  COOLING_AWAY: "Esfriando",
  INACTIVE: "Inativo",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function attendanceTone(status?: AttendanceStatus | null): "ok" | "warn" | "risk" | "info" {
  if (status === AttendanceStatus.PRESENT) return "ok";
  if (status === AttendanceStatus.JUSTIFIED) return "warn";
  if (status === AttendanceStatus.ABSENT) return "risk";
  return "info";
}

function signalTone(severity: SignalSeverity): "warn" | "risk" | "info" {
  if (severity === SignalSeverity.URGENT) return "risk";
  if (severity === SignalSeverity.ATTENTION) return "warn";
  return "info";
}

function statusTone(status: PersonStatus): "ok" | "warn" | "risk" | "info" {
  if (status === PersonStatus.ACTIVE) return "ok";
  if (status === PersonStatus.VISITOR || status === PersonStatus.NEW) return "info";
  if (status === PersonStatus.INACTIVE) return "warn";
  return "risk";
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

  const [signals, attendances, careTouches] = await Promise.all([
    prisma.careSignal.findMany({
      where: { ...visibleOpenSignalWhere, personId: person.id },
      include: { group: { include: { leader: true, supervisor: true } } },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    }),
    prisma.attendance.findMany({
      where: { personId: person.id, event: visibleEventWhere },
      include: { event: { include: { group: true } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
      take: 8,
    }),
    prisma.careTouch.findMany({
      where: visibleCareTouchWhere,
      include: { actor: true, group: true },
      orderBy: { happenedAt: "desc" },
      take: 5,
    }),
  ]);

  const primaryMembership = person.memberships.find((membership) => canViewGroup(user, membership.group)) ?? person.memberships[0];
  const primaryGroup = primaryMembership?.group;
  const latestAttendance = attendances[0];
  const homeHref = user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor";
  const openSignalsCount = signals.length;

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: homeHref, label: "Visão", icon: "home" },
        { href: "/pessoas", label: "Pessoas", icon: "people", active: true, attention: openSignalsCount > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <Link href="/pessoas" className="mb-4 inline-flex text-sm font-semibold text-[var(--color-brand)]">
        ← Pessoas
      </Link>

      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
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
              <Badge tone={statusTone(person.status)}>{personStatusLabels[person.status]}</Badge>
            </div>

            {person.shortNote ? (
              <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-primary)]">
                {person.shortNote}
              </p>
            ) : null}
          </div>
        </div>

        <CareActions personId={person.id} phone={person.phone} />
      </section>

      <SectionTitle>Por que merece atenção</SectionTitle>
      <div className="space-y-3">
        {signals.map((signal) => (
          <article key={signal.id} className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{signal.reason}</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {signal.group?.name ?? primaryGroup?.name ?? "Sem célula"} · {formatShortDate(signal.detectedAt)}, {formatTime(signal.detectedAt)}
                </p>
              </div>
              <Badge tone={signalTone(signal.severity)}>{signal.severity === "URGENT" ? "Urgente" : "Atenção"}</Badge>
            </div>
            {signal.evidence ? <p className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{signal.evidence}</p> : null}
          </article>
        ))}

        {signals.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
            Nenhum motivo de atenção agora. Esta pessoa pode ser consultada normalmente pela busca.
          </p>
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
              <Badge tone="ok">Cuidado realizado</Badge>
            </div>
            {touch.note ? <p className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">{touch.note}</p> : null}
          </article>
        ))}

        {careTouches.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
            Nenhum contato registrado ainda. Use as ações acima quando houver ligação, WhatsApp ou cuidado real.
          </p>
        ) : null}
      </div>

      <SectionTitle>Última presença</SectionTitle>
      {latestAttendance ? (
        <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{latestAttendance.event.title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {latestAttendance.event.group?.name ?? "Evento"} · {formatShortDate(latestAttendance.event.startsAt)}, {formatTime(latestAttendance.event.startsAt)}
              </p>
            </div>
            <Badge tone={attendanceTone(latestAttendance.status)}>{attendanceLabels[latestAttendance.status]}</Badge>
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
          Ainda não há presença registrada para esta pessoa.
        </p>
      )}

      {primaryGroup ? (
        <>
          <SectionTitle>Contexto da célula</SectionTitle>
          <Link href={`/celulas/${primaryGroup.id}`} className="block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)] shadow-card transition active:scale-[0.99]">
            <p className="font-semibold text-[var(--color-text-primary)]">{primaryGroup.name}</p>
            <p className="mt-1">
              Líder: {primaryGroup.leader?.name ?? "não informado"}
              {primaryGroup.supervisor?.name ? ` · Supervisor: ${primaryGroup.supervisor.name}` : ""}
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--color-brand)]">Abrir célula →</p>
          </Link>
        </>
      ) : null}
    </AppShell>
  );
}
