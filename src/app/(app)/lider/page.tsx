import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PulseCard } from "@/components/shared/base-cards";
import { PastoralSectionTitle } from "@/features/pastoral-home/components/pastoral-section";
import { LeaderCurrentEventCard } from "@/features/leader/components/leader-current-event-card";
import { NextPastoralActionCard } from "@/features/pastoral-home/components/next-pastoral-action-card";
import { InCareSection, PastoralSignalSection } from "@/features/pastoral-home/components/pastoral-list-cards";
import { buildLeaderPageView } from "@/features/leader/leader-page-view";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canUseLeaderDashboard } from "@/features/permissions/permissions";
import { getLeaderDashboard } from "@/features/dashboard/queries";
import { signalTitleForViewer } from "@/features/signals/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES } from "@/lib/routes";
import styles from "./leader-page.module.css";

export default async function LeaderPage() {
  const user = await getCurrentUser();

  if (!canUseLeaderDashboard(user)) {
    redirect(ROUTES.root);
  }

  const dashboard = await getLeaderDashboard(user);
  const view = buildLeaderPageView({ dashboard, viewer: user });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: view.navIndicator })}
    >
      <div className={styles.pageFlow}>
        <PulseCard
          title={view.pastoralPulse.title}
          subtitle={view.pastoralPulse.subtitle}
          tone={view.pastoralPulse.tone}
          className="mb-0"
        />

        {view.nextAction ? <NextPastoralActionCard action={view.nextAction} className="mb-0" /> : null}

        {view.hasPeopleInRadar ? (
          <>
            {view.urgentSignals.length > 0 ? (
              <PastoralSignalSection
                title="Irmãos que precisam de um olhar especial"
                detail="Abra para ver contexto."
                emptyMessage="Nenhuma pessoa urgente ou encaminhada agora."
                signals={view.urgentSignals}
                viewer={user}
                contextForSignal={(signal, viewer) => signalTitleForViewer(signal, viewer)}
              />
            ) : null}

            {view.supportSignals.length > 0 ? (
              <PastoralSignalSection
                title="Pedidos de apoio"
                detail="Apoios enviados à supervisão."
                emptyMessage="Nenhum pedido de apoio aberto agora."
                signals={view.supportSignals}
                viewer={user}
                contextForSignal={(signal, viewer) => signalTitleForViewer(signal, viewer)}
              />
            ) : null}

            {view.attentionSignals.length > 0 ? (
              <PastoralSignalSection
                title="Acompanhar de perto"
                detail="Casos para acompanhar de perto."
                emptyMessage="Nenhum membro da sua célula está em atenção agora."
                signals={view.attentionSignals}
                viewer={user}
                contextForSignal={(signal, viewer) => signalTitleForViewer(signal, viewer)}
              />
            ) : null}

            {view.inCarePeople.length > 0 ? (
              <InCareSection
                title="Acolhidos em cuidado"
                detail="Seguimento pastoral ativo."
                emptyMessage="Nenhuma pessoa em cuidado agora."
                people={view.inCarePeople}
              />
            ) : null}
          </>
        ) : (
          <section className={styles.eventSection}>
            <PastoralSectionTitle>Quem precisa de cuidado</PastoralSectionTitle>
            <EmptyState>
              Nenhum membro da sua célula pede atenção agora. Para consultar a lista completa, abra Célula.
            </EmptyState>
          </section>
        )}

        <section className={styles.eventSection}>
          <PastoralSectionTitle detail="Presença na tela do encontro.">Encontro da célula</PastoralSectionTitle>
          {dashboard.currentEvent ? (
            <LeaderCurrentEventCard event={dashboard.currentEvent} />
          ) : (
            <EmptyState>
              Nenhum encontro de célula precisa de presença agora. Consulte Encontros para ver próximos encontros e histórico.
            </EmptyState>
          )}
        </section>
      </div>
    </AppShell>
  );
}
