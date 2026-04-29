import { AppShell } from "@/components/app-shell";
import { ContextSummary, GroupCard, PastoralListSection, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { groupAttentionLabel, signalBadgeForViewer, type SignalBadge } from "@/features/signals/display";
import { isSupportRequest, isUrgentOrPastoralCase } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import Link from "next/link";
import { redirect } from "next/navigation";
import { initials } from "@/lib/text";

const SECTION_LIMIT = 4;

function supportRequestsText(count: number) {
  if (count === 0) return "";
  return `${count} ${count === 1 ? "pedido de apoio" : "pedidos de apoio"}`;
}

export default async function SupervisorPage() {
  const user = await getCurrentUser();

  if (!canUseSupervisorDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getSupervisorDashboard(user);
  const firstSupportRequest = dashboard.supportRequests[0];
  const firstSignal = dashboard.attentionPeople[0];
  const hasRecentPresence = dashboard.recordedEventsCount > 0;
  const urgentSignals = dashboard.attentionPeople.filter(isUrgentOrPastoralCase);
  const supportSignals = dashboard.attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const handledSignalIds = new Set([...urgentSignals, ...supportSignals].map((signal) => signal.id));
  const attentionSignals = dashboard.attentionPeople.filter((signal) => !handledSignalIds.has(signal.id));
  const activeAttentionPersonIds = new Set(dashboard.attentionPeople.map((signal) => signal.personId));
  const inCarePeople = dashboard.groups
    .flatMap((group) => group.memberships.map((membership) => ({ ...membership.person, groupName: group.name })))
    .filter((person, index, people) => person.status === "COOLING_AWAY" && !activeAttentionPersonIds.has(person.id) && people.findIndex((item) => item.id === person.id) === index);

  const renderSignalCards = (signals: typeof dashboard.attentionPeople, ctaLabel = "Abrir pessoa") => signals.map((signal) => {
    const badge = signalBadgeForViewer(signal, user);

    return (
      <PersonSignalCard
        key={signal.id}
        initials={initials(signal.person.fullName)}
        name={signal.person.fullName}
        detailHref={`/pessoas/${signal.person.id}`}
        context={signal.group.name}
        reason={signal.reason}
        severity={signal.severity === "URGENT" ? "risk" : "warn"}
        badgeLabel={badge.label}
        badgeTone={badge.tone}
        ctaLabel={ctaLabel}
      />
    );
  });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/supervisor", label: "Visão", icon: "home", active: true },
        { href: "/pessoas", label: "Pessoas", icon: "people", attention: dashboard.attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder="Buscar pessoa..." />
      <PulseCard
        title={firstSupportRequest ? `${firstSupportRequest.person.fullName} pediu apoio da supervisão.` : firstSignal ? `${firstSignal.person.fullName} merece atenção.` : "Suas células estão estáveis agora."}
        subtitle={firstSupportRequest ? `${firstSupportRequest.group.name}: ${firstSupportRequest.reason}` : firstSignal ? `${firstSignal.group.name}: ${firstSignal.reason}` : "Continue acompanhando presença e apoiando os líderes quando algo aparecer."}
        tone={firstSupportRequest || firstSignal ? "attention" : "ok"}
      />

      <ContextSummary
        items={[
          { label: "Células acompanhadas", value: String(dashboard.groups.length), detail: "Sob sua supervisão.", tone: "neutral" },
          {
            label: "Presença recente",
            value: hasRecentPresence ? `${dashboard.presenceRate}%` : "—",
            detail: hasRecentPresence ? "Últimos encontros registrados nas suas células." : "Ainda sem encontro registrado no recorte atual.",
            tone: !hasRecentPresence ? "neutral" : dashboard.presenceRate < 65 ? "risk" : dashboard.presenceRate < 75 ? "warn" : "ok",
          },
          {
            label: "Pedidos de apoio",
            value: String(dashboard.supportRequests.length),
            detail: "Casos que líderes trouxeram para você.",
            tone: dashboard.supportRequests.length > 0 ? "warn" : "ok",
          },
        ]}
      />

      <PastoralListSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem antes dos demais."
        emptyMessage="Nenhum caso urgente ou encaminhado agora."
        hiddenChildren={renderSignalCards(urgentSignals.slice(SECTION_LIMIT))}
      >
        {renderSignalCards(urgentSignals.slice(0, SECTION_LIMIT))}
      </PastoralListSection>

      <PastoralListSection
        title="Pedidos de apoio"
        detail="Pedidos trazidos pelos líderes aparecem primeiro, para você apoiar sem virar operador da célula."
        emptyMessage="Nenhum líder pediu apoio agora."
        hiddenChildren={renderSignalCards(supportSignals.slice(SECTION_LIMIT), "Abrir apoio")}
      >
        {renderSignalCards(supportSignals.slice(0, SECTION_LIMIT), "Abrir apoio")}
      </PastoralListSection>

      <PastoralListSection
        title="Acompanhar de perto"
        detail="Atenções locais das células supervisionadas."
        emptyMessage="Nenhum outro caso em atenção agora."
        hiddenChildren={renderSignalCards(attentionSignals.slice(SECTION_LIMIT))}
      >
        {renderSignalCards(attentionSignals.slice(0, SECTION_LIMIT))}
      </PastoralListSection>

      <PastoralListSection
        title="Acolhidos em cuidado"
        detail="Pessoas que já receberam cuidado e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado agora."
        hiddenChildren={inCarePeople.slice(SECTION_LIMIT).map((person) => (
          <Link key={person.id} href={`/pessoas/${person.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{person.fullName}</span>
              <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)]">{person.groupName}</span>
            </span>
            <Badge tone="care">Em cuidado</Badge>
          </Link>
        ))}
      >
        {inCarePeople.slice(0, SECTION_LIMIT).map((person) => (
          <Link key={person.id} href={`/pessoas/${person.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{person.fullName}</span>
              <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)]">{person.groupName}</span>
            </span>
            <Badge tone="care">Em cuidado</Badge>
          </Link>
        ))}
      </PastoralListSection>
      <SectionTitle>Suas células</SectionTitle>
      <div className="space-y-3">
        {dashboard.groups.map((group) => {
          const supportText = supportRequestsText(group.supportRequestsCount);
          const urgentCount = group.signals.filter((signal) => signal.severity === "URGENT").length;
          const badge: SignalBadge | null = urgentCount > 0
            ? { label: groupAttentionLabel(urgentCount, "urgente", "urgentes"), tone: "risk" }
            : group.supportRequestsCount > 0
              ? { label: groupAttentionLabel(group.supportRequestsCount, "pedido de apoio", "pedidos de apoio"), tone: "support" }
              : group.attentionCount > 0
                ? { label: groupAttentionLabel(group.attentionCount, "pessoa em atenção", "pessoas em atenção"), tone: "warn" }
                : group.inCareCount > 0
                  ? { label: groupAttentionLabel(group.inCareCount, "em cuidado", "em cuidado"), tone: "care" }
                  : null;

          return (
            <GroupCard
              key={group.id}
              name={group.name}
              subtitle={`${group.leader?.name ?? "Sem líder"} · ${group.memberships.length} pessoas${supportText ? ` · ${supportText}` : ""}${group.inCareCount > 0 ? ` · ${group.inCareCount} em cuidado` : ""}`}
              presenceRate={group.presenceRate}
              attentionCount={group.attentionCount}
              badgeLabel={badge?.label}
              badgeTone={badge?.tone}
              href={`/celulas/${group.id}`}
              hasPresenceData={group.recordedEventsCount > 0}
            />
          );
        })}
      </div>
    </AppShell>
  );
}
