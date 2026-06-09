import { PencilLine } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BackLink, InfoCard, PulseCard } from "@/components/shared/base-cards";
import { SectionHeader } from "@/components/ui/section-header";
import { GroupDetailSummaryCard } from "@/features/groups/components/group-detail-summary-card";
import { GroupPendingEventCard } from "@/features/groups/components/group-pending-event-card";
import { GroupSetupChecklistCard } from "@/features/groups/components/group-setup-checklist-card";
import { GroupRegisteredEncountersList } from "@/features/groups/components/group-registered-encounters-list";
import { MemberPriorityList } from "@/features/people/components/member-priority-list";
import { ButtonLink } from "@/components/ui/button-link";
import { getGroupDetailPageData } from "@/app/(app)/celulas/[groupId]/page-data";
import { shouldShowGroupSetupChecklistAction } from "@/features/groups/group-setup-checklist";
import {
  groupMeetingText,
  GROUP_REGULAR_MEMBER_INITIAL_COUNT,
  GROUP_REGULAR_MEMBER_STEP,
  memberBadgeLabelForCareContext,
  memberBadgeToneForCareContext,
} from "@/features/groups/group-detail-view";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES } from "@/lib/routes";
import { FILTER_IN_CARE } from "@/lib/filter-param";
import styles from "./group-detail-page.module.css";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GroupDetailPage({ params, searchParams }: GroupDetailPageProps) {
  const user = await getCurrentUser();
  const { groupId } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const {
    activeFocus,
    activeMembersFilter,
    backHref,
    backLabel,
    canEditGroup,
    completedEvents,
    focusCard,
    group,
    leadershipName,
    membersView,
    nav,
    pastoralPulse,
    pendingEvent,
    pendingEventActionLabel,
    pendingEventStatusLabel,
    savedMessage,
    summaryCard,
    setupChecklist,
    supervisionName,
  } = await getGroupDetailPageData({ user, groupId, queryParams });
  const setupChecklistCompetingHrefs = [
    ROUTES.group(group.id),
    pendingEvent ? ROUTES.event(pendingEvent.id) : null,
  ];

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={nav}
      headerVariant="compact"
    >
      <div className={styles.page}>
        <BackLink href={backHref}>{backLabel}</BackLink>

        {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

        <section className={styles.hero}>
          <div className={styles.heroHeader}>
            <p className="k-eyebrow">Célula</p>
            {canEditGroup ? (
              <div className={styles.heroAction}>
                <ButtonLink
                  href={ROUTES.editGroup(group.id)}
                  variant="actionPillSecondary"
                  size="sm"
                  density="actionPillCompact"
                  className="shrink-0 whitespace-nowrap"
                >
                  <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar célula
                </ButtonLink>
              </div>
            ) : null}
          </div>
          <div className={styles.heroTitleBlock}>
            <h2 className={`k-detail-title ${styles.heroTitle}`}>{group.name}</h2>
            <div className={styles.heroDetails}>
              <p>Liderança: {leadershipName}</p>
              {supervisionName ? <p>Supervisão: {supervisionName}</p> : null}
            </div>
          </div>
          <p className={styles.heroChip}>
            {groupMeetingText(group.meetingDayOfWeek, group.meetingTime)}
            {group.locationName ? ` · ${group.locationName}` : ""}
          </p>
        </section>

        <div>
          <PulseCard
            title={pastoralPulse.title}
            subtitle={pastoralPulse.subtitle}
            tone={pastoralPulse.tone}
          />
        </div>

        {setupChecklist ? (
          <GroupSetupChecklistCard
            checklist={setupChecklist}
            className={styles.setupChecklist}
            showAction={shouldShowGroupSetupChecklistAction(setupChecklist, setupChecklistCompetingHrefs)}
          />
        ) : null}

        <GroupDetailSummaryCard summary={summaryCard} />

        {focusCard ? (
          <InfoCard tone={focusCard.tone}>
            <span className="font-semibold">{focusCard.title}</span>
            <span className="block">{focusCard.detail}</span>
          </InfoCard>
        ) : null}

        {pendingEvent ? (
          <GroupPendingEventCard
            event={pendingEvent}
            statusLabel={pendingEventStatusLabel}
            actionLabel={pendingEventActionLabel}
          />
        ) : null}

        <section id="membros" className="scroll-mt-6">
          <SectionHeader title="Membros" detail={membersView.sectionDetail} className="mt-0" />
          <MemberPriorityList
            basePath={ROUTES.group(group.id)}
            activeFilter={activeMembersFilter}
            priorityMembers={membersView.priorityMembers}
            inCareMembers={membersView.inCareMembers}
            regularMembers={membersView.regularMembers}
            filterCounts={membersView.filterCounts}
            keyForMember={(member) => member.membershipId}
            hrefForMember={(member) => ROUTES.person(member.personId)}
            priorityContextForMember={(member) => member.subtitle}
            filteredContextForMember={(member) => member.subtitle}
            priorityBadgeLabelForMember={activeFocus === FILTER_IN_CARE ? memberBadgeLabelForCareContext : undefined}
            priorityBadgeToneForMember={activeFocus === FILTER_IN_CARE ? memberBadgeToneForCareContext : undefined}
            filteredBadgeLabelForMember={activeMembersFilter === FILTER_IN_CARE ? memberBadgeLabelForCareContext : undefined}
            filteredBadgeToneForMember={activeMembersFilter === FILTER_IN_CARE ? memberBadgeToneForCareContext : undefined}
            priorityMoreLabel="Ver mais irmãos em atenção"
            priorityLessLabel="Mostrar menos irmãos em atenção"
            regularInitialCount={GROUP_REGULAR_MEMBER_INITIAL_COUNT}
            regularStep={GROUP_REGULAR_MEMBER_STEP}
          />
        </section>

        <GroupRegisteredEncountersList events={completedEvents} />
      </div>
    </AppShell>
  );
}
