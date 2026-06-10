import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PulseCard } from "@/components/shared/base-cards";
import { NextActionCard } from "@/components/shared/next-action-card";
import { PastoralSectionTitle } from "@/features/pastoral-home/components/pastoral-section";
import { FirstUseStateCard } from "@/features/pastoral-home/components/first-use-state-card";
import { UpcomingBirthdaysCard } from "@/features/people/components/upcoming-birthdays-card";
import { EMPTY_STATE_COPY } from "@/features/empty-states/empty-state-copy";
import { InCareSection, PastoralSignalSection } from "@/features/pastoral-home/components/pastoral-list-cards";
import { buildLeaderPageView } from "@/features/leader/leader-page-view";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canUseLeaderDashboard } from "@/features/permissions/permissions";
import { getLeaderDashboard } from "@/features/dashboard/queries";
import { signalTitleForViewer, type SignalDetailLike, type SignalDisplayViewerLike } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES } from "@/lib/routes";
import styles from "./leader-page.module.css";

const hideSignalCardDescription = () => undefined;

function normalizeSectionTitle(title: string) {
  return title.trim().replace(/[.!?]+$/u, "");
}

function signalSectionHeading<TSignal extends SignalDetailLike>(
  signals: TSignal[],
  viewer: SignalDisplayViewerLike,
  fallback: string,
) {
  const titles = new Set(
    signals
      .map((signal) => normalizeSectionTitle(signalTitleForViewer(signal, viewer)))
      .filter(Boolean),
  );

  if (titles.size === 1) {
    return { title: [...titles][0] ?? fallback, showCardContext: false };
  }

  return { title: fallback, showCardContext: true };
}

export default async function LeaderPage() {
  const user = await getCurrentUser();

  if (!canUseLeaderDashboard(user)) {
    redirect(ROUTES.root);
  }

  const dashboard = await getLeaderDashboard(user);
  const view = buildLeaderPageView({ dashboard, viewer: user });
  const leaderCellHref = dashboard.primaryGroupId ? ROUTES.group(dashboard.primaryGroupId) : ROUTES.cells;
  const urgentSection = signalSectionHeading(view.urgentSignals, user, "Cuidado urgente");
  const supportSection = signalSectionHeading(view.supportSignals, user, "Pedidos de apoio");
  const attentionSection = signalSectionHeading(view.attentionSignals, user, "Membros em atenção");
  const showFirstUseRoutineWaiting = Boolean(view.firstUseState && !dashboard.currentEvent);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: view.navIndicator, secondaryHref: leaderCellHref })}
    >
      <div className={styles.pageFlow}>
        {!view.firstUseState && view.nextAction ? (
          <NextActionCard action={view.nextAction} />
        ) : null}

        <PulseCard
          title={view.pastoralPulse.title}
          subtitle={view.pastoralPulse.subtitle}
          tone={view.pastoralPulse.tone}
          className="mb-0"
        />

        {view.firstUseState ? (
          <FirstUseStateCard state={view.firstUseState} />
        ) : null}

        {dashboard.upcomingBirthdays.length > 0 ? (
          <UpcomingBirthdaysCard birthdays={dashboard.upcomingBirthdays} />
        ) : null}

        {!view.firstUseState && view.hasPeopleInRadar ? (
          <>
            {view.urgentSignals.length > 0 ? (
              <PastoralSignalSection
                title={urgentSection.title}
                detail="Há um sinal sensível que vale acompanhar com calma e proximidade."
                emptyMessage={EMPTY_STATE_COPY.care.noUrgentCare}
                signals={view.urgentSignals}
                viewer={user}
                contextForSignal={urgentSection.showCardContext ? (signal, viewer) => signalTitleForViewer(signal, viewer) : hideSignalCardDescription}
                reasonForSignal={hideSignalCardDescription}
                tone="risk"
              />
            ) : null}

            {view.supportSignals.length > 0 ? (
              <PastoralSignalSection
                title={supportSection.title}
                detail="Você continua perto do membro, com a supervisão caminhando junto."
                emptyMessage={EMPTY_STATE_COPY.care.noSupportRequest}
                signals={view.supportSignals}
                viewer={user}
                contextForSignal={supportSection.showCardContext ? (signal, viewer) => signalTitleForViewer(signal, viewer) : hideSignalCardDescription}
                reasonForSignal={hideSignalCardDescription}
                tone="quiet"
              />
            ) : null}

            {view.attentionSignals.length > 0 ? (
              <PastoralSignalSection
                title={attentionSection.title}
                detail="Um gesto simples de proximidade pode evitar que o vínculo esfrie."
                emptyMessage={EMPTY_STATE_COPY.care.noMemberAttention}
                signals={view.attentionSignals}
                viewer={user}
                contextForSignal={attentionSection.showCardContext ? (signal, viewer) => signalTitleForViewer(signal, viewer) : hideSignalCardDescription}
                reasonForSignal={hideSignalCardDescription}
                tone="quiet"
              />
            ) : null}

            {view.inCarePeople.length > 0 ? (
              <InCareSection
                title="Membros em cuidado"
                detail="O cuidado já começou; agora importa manter constância e presença."
                emptyMessage={EMPTY_STATE_COPY.care.noMemberInCare}
                people={view.inCarePeople}
                tone="quiet"
              />
            ) : null}
          </>
        ) : !view.firstUseState ? (
          <section className={styles.eventSection}>
            <PastoralSectionTitle detail="Sinais pastorais aparecem aqui; a lista completa fica em Célula.">Cuidado com membros</PastoralSectionTitle>
            <EmptyState>
              {EMPTY_STATE_COPY.care.noMemberNeedsAttention}
            </EmptyState>
          </section>
        ) : null}

        {showFirstUseRoutineWaiting ? (
          <section className={styles.eventSection}>
            <PastoralSectionTitle detail="Encontro, presença e informações da célula.">Rotina da célula</PastoralSectionTitle>
            <EmptyState title="Aguardando primeiro encontro">
              Quando houver encontro disponível para check-in, ele aparecerá aqui para registrar presença.
            </EmptyState>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
