import { AppShell } from "@/components/layout/app-shell";
import { BackLink, EmptyState } from "@/components/shared/base-cards";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CardLink } from "@/components/ui/card-link";
import { PriorityCard } from "@/components/ui/priority-card";
import { SignalHeartIndicator } from "@/components/ui/signal-heart-indicator";
import { CareActions } from "@/features/care/components/care-actions";
import { CareOverviewCard } from "@/features/care/components/care-overview-card";
import { CareTouchHistory } from "@/features/care/components/care-touch-history";
import { PersonStatusActions } from "@/features/care/components/person-status-actions";
import { CARE_COPY } from "@/features/care/care-copy";
import { EMPTY_STATE_COPY } from "@/features/empty-states/empty-state-copy";
import { PersonBirthdayCard } from "@/features/people/components/person-birthday-card";
import { PersonPresenceCard } from "@/features/people/components/person-presence-card";
import { SignalSupportActions } from "@/features/signals/components/signal-support-actions";
import { cn } from "@/lib/cn";
import { getPersonDetailPageData } from "./page-data";
import styles from "./person-detail-page.module.css";

type PersonDetailSearchParams = Promise<{ acao?: string | string[] }>;

function firstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PersonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: PersonDetailSearchParams;
}) {
  const [{ personId }, query] = await Promise.all([params, searchParams]);
  const data = await getPersonDetailPageData(personId);
  const requestedAction = firstSearchParam(query.acao);
  const startWithPhoneForm = requestedAction === "telefone";
  const shouldShowNameReviewNotice = requestedAction === "nome";
  const startWithBirthdayForm = requestedAction === "aniversario";

  return (
    <AppShell
      userName={data.user.name}
      role={data.user.role}
      nav={data.shell.nav}
      headerVariant="compact"
    >
      <div className={styles.page}>
        <BackLink href={data.shell.backHref} className={styles.backLink}>{data.shell.backLabel}</BackLink>

        <PriorityCard
          id="perfil"
          as="section"
          priorityTone={data.hero.badgeKind === "leadership" ? undefined : data.hero.badge.tone}
          radius="lg"
          surface="pastoralHero"
          className={cn("card-hover-lift", styles.personHero, data.hero.badgeKind === "leadership" && styles.leadershipHero)}
        >
          <div className={styles.personHeroContent}>
            <Avatar name={data.person.fullName} size="xl" className={styles.avatar} />
            <div className={styles.personMain}>
              <div className={styles.personHeader}>
                <div className={styles.personTitleBlock}>
                  <p className={styles.eyebrow}>{data.hero.profileEyebrow}</p>
                  <h2 className={styles.personTitle}>{data.person.fullName}</h2>
                  <div className={styles.personMeta}>
                    {data.hero.metaLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  {shouldShowNameReviewNotice ? (
                    <div className={styles.nameReviewNotice} role="note">
                      <p className={styles.nameReviewTitle}>Nome possivelmente incompleto</p>
                      <p className={styles.nameReviewDetail}>
                        Confirme se este é o nome usado no acompanhamento ou complete o cadastro quando tiver o nome completo.
                      </p>
                    </div>
                  ) : null}
                </div>
                {data.hero.badgeKind === "leadership" ? (
                  <span className={styles.roleBadgeWrap}>
                    <Badge tone={data.hero.badge.tone} size="sm" maxWidth="full" elevation="soft">
                      {data.hero.badge.label}
                    </Badge>
                  </span>
                ) : (
                  <SignalHeartIndicator tone={data.hero.badge.tone} size="md" label={data.hero.badge.label} className={styles.personBadge} />
                )}
              </div>
            </div>
          </div>
        </PriorityCard>

        <PersonBirthdayCard
          personId={data.person.id}
          birthDate={data.person.birthDate}
          startWithForm={startWithBirthdayForm}
          className={styles.personBirthdayCard}
        />

        {data.leadership ? (
          <>
            <SectionHeader title="Responsabilidade pastoral" detail="Função e vínculo, sem repetir os indicadores da visão." />
            <PriorityCard as="section" surface="accentHalo" className={styles.leadershipCard}>
              <div className={styles.leadershipHeader}>
                <div className={styles.contextCopy}>
                  <p className={styles.leadershipRole}>{data.leadership.roleLabel}</p>
                  <p className={styles.leadershipDetail}>{data.leadership.detail}</p>
                </div>
              </div>

              {data.leadership.groups.length > 0 ? (
                <div className={styles.leadershipGroups}>
                  {data.leadership.groupsTitle ? (
                    <p className={styles.leadershipGroupsTitle}>{data.leadership.groupsTitle}</p>
                  ) : null}
                  <div className={styles.contextList}>
                    {data.leadership.groups.map((group) => (
                      <CardLink
                        key={group.id}
                        href={group.href}
                        priorityTone="muted"
                        surface="event"
                        containment="hidden"
                        accent="left"
                        padding="sm"
                      >
                        <div className={styles.contextHeader}>
                          <div className={styles.contextCopy}>
                            <p className={styles.contextTitle}>{group.name}</p>
                            {group.metaLines.length > 0 ? (
                              <div className={styles.contextMeta}>
                                {group.metaLines.map((line) => (
                                  <p key={line}>{line}</p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <span className={styles.contextAction}>Abrir célula →</span>
                        </div>
                      </CardLink>
                    ))}
                  </div>
                  {data.leadership.hiddenGroupsCount > 0 ? (
                    <p className={styles.leadershipMore}>
                      Mais {data.leadership.hiddenGroupsCount} célula{data.leadership.hiddenGroupsCount === 1 ? "" : "s"} no escopo.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {!data.profile.showPersonalPastoralSections && startWithPhoneForm ? (
                <CareActions
                  personId={data.person.id}
                  personName={data.person.fullName}
                  phone={data.person.phone}
                  startWithPhoneForm={startWithPhoneForm}
                  className={styles.careActions}
                />
              ) : null}
            </PriorityCard>
          </>
        ) : null}

        {data.profile.showPersonalPastoralSections ? (
          <>
            {data.profile.personalSectionTitle ? (
              <SectionHeader
                title={data.profile.personalSectionTitle}
                detail={data.profile.personalSectionDetail ?? undefined}
              />
            ) : null}

            <SectionHeader title="Próximo cuidado" detail="O próximo gesto, sem repetir o histórico." />
            <CareOverviewCard id="registrar-cuidado" view={data.care.overview} className={styles.primaryCareCard}>
              <CareActions
                personId={data.person.id}
                personName={data.person.fullName}
                phone={data.person.phone}
                startWithPhoneForm={startWithPhoneForm}
                className={styles.careActions}
              />
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
                <EmptyState className={styles.emptyState} title={EMPTY_STATE_COPY.care.noOpenSignalTitle}>
                  {data.care.hasCareTouch
                    ? "O cuidado mais recente aparece abaixo, e o irmão segue no radar pastoral."
                    : EMPTY_STATE_COPY.care.noOpenSignalDetail}
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
                          <div className={styles.contextMeta}>
                            <p>Liderança: {membership.leadershipName}</p>
                            {membership.supervisionName ? (
                              <p>Supervisão: {membership.supervisionName}</p>
                            ) : null}
                          </div>
                        </div>
                        <span className={styles.contextAction}>Abrir célula →</span>
                      </div>
                    </CardLink>
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
