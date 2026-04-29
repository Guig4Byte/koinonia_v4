import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus, CareKind, PersonStatus } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { CareActions } from "@/components/care-actions";
import { PersonStatusActions } from "@/components/person-status-actions";
import { SectionTitle } from "@/components/cards";
import { SignalSupportActions } from "@/components/signal-support-actions";
import { Badge } from "@/components/ui/badge";
import { canRegisterCare, canViewGroup, canViewPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { signalBadgeForViewer, signalReasonForViewer } from "@/features/signals/display";
import { getPrimarySignalsByPerson } from "@/features/signals/attention";
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
      include: { assignedTo: true, group: { include: { leader: true, supervisor: true } } },
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

  const primaryMembership = person.memberships.find((membership) => canViewGroup(user, membership.group));
  const primaryGroup = primaryMembership?.group;
  const latestAttendance = attendances[0];
  const homeHref = user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor";
  const openSignalsCount = signals.length;
  const hasCareTouch = careTouches.length > 0;
  const peopleLabel = user.role === "LEADER" ? "Membros" : "Pessoas";
  const canMarkActive = person.status === PersonStatus.COOLING_AWAY && canRegisterCare(user, person);
  const primarySignal = getPrimarySignalsByPerson(signals)[0];
  const personBadge = personEffectiveBadgeForViewer(person, primarySignal, user);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: homeHref, label: "Visão", icon: "home" },
        { href: "/pessoas", label: peopleLabel, icon: "people", active: true, attention: openSignalsCount > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <Link href="/pessoas" className="mb-4 inline-flex text-sm font-semibold text-[var(--color-brand)]">
        ← {peopleLabel}
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

      <SectionTitle>{openSignalsCount > 0 ? "Por que merece atenção" : "Situação atual"}</SectionTitle>
      <div className="space-y-3">
        {signals.map((signal) => {
          const signalBadge = signalBadgeForViewer(signal, user);
          const assignmentMessage = escalationStatusDetailForViewer(signal, user);
          const canRequestSupervisor = canRequestSupervisorSupport(user, signal);
          const canEscalatePastor = canEscalateSignalToPastor(user, signal);

          return (
            <article key={signal.id} className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)]">{signalReasonForViewer(signal.reason, user)}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {signal.group?.name ?? primaryGroup?.name ?? "Sem célula"} · {formatShortDate(signal.detectedAt)}, {formatTime(signal.detectedAt)}
                  </p>
                </div>
                <Badge tone={signalBadge.tone} className="self-start">{signalBadge.label}</Badge>
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
          <article className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
            <p className="font-semibold text-[var(--color-text-primary)]">Sem motivo de atenção agora.</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {hasCareTouch
                ? "O cuidado mais recente aparece abaixo. A pessoa continua no radar enquanto estiver em cuidado."
                : "Esta pessoa pode ser consultada normalmente pela busca."}
            </p>
          </article>
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
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
            Nenhum contato registrado ainda. Use as ações acima quando houver ligação, WhatsApp ou cuidado real.
          </p>
        ) : null}
      </div>

      <SectionTitle>Última presença</SectionTitle>
      {latestAttendance ? (
        <Link href={`/eventos/${latestAttendance.event.id}`} className="block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{latestAttendance.event.title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {latestAttendance.event.group?.name ?? "Evento"} · {formatShortDate(latestAttendance.event.startsAt)}, {formatTime(latestAttendance.event.startsAt)}
              </p>
            </div>
            <Badge tone={attendanceTone(latestAttendance.status)}>{attendanceLabels[latestAttendance.status]}</Badge>
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--color-brand)]">Abrir encontro →</p>
        </Link>
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
