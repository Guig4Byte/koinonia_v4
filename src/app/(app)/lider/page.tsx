import { AppShell } from "@/components/app-shell";
import { ContextSummary, ListMoreHint, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { CheckInList } from "@/components/check-in-list";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getLeaderDashboard } from "@/features/dashboard/queries";
import { canUseLeaderDashboard } from "@/features/permissions/permissions";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { signalBadgeForViewer, signalReasonForViewer } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";

export default async function LeaderPage() {
  const user = await getCurrentUser();

  if (!canUseLeaderDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getLeaderDashboard(user);
  const groupIds = dashboard.groups.map((group) => group.id);

  const visibleEvents = groupIds.length > 0
    ? await prisma.event.findMany({
        where: { groupId: { in: groupIds }, type: "CELL_MEETING" },
        orderBy: { startsAt: "asc" },
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

  const currentEvent = selectRelevantCheckInEvent(visibleEvents);
  const hasRecentPresence = dashboard.recordedEventsCount > 0;
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
  const highlightedAttentionPeople = dashboard.attentionPeople.slice(0, 4);
  const hiddenAttentionPeopleCount = Math.max(0, dashboard.attentionPeople.length - highlightedAttentionPeople.length);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/lider", label: "Visão", icon: "home", active: true },
        { href: "/pessoas", label: "Membros", icon: "people", attention: dashboard.attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder="Buscar membro..." />
      <PulseCard
        title={dashboard.attentionPeople[0] ? `${dashboard.attentionPeople[0].person.fullName} precisa de você.` : `${currentGroup?.name ?? "Sua célula"} está tranquila agora.`}
        subtitle={dashboard.attentionPeople[0] ? signalReasonForViewer(dashboard.attentionPeople[0].reason, user) : "Registre a presença quando a célula acontecer."}
        tone={dashboard.attentionPeople.length > 0 ? "attention" : "ok"}
      />

      <ContextSummary
        items={[
          { label: "Membros", value: String(members.length), detail: currentGroup?.name ?? "Sua célula.", tone: "neutral" },
          {
            label: "Presença recente",
            value: hasRecentPresence ? `${dashboard.presenceRate}%` : "—",
            detail: hasRecentPresence ? "Nos encontros já registrados." : "Ainda sem encontro registrado no recorte atual.",
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

      <SectionTitle detail="Antes de rolar o check-in, veja se alguém precisa de um gesto simples de cuidado.">Quem merece atenção</SectionTitle>
      <div className="space-y-3">
        {highlightedAttentionPeople.map((signal) => {
          const badge = signalBadgeForViewer(signal, user);

          return (
            <PersonSignalCard
              key={signal.id}
              initials={initials(signal.person.fullName)}
              name={signal.person.fullName}
              detailHref={`/pessoas/${signal.person.id}`}
              context={signalReasonForViewer(signal.reason, user)}
              severity={signal.severity === "URGENT" ? "risk" : "warn"}
              badgeLabel={badge.label}
              badgeTone={badge.tone}
            />
          );
        })}
        <ListMoreHint hiddenCount={hiddenAttentionPeopleCount} label="Abra Membros ou busque pelo nome para ver os demais." />
        {dashboard.attentionPeople.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhuma pessoa em atenção agora.</p>
        ) : null}
      </div>

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
              <Badge tone={currentEventCompleted ? "ok" : "warn"}>{currentEventCompleted ? "Registrada" : "Pendente"}</Badge>
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
            submitLabel={currentEventCompleted ? "Atualizar" : "Finalizar"}
            mode={currentEventCompleted ? "adjust" : "register"}
            attentionHref={currentGroup ? `/celulas/${currentGroup.id}` : "/pessoas"}
            attentionLabel="Ver atenção da célula"
          />
        </>
      ) : (
        <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhum evento de célula encontrado. Rode o seed ou crie um evento.</p>
      )}

    </AppShell>
  );
}
