import Link from "next/link";
import { notFound } from "next/navigation";
import { SignalSeverity, SignalStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { ContextSummary, PersonSignalCard, SectionTitle } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { summarizeEventPresence, summarizeEventsPresence } from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canViewGroup } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson, isPastoralSignal } from "@/features/signals/attention";
import { groupAttentionLabel, signalBadgeForViewer, signalReasonForViewer, type SignalBadge } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

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
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const supportRequests = group.signals.filter((signal) => signal.assignedToId === user.id);
  const urgentAttentionPeople = attentionPeople.filter((signal) => signal.severity === SignalSeverity.URGENT);
  const inCareCount = group.memberships.filter((membership) => membership.person.status === "COOLING_AWAY").length;
  const completedEvents = group.events.filter((event) => summarizeEventPresence(event).completed);
  const presence = summarizeEventsPresence(group.events);
  const hasRecentPresence = presence.hasPresenceData;
  const relevantEvent = selectRelevantCheckInEvent(group.events);
  const pendingEvent = relevantEvent && !hasRecordedPresence(relevantEvent) ? relevantEvent : null;
  const headerBadge: SignalBadge = (() => {
    if (urgentAttentionPeople.length > 0) {
      return { tone: "risk", label: groupAttentionLabel(urgentAttentionPeople.length, "urgente", "urgentes") };
    }

    if (isPastorView && pastoralAttentionPeople.length > 0) {
      return { tone: "risk", label: groupAttentionLabel(pastoralAttentionPeople.length, "caso pastoral", "casos pastorais") };
    }

    if (!isPastorView && supportRequests.length > 0) {
      return { tone: "support", label: groupAttentionLabel(supportRequests.length, "pedido de apoio", "pedidos de apoio") };
    }

    if (attentionPeople.length > 0) {
      return {
        tone: "warn",
        label: isPastorView ? groupAttentionLabel(attentionPeople.length, "atenção local", "atenções locais") : groupAttentionLabel(attentionPeople.length, "pessoa em atenção", "pessoas em atenção"),
      };
    }

    if (inCareCount > 0) {
      return { tone: "care", label: groupAttentionLabel(inCareCount, "em cuidado", "em cuidado") };
    }

    return { tone: "ok", label: "Estável" };
  })();

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
          <Badge tone={headerBadge.tone}>{headerBadge.label}</Badge>
        </div>
        <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {groupMeetingText(group.meetingDayOfWeek, group.meetingTime)}
          {group.locationName ? ` · ${group.locationName}` : ""}
        </p>
      </section>

      <ContextSummary
        items={[
          { label: "Membros", value: String(group.memberships.length), detail: inCareCount > 0 ? `${inCareCount} em cuidado nesta célula.` : "Pessoas ativas nesta célula.", tone: "neutral" },
          {
            label: "Presença recente",
            value: hasRecentPresence ? `${presence.presenceRate}%` : "—",
            detail: hasRecentPresence ? "Nos últimos encontros registrados." : completedEvents.length > 0 ? "Encontros registrados sem marcação de membros." : "Ainda sem presença registrada.",
            tone: !hasRecentPresence ? "neutral" : presence.presenceRate < 65 ? "risk" : presence.presenceRate < 75 ? "warn" : "ok",
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
            {pastoralAttentionPeople.slice(0, 4).map((signal) => {
              const badge = signalBadgeForViewer(signal, user);

              return (
                <PersonSignalCard
                  key={signal.id}
                  initials={initials(signal.person.fullName)}
                  name={signal.person.fullName}
                  detailHref={`/pessoas/${signal.person.id}`}
                  context="Membro da célula"
                  reason={signal.reason}
                  severity={signal.severity === SignalSeverity.URGENT ? "risk" : "warn"}
                  badgeLabel={badge.label}
                  badgeTone={badge.tone}
                  ctaLabel="Abrir pessoa"
                />
              );
            })}
            {pastoralAttentionPeople.length === 0 ? (
              <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
                Nenhum caso urgente ou encaminhado ao pastor nesta célula.
              </p>
            ) : null}
          </div>

          <SectionTitle>Atenções locais da célula</SectionTitle>
          <div className="space-y-3">
            {localAttentionPeople.slice(0, 4).map((signal) => {
              const badge = signalBadgeForViewer(signal, user);

              return (
                <PersonSignalCard
                  key={signal.id}
                  initials={initials(signal.person.fullName)}
                  name={signal.person.fullName}
                  detailHref={`/pessoas/${signal.person.id}`}
                  context="No cuidado do líder ou da supervisão"
                  reason={signal.reason}
                  severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
                  badgeLabel={badge.label}
                  badgeTone={badge.tone}
                  ctaLabel="Abrir pessoa"
                />
              );
            })}
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
            {attentionPeople.slice(0, 4).map((signal) => {
              const badge = signalBadgeForViewer(signal, user);

              return (
                <PersonSignalCard
                  key={signal.id}
                  initials={initials(signal.person.fullName)}
                  name={signal.person.fullName}
                  detailHref={`/pessoas/${signal.person.id}`}
                  context="Membro da célula"
                  reason={signalReasonForViewer(signal.reason, user)}
                  severity={signal.severity === SignalSeverity.URGENT ? "risk" : signal.severity === SignalSeverity.ATTENTION ? "warn" : "info"}
                  badgeLabel={badge.label}
                  badgeTone={badge.tone}
                  ctaLabel="Abrir pessoa"
                />
              );
            })}
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
        {group.events.filter((event) => summarizeEventPresence(event).completed).slice(0, 3).map((event) => {
          const metrics = summarizeEventPresence(event);

          return (
            <Link key={event.id} href={`/eventos/${event.id}`} className="block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{event.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {formatShortDate(event.startsAt)}, {formatTime(event.startsAt)} · {metrics.visitorCount} {metrics.visitorCount === 1 ? "visitante" : "visitantes"}
                  </p>
                </div>
                <Badge tone={metrics.hasPresenceData ? "ok" : "neutral"}>{metrics.hasPresenceData ? `${metrics.presenceRate}%` : "Sem registro"}</Badge>
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
          const memberBadge = personEffectiveBadgeForViewer(membership.person, attentionSignal, user);

          return (
            <Link key={membership.id} href={`/pessoas/${membership.personId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]">
              <span className="min-w-0 text-sm font-semibold text-[var(--color-text-primary)]">{membership.person.fullName}</span>
              <Badge tone={memberBadge.tone}>{memberBadge.label}</Badge>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
