import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { EmptyState, PastoralSectionTitle, PulseCard } from "@/components/cards";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { Badge } from "@/components/ui/badge";
import { getLeaderDashboard } from "@/features/dashboard/queries";
import { canUseLeaderDashboard } from "@/features/permissions/permissions";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import { signalDetailForViewer } from "@/features/signals/display";
import { buildPastoralPulseMessage } from "@/features/pastoral-pulse";
import { splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { addBrasiliaDays, startOfBrasiliaDay } from "@/lib/brasilia-time";

export default async function LeaderPage() {
  const user = await getCurrentUser();

  if (!canUseLeaderDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getLeaderDashboard(user);
  const groupIds = dashboard.groups.map((group) => group.id);
  const now = new Date();
  const today = startOfBrasiliaDay(now);
  const historyStart = addBrasiliaDays(today, -60);
  const tomorrow = addBrasiliaDays(today, 1);

  if (groupIds.length > 0) {
    await ensureUpcomingCellMeetingsForUser(user, { groupIds, referenceDate: now });
  }

  const visibleEvents = groupIds.length > 0
    ? await prisma.event.findMany({
        where: {
          groupId: { in: groupIds },
          type: "CELL_MEETING",
          startsAt: { gte: historyStart, lt: tomorrow },
        },
        orderBy: { startsAt: "desc" },
        take: 20,
        include: {
          group: true,
          attendances: true,
        },
      })
    : [];

  const currentEvent = selectRelevantCheckInEvent(visibleEvents, now);
  const currentEventCompleted = currentEvent ? hasRecordedPresence(currentEvent) : false;
  const currentEventLocation = currentEvent?.locationName ?? currentEvent?.group?.locationName ?? null;
  const rawInCarePeople = dashboard.groups
    .flatMap((group) => group.memberships.map((membership) => ({ ...membership.person, groupName: group.name })));
  const pastoralSections = splitPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: rawInCarePeople,
    viewer: user,
  });
  const urgentSignals = pastoralSections.urgentOrPastoralCases;
  const supportSignals = pastoralSections.supportRequests;
  const attentionSignals = pastoralSections.localAttention;
  const inCarePeople = pastoralSections.inCarePeople;
  const prioritySignals = [...urgentSignals, ...supportSignals, ...attentionSignals];
  const primaryUrgentSignal = urgentSignals[0];
  const primarySupportSignal = supportSignals[0];
  const primaryAttentionSignal = attentionSignals[0];
  const primaryInCarePerson = inCarePeople[0];
  const hasPeopleInRadar = prioritySignals.length > 0 || inCarePeople.length > 0;
  const navIndicator = urgentSignals.length > 0 ? "risk" : dashboard.attentionPeople.length > 0 ? "attention" : inCarePeople.length > 0 ? "care" : undefined;
  const pastoralPulse = buildPastoralPulseMessage({
    viewerRole: user.role,
    scope: "leaderDashboard",
    counts: {
      urgentOrPastoral: urgentSignals.length,
      support: supportSignals.length,
      attention: attentionSignals.length,
      inCare: inCarePeople.length,
    },
    subjects: {
      urgentOrPastoral: primaryUrgentSignal ? { personName: primaryUrgentSignal.person.fullName, detail: signalDetailForViewer(primaryUrgentSignal, user) } : null,
      support: primarySupportSignal ? { personName: primarySupportSignal.person.fullName, detail: signalDetailForViewer(primarySupportSignal, user) } : null,
      attention: primaryAttentionSignal ? { personName: primaryAttentionSignal.person.fullName, detail: signalDetailForViewer(primaryAttentionSignal, user) } : null,
      inCare: primaryInCarePerson ? { personName: primaryInCarePerson.fullName } : null,
    },
  });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: navIndicator })}
    >
      <PulseCard
        title={pastoralPulse.title}
        subtitle={pastoralPulse.subtitle}
        tone={pastoralPulse.tone}
      />

      {hasPeopleInRadar ? (
        <>
          {urgentSignals.length > 0 ? (
            <PastoralSignalSection
              title="Irmãos que precisam de um olhar especial"
              detail="Abra a pessoa e faça o próximo gesto simples."
              emptyMessage="Nenhuma pessoa urgente ou encaminhada agora."
              signals={urgentSignals}
              viewer={user}
              contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
              reasonForSignal={() => undefined}
            />
          ) : null}

          {supportSignals.length > 0 ? (
            <PastoralSignalSection
              title="Pedidos de apoio"
              detail="Pedidos enviados à supervisão continuam visíveis para acompanhamento local."
              emptyMessage="Nenhum pedido de apoio aberto agora."
              signals={supportSignals}
              viewer={user}
              contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
              reasonForSignal={() => undefined}
            />
          ) : null}

          {attentionSignals.length > 0 ? (
            <PastoralSignalSection
              title="Acompanhar de perto"
              detail="Atenções locais que merecem contato simples."
              emptyMessage="Nenhum membro da sua célula está em atenção agora."
              signals={attentionSignals}
              viewer={user}
              contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
              reasonForSignal={() => undefined}
            />
          ) : null}

          {inCarePeople.length > 0 ? (
            <InCareSection
              title="Acolhidos em cuidado"
              detail="Pessoas que já receberam cuidado e seguem no radar."
              emptyMessage="Nenhuma pessoa em cuidado agora."
              people={inCarePeople}
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
        <section className="card-hover-lift rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[var(--color-text-primary)]">{currentEvent.group?.name ?? "Célula"}</p>
              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                {formatShortDate(currentEvent.startsAt)}, {formatTime(currentEvent.startsAt)}
              </p>
              {currentEventLocation ? (
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {currentEventLocation}
                </p>
              ) : null}
            </div>
            <Badge tone={currentEventCompleted ? "ok" : "warn"}>{currentEventCompleted ? "Presença registrada" : "Presença pendente"}</Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {currentEventCompleted
              ? "A presença deste encontro já foi registrada. Ajuste somente se alguma marcação estiver errada."
              : "Registre a presença quando o encontro acontecer para manter o cuidado em dia."}
          </p>
          <Link
            href={`/eventos/${currentEvent.id}`}
            className="k-primary-action mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]"
          >
            {currentEventCompleted ? "Ver resumo" : "Registrar presença"} <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </section>
      ) : (
        <EmptyState>
          Nenhum encontro de célula precisa de presença agora. Consulte Encontros para ver próximos encontros e histórico.
        </EmptyState>
      )}
    </AppShell>
  );
}
