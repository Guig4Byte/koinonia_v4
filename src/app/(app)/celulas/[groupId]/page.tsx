import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BackLink, ContextSummary, InfoCard, PulseCard, SectionTitle } from "@/components/base-cards";
import { GroupPendingEventCard } from "@/components/group-pending-event-card";
import { GroupRegisteredEncountersList } from "@/components/group-registered-encounters-list";
import { MemberPriorityList } from "@/components/member-priority-list";
import { buttonClassName } from "@/components/ui/button";
import { getGroupDetailPageData } from "@/app/(app)/celulas/[groupId]/page-data";
import {
  groupMeetingText,
  GROUP_REGULAR_MEMBER_INITIAL_COUNT,
  GROUP_REGULAR_MEMBER_STEP,
} from "@/features/groups/group-detail-view";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES } from "@/lib/routes";

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
    summaryItems,
    supervisionName,
  } = await getGroupDetailPageData({ user, groupId, queryParams });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={nav}
      headerVariant="compact"
    >
      <div className="group-detail-page">
        <BackLink href={backHref}>{backLabel}</BackLink>

        {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

        {canEditGroup ? (
          <div className="mb-4 flex justify-end">
            <Link
              href={ROUTES.editGroup(group.id)}
              className={buttonClassName({ variant: "secondary", size: "sm", className: "rounded-2xl px-3" })}
            >
              Editar célula
            </Link>
          </div>
        ) : null}

        <section className="group-detail-hero">
          <div className="min-w-0">
            <p className="text-[length:var(--text-xs)] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)]">Célula</p>
            <h2 className="mt-1 text-[length:var(--text-2xl)] font-extrabold leading-tight tracking-[-0.02em] text-[color:var(--color-text-primary)]">{group.name}</h2>
            <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
              Liderança: {leadershipName}
              {supervisionName ? ` · Supervisão: ${supervisionName}` : ""}
            </p>
          </div>
          <p className="group-detail-hero-chip mt-3">
            {groupMeetingText(group.meetingDayOfWeek, group.meetingTime)}
            {group.locationName ? ` · ${group.locationName}` : ""}
          </p>
        </section>

        <div className="group-detail-pulse">
          <PulseCard
            title={pastoralPulse.title}
            subtitle={pastoralPulse.subtitle}
            tone={pastoralPulse.tone}
          />
        </div>

        <div className="group-detail-summary">
          <ContextSummary
            variant="balanced"
            detailTone="strong"
            trendLayout="stacked"
            items={summaryItems}
          />
        </div>

        {pendingEvent ? (
          <GroupPendingEventCard
            event={pendingEvent}
            statusLabel={pendingEventStatusLabel}
            actionLabel={pendingEventActionLabel}
          />
        ) : null}

        <section id="membros" className="scroll-mt-6">
          <SectionTitle detail={membersView.sectionDetail}>Membros</SectionTitle>
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
