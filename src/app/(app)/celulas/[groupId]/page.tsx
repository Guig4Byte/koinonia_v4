import { AppShell } from "@/components/layout/app-shell";
import { BackLink, InfoCard, PulseCard, SectionTitle } from "@/components/shared/base-cards";
import { GroupDetailSummaryCard } from "@/features/groups/components/group-detail-summary-card";
import { GroupPendingEventCard } from "@/features/groups/components/group-pending-event-card";
import { GroupRegisteredEncountersList } from "@/features/groups/components/group-registered-encounters-list";
import { MemberPriorityList } from "@/features/people/components/member-priority-list";
import { ButtonLink } from "@/components/ui/button-link";
import { getGroupDetailPageData } from "@/app/(app)/celulas/[groupId]/page-data";
import {
  groupMeetingText,
  GROUP_REGULAR_MEMBER_INITIAL_COUNT,
  GROUP_REGULAR_MEMBER_STEP,
} from "@/features/groups/group-detail-view";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
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
    activeMembersFilter,
    backHref,
    backLabel,
    canEditGroup,
    completedEvents,
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
    supervisionName,
  } = await getGroupDetailPageData({ user, groupId, queryParams });

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

        {canEditGroup ? (
          <div className="mb-4 flex justify-end">
            <ButtonLink
              href={ROUTES.editGroup(group.id)}
              variant="secondary"
              size="sm"
              shape="rounded"
            >
              Editar célula
            </ButtonLink>
          </div>
        ) : null}

        <section className={styles.hero}>
          <div className="min-w-0">
            <p className="k-eyebrow">Célula</p>
            <h2 className="k-detail-title mt-1">{group.name}</h2>
            <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
              Liderança: {leadershipName}
              {supervisionName ? ` · Supervisão: ${supervisionName}` : ""}
            </p>
          </div>
          <p className={cn(styles.heroChip, "mt-3")}>
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

        <GroupDetailSummaryCard summary={summaryCard} />

        {pendingEvent ? (
          <GroupPendingEventCard
            event={pendingEvent}
            statusLabel={pendingEventStatusLabel}
            actionLabel={pendingEventActionLabel}
          />
        ) : null}

        <section id="membros" className="scroll-mt-6">
          <SectionTitle detail={membersView.sectionDetail} className="mt-0">Membros</SectionTitle>
          <MemberPriorityList
            basePath={ROUTES.group(group.id)}
            activeFilter={activeMembersFilter}
            priorityMembers={membersView.priorityMembers}
            regularMembers={membersView.regularMembers}
            keyForMember={(member) => member.membershipId}
            hrefForMember={(member) => ROUTES.person(member.personId)}
            priorityContextForMember={(member) => member.subtitle}
            filteredContextForMember={(member) => member.subtitle}
            priorityMoreLabel="Ver mais pessoas em atenção"
            priorityLessLabel="Mostrar menos pessoas em atenção"
            regularInitialCount={GROUP_REGULAR_MEMBER_INITIAL_COUNT}
            regularStep={GROUP_REGULAR_MEMBER_STEP}
          />
        </section>

        <GroupRegisteredEncountersList events={completedEvents} />
      </div>
    </AppShell>
  );
}
