import Link from "next/link";
import type { ReactNode } from "react";
import { Archive, ChevronRight, HeartHandshake, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeMaxWidth, type BadgeTone } from "@/components/ui/badge";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { EmptyState } from "@/components/shared/base-cards";
import { SectionHeader } from "@/components/ui/section-header";
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

function cellToneClass(tone?: BadgeTone) {
  return tone ? cellLinkToneClass[tone] : undefined;
}

function CellStatusBadge({
  label,
  tone,
  maxWidth,
}: {
  label?: string;
  tone?: BadgeTone;
  maxWidth: BadgeMaxWidth;
}) {
  if (!label) return null;

  return (
    <Badge tone={tone} size="xs" maxWidth={maxWidth} truncate>
      {label}
    </Badge>
  );
}

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
        <CellStatusBadge label={badgeLabel} tone={badgeTone} maxWidth="none" />
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
      className={cellToneClass(tone)}
    />
  );
}

function SupervisorDisclosureAction() {
  return (
    <span className={styles.supervisorDisclosureAction}>
      <span className={styles.supervisorDisclosureClosed}>Ver células</span>
      <span className={styles.supervisorDisclosureOpen}>Mostrar menos</span>
      <ChevronRight className={styles.supervisorDisclosureIcon} aria-hidden="true" />
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

const STRUCTURE_ADJUSTMENTS_LIMIT = 2;

function StructureAdjustmentAction({ count }: { count: number }) {
  return (
    <span className={styles.structureDisclosureAction} aria-label={`${count} célula${count === 1 ? "" : "s"}`}>
      <span className={styles.structureCount}>{count}</span>
      <ChevronRight className={styles.structureChevron} aria-hidden="true" />
    </span>
  );
}

function StructureAdjustmentDisclosure({
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
    <DisclosureCard
      title={(
        <span className={styles.structureSummaryContent}>
          <span className={styles.structureIcon} aria-hidden="true">
            <Icon className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <span className={styles.structureCopy}>
            <span className={styles.structureTitle}>{title}</span>
            <span className={styles.structureDetail}>{detail}</span>
          </span>
        </span>
      )}
      tone="transparent"
      size="sm"
      separatedContent
      action={<StructureAdjustmentAction count={count} />}
      className={styles.structureDisclosure}
      summaryClassName={styles.structureDisclosureSummary}
      titleClassName={styles.structureDisclosureTitle}
      contentClassName={styles.structureDisclosureContent}
    >
      {children}
    </DisclosureCard>
  );
}

function StructureChildRow({
  href,
  name,
  subtitle,
  badgeLabel,
  badgeTone,
}: {
  href: string;
  name: string;
  subtitle: string;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
}) {
  return (
    <Link href={href} className={cn(styles.structureChildRow, cellToneClass(badgeTone))}>
      <span className={styles.structureChildMarker} aria-hidden="true" />
      <span className={styles.structureChildText}>
        <span className={styles.structureChildTitle}>{name}</span>
        <span className={styles.structureChildSubtitle}>{subtitle}</span>
      </span>
      <span className={styles.structureChildAction}>
        <CellStatusBadge label={badgeLabel} tone={badgeTone} maxWidth="row" />
        <ChevronRight className={styles.cellChevron} aria-hidden="true" />
      </span>
    </Link>
  );
}

function StructureGroupLink({ group, activeFilter }: { group: TeamGroup; activeFilter?: TeamFilter }) {
  const tone = groupBadgeTone(group);
  const showBadge = shouldShowGroupBadge(group);

  return (
    <StructureChildRow
      href={teamGroupHref(group.id, activeFilter)}
      name={group.name}
      subtitle={compactGroupSubtitle(group)}
      badgeLabel={showBadge ? group.statusLabel : undefined}
      badgeTone={tone}
    />
  );
}

function InactiveStructureGroupLink({ group }: { group: InactiveTeamGroup }) {
  const location = group.locationName ? ` · ${group.locationName}` : "";

  return (
    <StructureChildRow
      href={ROUTES.editGroup(group.id)}
      name={group.name}
      subtitle={`${inactiveGroupScheduleText(group)}${location}`}
      badgeLabel="Inativa"
      badgeTone="neutral"
    />
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
    <section className={styles.structureSection}>
      <SectionHeader
        title="Células para organizar"
        detail="Sem supervisão definida ou fora do acompanhamento ativo."
        className={styles.structureHeading}
      />
      <PriorityCard as="div" padding="none" radius="default" elevation="soft" containment="hidden" className={styles.structureCard}>
        {unassignedGroups.length > 0 ? (
          <StructureAdjustmentDisclosure
            icon="person"
            title="Sem supervisor"
            detail="Precisam de supervisão definida."
            count={unassignedGroups.length}
          >
            <ProgressiveList
              initialCount={STRUCTURE_ADJUSTMENTS_LIMIT}
              step={STRUCTURE_ADJUSTMENTS_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos células"
            >
              {unassignedGroups.map((group) => (
                <StructureGroupLink key={group.id} group={group} activeFilter={activeFilter} />
              ))}
            </ProgressiveList>
          </StructureAdjustmentDisclosure>
        ) : null}

        {inactiveGroups.length > 0 ? (
          <StructureAdjustmentDisclosure
            icon="archive"
            title="Células inativas"
            detail="Fora do acompanhamento ativo."
            count={inactiveGroups.length}
          >
            <ProgressiveList
              initialCount={STRUCTURE_ADJUSTMENTS_LIMIT}
              step={STRUCTURE_ADJUSTMENTS_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos células"
            >
              {inactiveGroups.map((group) => (
                <InactiveStructureGroupLink key={group.id} group={group} />
              ))}
            </ProgressiveList>
          </StructureAdjustmentDisclosure>
        ) : null}
      </PriorityCard>
    </section>
  );
}
