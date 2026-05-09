import { redirect } from "next/navigation";
import { EventType } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PulseCard } from "@/components/base-cards";
import { PastoralSectionTitle } from "@/components/pastoral-section";
import { LeaderCurrentEventCard } from "@/components/leader-current-event-card";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import { selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { buildLeaderPageView, LEADER_RELEVANT_EVENT_LIMIT, LEADER_RELEVANT_EVENT_LOOKBACK_DAYS } from "@/features/leader/leader-page-view";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canUseLeaderDashboard } from "@/features/permissions/permissions";
import { getLeaderDashboard } from "@/features/dashboard/queries";
import { signalDetailForViewer } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addBrasiliaDays, startOfBrasiliaDay } from "@/lib/brasilia-time";
import { prisma } from "@/lib/prisma";

export default async function LeaderPage() {
  const user = await getCurrentUser();

  if (!canUseLeaderDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getLeaderDashboard(user);
  const groupIds = dashboard.groups.map((group) => group.id);
  const now = new Date();
  const today = startOfBrasiliaDay(now);
  const historyStart = addBrasiliaDays(today, -LEADER_RELEVANT_EVENT_LOOKBACK_DAYS);
  const tomorrow = addBrasiliaDays(today, 1);

  if (groupIds.length > 0) {
    await ensureUpcomingCellMeetingsForUser(user, { groupIds, referenceDate: now });
  }

  const visibleEvents = groupIds.length > 0
    ? await prisma.event.findMany({
        where: {
          groupId: { in: groupIds },
          type: EventType.CELL_MEETING,
          startsAt: { gte: historyStart, lt: tomorrow },
        },
        orderBy: { startsAt: "desc" },
        take: LEADER_RELEVANT_EVENT_LIMIT,
        include: {
          group: true,
          attendances: true,
        },
      })
    : [];

  const currentEvent = selectRelevantCheckInEvent(visibleEvents, now);
  const inCarePeople = dashboard.groups.flatMap((group) =>
    group.memberships.map((membership) => ({ ...membership.person, groupName: group.name })),
  );
  const view = buildLeaderPageView({
    signals: dashboard.attentionPeople,
    inCarePeople,
    viewer: user,
  });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: view.navIndicator })}
    >
      <PulseCard
        title={view.pastoralPulse.title}
        subtitle={view.pastoralPulse.subtitle}
        tone={view.pastoralPulse.tone}
      />

      {view.hasPeopleInRadar ? (
        <>
          {view.urgentSignals.length > 0 ? (
            <PastoralSignalSection
              title="Irmãos que precisam de um olhar especial"
              detail="Abra a pessoa para entender o contexto com calma."
              emptyMessage="Nenhuma pessoa urgente ou encaminhada agora."
              signals={view.urgentSignals}
              viewer={user}
              contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
            />
          ) : null}

          {view.supportSignals.length > 0 ? (
            <PastoralSignalSection
              title="Pedidos de apoio"
              detail="Pedidos enviados à supervisão continuam visíveis para acompanhamento local."
              emptyMessage="Nenhum pedido de apoio aberto agora."
              signals={view.supportSignals}
              viewer={user}
              contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
            />
          ) : null}

          {view.attentionSignals.length > 0 ? (
            <PastoralSignalSection
              title="Acompanhar de perto"
              detail="Atenções locais que pedem proximidade."
              emptyMessage="Nenhum membro da sua célula está em atenção agora."
              signals={view.attentionSignals}
              viewer={user}
              contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
            />
          ) : null}

          {view.inCarePeople.length > 0 ? (
            <InCareSection
              title="Acolhidos em cuidado"
              detail="Pessoas que já receberam cuidado e seguem no radar."
              emptyMessage="Nenhuma pessoa em cuidado agora."
              people={view.inCarePeople}
            />
          ) : null}
        </>
      ) : (
        <>
          <PastoralSectionTitle>Quem precisa de cuidado</PastoralSectionTitle>
          <EmptyState>
            Nenhum membro da sua célula pede atenção agora. Para consultar a lista completa, abra Membros.
          </EmptyState>
        </>
      )}

      <PastoralSectionTitle detail="A presença completa fica na tela do encontro.">Encontro da célula</PastoralSectionTitle>
      {currentEvent ? (
        <LeaderCurrentEventCard event={currentEvent} />
      ) : (
        <EmptyState>
          Nenhum encontro de célula precisa de presença agora. Consulte Encontros para ver próximos encontros e histórico.
        </EmptyState>
      )}
    </AppShell>
  );
}
