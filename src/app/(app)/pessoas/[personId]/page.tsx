import { AppShell } from "@/components/layout/app-shell";
import { BackLink, EmptyState } from "@/components/shared/base-cards";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar } from "@/components/ui/avatar";
import { CardLink } from "@/components/ui/card-link";
import { PriorityCard } from "@/components/ui/priority-card";
import { SignalHeartIndicator } from "@/components/ui/signal-heart-indicator";
import { CareActions } from "@/features/care/components/care-actions";
import { CareOverviewCard } from "@/features/care/components/care-overview-card";
import { CareTouchHistory } from "@/features/care/components/care-touch-history";
import { PersonStatusActions } from "@/features/care/components/person-status-actions";
import { CARE_COPY } from "@/features/care/care-copy";
import { PersonPresenceCard } from "@/features/people/components/person-presence-card";
import { SignalSupportActions } from "@/features/signals/components/signal-support-actions";
import { cn } from "@/lib/cn";
import { getPersonDetailPageData } from "./page-data";
import styles from "./person-detail-page.module.css";

export default async function PersonDetailPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const data = await getPersonDetailPageData(personId);

  return (
    <AppShell
      userName={data.user.name}
      role={data.user.role}
      nav={data.shell.nav}
      headerVariant="compact"
    >
      <div className={styles.page}>
        <BackLink href={data.shell.backHref} className={styles.backLink}>{data.shell.backLabel}</BackLink>

        <PriorityCard as="section" priorityTone={data.hero.badge.tone} radius="lg" surface="pastoralHero" className={cn("card-hover-lift", styles.personHero)}>
          <div className={styles.personHeroContent}>
            <Avatar name={data.person.fullName} size="xl" className={styles.avatar} />
            <div className={styles.personMain}>
              <div className={styles.personHeader}>
                <div className={styles.personTitleBlock}>
                  <p className={styles.eyebrow}>{data.hero.profileEyebrow}</p>
                  <h2 className={styles.personTitle}>{data.person.fullName}</h2>
                  <p className={styles.personMeta}>{data.hero.meta}</p>
                </div>
                <SignalHeartIndicator tone={data.hero.badge.tone} size="md" label={data.hero.badge.label} className={styles.personBadge} />
              </div>

            </div>
          </div>
        </PriorityCard>

        <SectionHeader title="Próximo cuidado" detail="O próximo gesto, sem repetir o histórico." />
        <CareOverviewCard id="registrar-cuidado" view={data.care.overview} className={styles.primaryCareCard}>
          <CareActions personId={data.person.id} phone={data.person.phone} className={styles.careActions} />
          {data.care.canMarkActive ? <PersonStatusActions personId={data.person.id} /> : null}
        </CareOverviewCard>

        <SectionHeader title={data.signals.sectionTitle} detail={data.signals.sectionDetail} />
        <div className={styles.sectionStack}>
          {data.signals.cards.map((signal) => (
            <PriorityCard key={signal.id} priorityTone={signal.priorityTone} surface="accentStrip" className="card-hover-lift">
              <div className={styles.signalHeader}>
                <p className={styles.signalTitle}>{signal.title}</p>
                <p className={styles.signalMeta}>{signal.meta}</p>
              </div>
              {signal.description ? <p className={styles.signalDescription}>{signal.description}</p> : null}
              <SignalSupportActions
                signalId={signal.id}
                assignmentMessage={signal.assignmentMessage}
                canRequestSupervisor={signal.canRequestSupervisor}
                canEscalatePastor={signal.canEscalatePastor}
              />
            </PriorityCard>
          ))}

          {data.signals.openCount === 0 ? (
            <EmptyState className={styles.emptyState} title="Nada pede cuidado agora.">
              {data.care.hasCareTouch
                ? "O cuidado mais recente aparece abaixo, e o irmão segue no radar pastoral."
                : "Este irmão segue disponível para consulta quando houver um contato real de cuidado."}
            </EmptyState>
          ) : null}
        </div>

        <SectionHeader title="Ritmo de presença" />
        <PersonPresenceCard view={data.presence.view} />

        <div id="historico-cuidado" className={styles.anchorSection}>
          <SectionHeader title="Histórico de cuidado" detail="Registros recentes antes de um novo cuidado." />
          {data.care.historyItems.length > 0 ? (
            <CareTouchHistory items={data.care.historyItems} />
          ) : (
            <EmptyState className={styles.emptyState}>{CARE_COPY.history.empty}</EmptyState>
          )}
        </div>

        {data.memberships.cards.length > 0 ? (
          <>
            <SectionHeader title={data.memberships.sectionTitle} />
            <div className={styles.contextList}>
              {data.memberships.cards.map((membership) => (
                <CardLink
                  key={membership.id}
                  href={membership.href}
                  priorityTone="muted"
                  surface="event"
                  containment="hidden"
                  accent="left"
                >
                  <div className={styles.contextHeader}>
                    <div className={styles.contextCopy}>
                      <p className={styles.contextTitle}>{membership.name}</p>
                      <p className={styles.contextMeta}>{membership.meta}</p>
                    </div>
                    <span className={styles.contextAction}>Abrir célula →</span>
                  </div>
                </CardLink>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
