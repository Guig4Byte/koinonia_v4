import { notFound } from "next/navigation";
import { SignalSeverity, SignalStatus, UserRole } from "../../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { BackLink, ContextSummary, DetailLinkCard, EmptyState, PersonMiniCard, PersonSignalCard, SectionTitle } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { summarizeEventPresence, summarizeEventsPresence } from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { canViewGroup } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson, isPastoralSignal } from "@/features/signals/attention";
import { groupAttentionLabel, signalBadgeForViewer, signalReasonForViewer, type SignalBadge } from "@/features/signals/display";
import { isSupportRequest } from "@/features/signals/sections";
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
  const secondaryNavHref = isPastorView ? "/equipe" : "/pessoas";
  const secondaryNavLabel = isPastorView ? "Equipe" : user.role === UserRole.LEADER ? "Membros" : "Pessoas";
  const attentionPeople = getPrimarySignalsByPerson(group.signals);
  const pastoralAttentionPeople = getPastoralSignalsByPerson(group.signals);
  const localAttentionPeople = attentionPeople.filter((signal) => !isPastoralSignal(signal));
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
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
      const supportLabel = user.role === UserRole.LEADER
        ? groupAttentionLabel(supportRequests.length, "apoio solicitado", "apoios solicitados")
        : groupAttentionLabel(supportRequests.length, "pedido de apoio", "pedidos de apoio");

      return { tone: "support", label: supportLabel };
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
        { href: secondaryNavHref, label: secondaryNavLabel, icon: "people", active: isPastorView, attention: attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <BackLink href={homeHref}>Visão</BackLink>

      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Célula</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{group.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Liderança: {group.leader?.name ?? "não informada"}
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
              <EmptyState>Nenhum caso urgente ou encaminhado ao pastor nesta célula.</EmptyState>
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
              <EmptyState>Nenhuma atenção local fora dos casos pastorais agora.</EmptyState>
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
                  ctaLabel={isSupportRequest(signal, user) ? "Abrir apoio" : "Abrir pessoa"}
                />
              );
            })}
            {attentionPeople.length === 0 ? (
              <EmptyState>Nenhuma pessoa desta célula está em atenção agora.</EmptyState>
            ) : null}
          </div>
        </>
      )}

      <SectionTitle>Encontro pendente</SectionTitle>
      {pendingEvent ? (
        <DetailLinkCard
          href={`/eventos/${pendingEvent.id}`}
          title={pendingEvent.title}
          meta={`${formatShortDate(pendingEvent.startsAt)}, ${formatTime(pendingEvent.startsAt)}`}
          badgeLabel="Presença pendente"
          badgeTone="warn"
          actionLabel="Abrir encontro"
        />
      ) : (
        <EmptyState>Nenhum encontro pendente encontrado para esta célula.</EmptyState>
      )}

      <SectionTitle>Últimos encontros</SectionTitle>
      <div className="space-y-3">
        {group.events.filter((event) => summarizeEventPresence(event).completed).slice(0, 3).map((event) => {
          const metrics = summarizeEventPresence(event);

          return (
            <DetailLinkCard
              key={event.id}
              href={`/eventos/${event.id}`}
              title={event.title}
              meta={`${formatShortDate(event.startsAt)}, ${formatTime(event.startsAt)} · ${metrics.visitorCount} ${metrics.visitorCount === 1 ? "visitante" : "visitantes"}`}
              badgeLabel={metrics.hasPresenceData ? `${metrics.presenceRate}%` : "Sem registro"}
              badgeTone={metrics.hasPresenceData ? "ok" : "neutral"}
              actionLabel="Abrir encontro"
            />
          );
        })}
        {completedEvents.length === 0 ? (
          <EmptyState>Ainda não há encontros registrados para resumir presença.</EmptyState>
        ) : null}
      </div>

      <SectionTitle>Membros</SectionTitle>
      <div className="space-y-2">
        {group.memberships.map((membership) => {
          const attentionSignal = attentionSignalByPersonId.get(membership.personId);
          const memberBadge = personEffectiveBadgeForViewer(membership.person, attentionSignal, user);

          return (
            <PersonMiniCard
              key={membership.id}
              href={`/pessoas/${membership.personId}`}
              initials={initials(membership.person.fullName)}
              name={membership.person.fullName}
              context={group.name}
              badgeLabel={memberBadge.label}
              badgeTone={memberBadge.tone}
            />
          );
        })}
      </div>
    </AppShell>
  );
}
