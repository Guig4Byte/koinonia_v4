import { AppShell } from "@/components/app-shell";
import { ContextSummary, GroupCard, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { groupAttentionLabel, signalBadgeForViewer, type SignalBadge } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { initials } from "@/lib/text";

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
  const supportRequestIds = new Set(dashboard.supportRequests.map((signal) => signal.id));
  const otherAttentionPeople = dashboard.attentionPeople.filter((signal) => !supportRequestIds.has(signal.id));

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

      <SectionTitle>Pedidos de apoio</SectionTitle>
      <div className="space-y-3">
        {dashboard.supportRequests.slice(0, 4).map((signal) => {
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
              ctaLabel="Abrir apoio"
            />
          );
        })}
        {dashboard.supportRequests.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhum líder pediu apoio agora.</p>
        ) : null}
      </div>

      <SectionTitle>Outros casos para acompanhar</SectionTitle>
      <div className="space-y-3">
        {otherAttentionPeople.slice(0, 4).map((signal) => {
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
              ctaLabel="Abrir pessoa"
            />
          );
        })}
        {otherAttentionPeople.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhum outro caso em atenção agora.</p>
        ) : null}
      </div>

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
