import { AppShell } from "@/components/app-shell";
import { ContextSummary, EmptyState, PulseCard, SectionTitle } from "@/components/cards";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { CheckInList } from "@/components/check-in-list";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getLeaderDashboard } from "@/features/dashboard/queries";
import { canUseLeaderDashboard } from "@/features/permissions/permissions";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { signalDetailForViewer } from "@/features/signals/display";
import { splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { addDays, startOfDay, subDays } from "date-fns";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function LeaderPage() {
  const user = await getCurrentUser();

  if (!canUseLeaderDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getLeaderDashboard(user);
  const groupIds = dashboard.groups.map((group) => group.id);
  const now = new Date();
  const today = startOfDay(now);
  const historyStart = subDays(today, 60);
  const tomorrow = addDays(today, 1);

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
          group: {
            include: {
              memberships: {
                where: { leftAt: null, role: { not: "VISITOR" } },
                include: { person: true },
              },
            },
          },
          attendances: { include: { person: true } },
        },
      })
    : [];

  const currentEvent = selectRelevantCheckInEvent(visibleEvents, now);
  const hasRecentPresence = dashboard.hasPresenceData;
  const currentGroup = currentEvent?.group ?? dashboard.groups[0] ?? null;

  const members = currentGroup?.memberships.map((membership) => ({
    personId: membership.personId,
    fullName: membership.person.fullName,
    currentStatus: currentEvent?.attendances.find((attendance) => attendance.personId === membership.personId)?.status,
  })) ?? [];
  const currentEventCompleted = currentEvent ? hasRecordedPresence(currentEvent) : false;
  const currentVisitors = currentEvent?.attendances
    .filter((attendance) => attendance.status === "VISITOR")
    .map((attendance) => ({ id: attendance.id, fullName: attendance.person.fullName })) ?? [];
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
  const navIndicator = urgentSignals.length > 0 ? "risk" : dashboard.attentionPeople.length > 0 ? "attention" : inCarePeople.length > 0 ? "care" : undefined;



  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/lider", label: "Visão", icon: "home", active: true, indicator: navIndicator },
        { href: "/pessoas", label: "Membros", icon: "people" },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder="Buscar membro..." />
      <PulseCard
        title={dashboard.attentionPeople[0] ? `${dashboard.attentionPeople[0].person.fullName} precisa de você.` : `${currentGroup?.name ?? "Sua célula"} está tranquila agora.`}
        subtitle={dashboard.attentionPeople[0] ? signalDetailForViewer(dashboard.attentionPeople[0], user) : "Registre a presença quando a célula acontecer."}
        tone={dashboard.attentionPeople.length > 0 ? "attention" : "ok"}
      />

      <ContextSummary
        items={[
          { label: "Membros", value: String(members.length), detail: currentGroup?.name ?? "Sua célula.", tone: "neutral" },
          {
            label: "Presença recente",
            value: hasRecentPresence ? `${dashboard.presenceRate}%` : "—",
            detail: hasRecentPresence ? "Média dos encontros registrados recentemente." : "Ainda sem encontro registrado no recorte atual.",
            tone: !hasRecentPresence ? "neutral" : dashboard.presenceRate < 65 ? "risk" : dashboard.presenceRate < 75 ? "warn" : "ok",
          },
          {
            label: "Pessoas em atenção",
            value: String(dashboard.attentionPeople.length),
            detail: "Para contato simples, sem burocracia.",
            tone: dashboard.attentionPeople.length ? "warn" : "ok",
          },
        ]}
      />

      <PastoralSignalSection
        title="Irmãos que precisam de um olhar especial"
        detail="Antes de rolar o check-in, veja se alguém precisa de um gesto simples de cuidado."
        emptyMessage="Nenhuma pessoa urgente ou encaminhada agora."
        signals={urgentSignals}
        viewer={user}
        contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
        reasonForSignal={() => undefined}
      />

      <PastoralSignalSection
        title="Pedidos de apoio"
        detail="Pedidos enviados à supervisão continuam visíveis para acompanhamento local."
        emptyMessage="Nenhum pedido de apoio aberto agora."
        signals={supportSignals}
        viewer={user}
        contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
        reasonForSignal={() => undefined}
      />

      <PastoralSignalSection
        title="Acompanhar de perto"
        detail="Atenções locais que merecem contato simples."
        emptyMessage="Nenhum membro da sua célula está em atenção agora."
        signals={attentionSignals}
        viewer={user}
        contextForSignal={(signal, viewer) => signalDetailForViewer(signal, viewer)}
        reasonForSignal={() => undefined}
      />

      <InCareSection
        title="Acolhidos em cuidado"
        detail="Pessoas que já receberam cuidado e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado agora."
        people={inCarePeople}
      />

      <SectionTitle>Presença do encontro</SectionTitle>
      {currentEvent ? (
        <>
          <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{currentEvent.group?.name ?? "Célula"}</p>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  {formatShortDate(currentEvent.startsAt)}, {formatTime(currentEvent.startsAt)}
                </p>
              </div>
              <Badge tone={currentEventCompleted ? "ok" : "warn"}>{currentEventCompleted ? "Presença registrada" : "Presença pendente"}</Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {currentEventCompleted
                ? "A presença deste encontro já foi registrada. Ajuste somente se alguma marcação estiver errada."
                : "Este é o encontro mais importante agora. Marque a presença para manter o cuidado em dia."}
            </p>
          </section>
          <CheckInList
            eventId={currentEvent.id}
            members={members}
            initialVisitors={currentVisitors}
            submitLabel={currentEventCompleted ? "Salvar ajuste" : "Salvar presença"}
            mode={currentEventCompleted ? "adjust" : "register"}
            attentionHref={currentGroup ? `/celulas/${currentGroup.id}` : "/pessoas"}
            attentionLabel="Ver atenção da célula"
          />
        </>
      ) : (
        <EmptyState>Nenhum evento de célula encontrado. Rode o seed ou crie um evento.</EmptyState>
      )}

    </AppShell>
  );
}
