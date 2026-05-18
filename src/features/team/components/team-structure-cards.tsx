import Link from "next/link";
import { Archive, ChevronRight, HeartHandshake, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { EmptyState } from "@/components/shared/base-cards";
import { DisclosureCard } from "@/components/ui/disclosure-card";
import { PriorityCard } from "@/components/ui/priority-card";
import {
  compactGroupSubtitle,
  GROUPS_PER_SUPERVISOR_LIMIT,
  groupBadgeTone,
  inactiveGroupScheduleText,
  shouldShowGroupBadge,
  supervisorSummary,
  teamGroupHref,
  TEAM_SECTION_LIMIT,
  type InactiveTeamGroup,
  type SupervisorTeam,
  type TeamFilter,
  type TeamGroup,
} from "@/features/team/team-view";
import {
  FILTER_ATTENTION,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_STABLE,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import styles from "./team-structure-cards.module.css";

const cellLinkToneClass: Partial<Record<BadgeTone, string>> = {
  risk: styles.cellLinkRisk,
  warn: styles.cellLinkWarn,
  neutral: styles.cellLinkNeutral,
  support: styles.cellLinkSupport,
  care: styles.cellLinkCare,
  ok: styles.cellLinkOk,
};

const filterIconToneClass: Partial<Record<TeamFilter, string>> = {
  [FILTER_URGENT]: styles.filterContextRisk,
  [FILTER_PASTORAL]: styles.filterContextPastoral,
  [FILTER_SUPPORT]: styles.filterContextSupport,
  [FILTER_ATTENTION]: styles.filterContextWarn,
  [FILTER_NO_RECENT_PRESENCE]: styles.filterContextNeutral,
  [FILTER_STABLE]: styles.filterContextOk,
};

function TeamCellLink({
  href,
  name,
  subtitle,
  badgeLabel,
  badgeTone,
  className,
}: {
  href: string;
  name: string;
  subtitle: string;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(styles.cellLink, "card-hover-lift", className)}>
      <span className={styles.cellText}>
        <span className={styles.cellTitle}>{name}</span>
        <span className={styles.cellSubtitle}>{subtitle}</span>
      </span>
      <span className={styles.cellAction}>
        {badgeLabel ? (
          <Badge
            tone={badgeTone}
            size="xs"
            maxWidth="none"
            truncate
          >
            {badgeLabel}
          </Badge>
        ) : null}
        <ChevronRight className={styles.cellChevron} aria-hidden="true" />
      </span>
    </Link>
  );
}

export function TeamFilterContextCard({
  filter,
  title,
  detail,
}: {
  filter: TeamFilter;
  title: string;
  detail: string;
}) {
  return (
    <section className={cn(styles.filterContext, filterIconToneClass[filter])} aria-label={title}>
      <span className={styles.filterContextIcon} aria-hidden="true">
        <HeartHandshake className="h-6 w-6" strokeWidth={1.9} />
      </span>
      <span className={styles.filterContextCopy}>
        <span className={styles.filterContextTitle}>{title}</span>
        <span className={styles.filterContextDetail}>{detail}</span>
      </span>
      <ChevronRight className={styles.filterContextChevron} aria-hidden="true" />
    </section>
  );
}

export function TeamGroupLink({ group, activeFilter }: { group: TeamGroup; activeFilter?: TeamFilter }) {
  const tone = groupBadgeTone(group);
  const showBadge = shouldShowGroupBadge(group);

  return (
    <TeamCellLink
      href={teamGroupHref(group.id, activeFilter)}
      name={group.name}
      subtitle={compactGroupSubtitle(group)}
      badgeLabel={showBadge ? group.statusLabel : undefined}
      badgeTone={tone}
      className={cellLinkToneClass[tone]}
    />
  );
}

export function InactiveTeamGroupLink({ group }: { group: InactiveTeamGroup }) {
  const scheduleText = inactiveGroupScheduleText(group);

  return (
    <TeamCellLink
      href={ROUTES.editGroup(group.id)}
      name={group.name}
      subtitle={`${scheduleText}${group.locationName ? ` · ${group.locationName}` : ""}`}
      badgeLabel="Inativa"
      badgeTone="neutral"
      className={styles.cellLinkNeutral}
    />
  );
}

function SupervisorDisclosureAction() {
  return (
    <span className={styles.supervisorDisclosureAction}>
      <span className={styles.supervisorDisclosureClosed}>Ver células</span>
      <span className={styles.supervisorDisclosureOpen}>Mostrar menos</span>
    </span>
  );
}

export function TeamSupervisorCard({ supervisor, activeFilter }: { supervisor: SupervisorTeam; activeFilter?: TeamFilter }) {
  const hasGroups = supervisor.groups.length > 0;
  const shouldStartOpen = hasGroups && activeFilter !== "todos";
  const summary = supervisorSummary(supervisor);

  return (
    <PriorityCard
      as="section"
      padding="sm"
      radius="default"
      elevation="soft"
      containment="hidden"
      className={styles.supervisorCard}
    >
      <div className={styles.supervisorHeader}>
        <Avatar name={supervisor.name} className={styles.avatar} />
        <div className={styles.supervisorIntro}>
          <p className={styles.supervisorName}>{supervisor.name}</p>
          {!hasGroups ? <p className={styles.supervisorDescriptionText}>{summary}</p> : null}
        </div>
      </div>

      {!hasGroups ? (
        <div className={styles.supervisorBody}>
          <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
        </div>
      ) : (
        <DisclosureCard
          title={summary}
          tone="transparent"
          size="sm"
          separatedContent
          defaultOpen={shouldStartOpen}
          action={<SupervisorDisclosureAction />}
          className={cn(styles.supervisorBody, styles.supervisorDisclosure)}
          summaryClassName={styles.supervisorDisclosureSummary}
          titleClassName={styles.supervisorDisclosureTitle}
          contentClassName={styles.cellList}
        >
          <ProgressiveList
            initialCount={GROUPS_PER_SUPERVISOR_LIMIT}
            step={GROUPS_PER_SUPERVISOR_LIMIT}
            moreLabel="Ver mais células"
            lessLabel="Mostrar menos células"
          >
            {supervisor.groups.map((group) => (
              <TeamGroupLink key={group.id} group={group} activeFilter={activeFilter} />
            ))}
          </ProgressiveList>
        </DisclosureCard>
      )}
    </PriorityCard>
  );
}

function AdjustmentGroup({
  icon,
  title,
  detail,
  count,
  children,
}: {
  icon: "person" | "archive";
  title: string;
  detail: string;
  count: number;
  children: ReactNode;
}) {
  const Icon = icon === "person" ? UserRound : Archive;

  return (
    <div className={styles.adjustmentGroup}>
      <div className={styles.adjustmentHeader}>
        <span className={styles.adjustmentIcon} aria-hidden="true">
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
        <span className={styles.adjustmentCopy}>
          <span className={styles.adjustmentTitle}>{title}</span>
          <span className={styles.adjustmentDetail}>{detail}</span>
        </span>
        <span className={styles.adjustmentCount}>{count}</span>
      </div>
      <div className={styles.adjustmentList}>{children}</div>
    </div>
  );
}

export function TeamStructureAdjustments({
  unassignedGroups,
  inactiveGroups,
  activeFilter,
}: {
  unassignedGroups: TeamGroup[];
  inactiveGroups: InactiveTeamGroup[];
  activeFilter?: TeamFilter;
}) {
  if (unassignedGroups.length === 0 && inactiveGroups.length === 0) return null;

  return (
    <section className={styles.adjustmentsSection}>
      <h2 className={styles.adjustmentsHeading}>Ajustes de estrutura</h2>
      <PriorityCard as="div" padding="none" radius="default" elevation="soft" containment="hidden">
        {unassignedGroups.length > 0 ? (
          <AdjustmentGroup
            icon="person"
            title="Sem supervisor"
            detail="Células ativas sem vínculo com supervisor."
            count={unassignedGroups.length}
          >
            <ProgressiveList
              initialCount={TEAM_SECTION_LIMIT}
              step={TEAM_SECTION_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos células"
            >
              {unassignedGroups.map((group) => (
                <TeamGroupLink key={group.id} group={group} activeFilter={activeFilter} />
              ))}
            </ProgressiveList>
          </AdjustmentGroup>
        ) : null}

        {inactiveGroups.length > 0 ? (
          <AdjustmentGroup
            icon="archive"
            title="Células inativas"
            detail="Células arquivadas ou desativadas."
            count={inactiveGroups.length}
          >
            <ProgressiveList
              initialCount={TEAM_SECTION_LIMIT}
              step={TEAM_SECTION_LIMIT}
              moreLabel="Ver mais células inativas"
              lessLabel="Mostrar menos células inativas"
            >
              {inactiveGroups.map((group) => (
                <InactiveTeamGroupLink key={group.id} group={group} />
              ))}
            </ProgressiveList>
          </AdjustmentGroup>
        ) : null}
      </PriorityCard>
    </section>
  );
}
