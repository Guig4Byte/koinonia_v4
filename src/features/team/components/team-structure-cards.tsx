import Link from "next/link";
import type { ReactNode } from "react";
import { Archive, ChevronRight, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { FilterContextCard } from "@/components/shared/filter-context-card";
import { EmptyState } from "@/components/shared/base-cards";
import { SectionHeader } from "@/components/ui/section-header";
import { PriorityCard } from "@/components/ui/priority-card";
import {
  compactGroupSubtitle,
  groupSignalLabel,
  groupSignalTone,
  inactiveGroupScheduleText,
  supervisorSummary,
  TEAM_SUPERVISOR_PREVIEW_LIMIT,
  teamGroupHref,
  type InactiveTeamGroup,
  type SupervisorTeam,
  type TeamFilter,
  type TeamGroup,
  type TeamSignalTone,
} from "@/features/team/team-view";
import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_STABLE,
  FILTER_SUPPORT,
  FILTER_URGENT,
  type FilterTone,
} from "@/lib/filter-param";
import { cn } from "@/lib/cn";
import { countLabel } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import styles from "./team-structure-cards.module.css";

const cellLinkToneClass: Record<TeamSignalTone, string> = {
  risk: styles.cellLinkRisk,
  warn: styles.cellLinkWarn,
  neutral: styles.cellLinkNeutral,
  support: styles.cellLinkSupport,
  care: styles.cellLinkCare,
  ok: styles.cellLinkOk,
};

const filterContextTone: Partial<Record<TeamFilter, FilterTone>> = {
  [FILTER_URGENT]: "risk",
  [FILTER_PASTORAL]: "risk",
  [FILTER_SUPPORT]: "support",
  [FILTER_ATTENTION]: "warn",
  [FILTER_NO_RECENT_PRESENCE]: "neutral",
  [FILTER_STABLE]: "ok",
};

function pastoralSignalLabel(
  name: string,
  subtitle: string,
  signalLabel?: string,
) {
  return `${name}. ${subtitle}${signalLabel ? `. Sinal pastoral: ${signalLabel}` : ""}`;
}

function cellToneClass(tone?: TeamSignalTone) {
  return tone ? cellLinkToneClass[tone] : undefined;
}

function TeamCellLink({
  href,
  name,
  subtitle,
  signalLabel,
  visibleSignalLabel,
  className,
}: {
  href: string;
  name: string;
  subtitle: string;
  signalLabel?: string;
  visibleSignalLabel?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(styles.cellLink, className)}
      aria-label={pastoralSignalLabel(name, subtitle, signalLabel)}
    >
      <span className={styles.cellText}>
        <span className={styles.cellTitle}>{name}</span>
        <span className={styles.cellSubtitle}>{subtitle}</span>
        {visibleSignalLabel ? (
          <span className={styles.cellSignalLabel}>{visibleSignalLabel}</span>
        ) : null}
      </span>
      <span className={styles.cellAction}>
        <ChevronRight className={styles.cellChevron} aria-hidden="true" />
      </span>
    </Link>
  );
}

function TeamGroupLink({
  group,
  activeFilter,
}: {
  group: TeamGroup;
  activeFilter?: TeamFilter;
}) {
  const tone = groupSignalTone(group);
  const signalLabel = groupSignalLabel(group);
  const shouldShowSignalLabel = !activeFilter || activeFilter === FILTER_ALL;

  return (
    <TeamCellLink
      href={teamGroupHref(group.id, activeFilter)}
      name={group.name}
      subtitle={compactGroupSubtitle(group)}
      signalLabel={signalLabel}
      visibleSignalLabel={shouldShowSignalLabel ? signalLabel : undefined}
      className={cellToneClass(tone)}
    />
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
    <FilterContextCard title={title} detail={detail} tone={filterContextTone[filter]} />
  );
}

export function TeamSupervisorCard({
  supervisor,
  activeFilter,
}: {
  supervisor: SupervisorTeam;
  activeFilter?: TeamFilter;
}) {
  const hasGroups = supervisor.groups.length > 0;

  return (
    <PriorityCard
      as="section"
      padding="none"
      radius="default"
      elevation="soft"
      containment="hidden"
      className={styles.supervisorCard}
    >
      <div className={styles.supervisorHeader}>
        <Avatar name={supervisor.name} className={styles.avatar} />
        <div className={styles.supervisorIntro}>
          <p className={styles.supervisorName}>{supervisor.name}</p>
          <p className={styles.supervisorMeta}>
            {supervisorSummary(supervisor)}
          </p>
        </div>
      </div>

      {!hasGroups ? (
        <div className={styles.emptySupervisorState}>
          <EmptyState compact>
            Ainda não há célula ativa vinculada a este supervisor.
          </EmptyState>
        </div>
      ) : (
        <div className={styles.supervisorGroups}>
          <ProgressiveList
            initialCount={TEAM_SUPERVISOR_PREVIEW_LIMIT}
            step={TEAM_SUPERVISOR_PREVIEW_LIMIT}
            moreLabel={`Ver ${countLabel(supervisor.groups.length, "célula", "células")}`}
            lessLabel="Mostrar menos"
            className={styles.compactProgressiveList}
          >
            {supervisor.groups.map((group) => (
              <TeamGroupLink
                key={group.id}
                group={group}
                activeFilter={activeFilter}
              />
            ))}
          </ProgressiveList>
        </div>
      )}
    </PriorityCard>
  );
}

const STRUCTURE_ADJUSTMENTS_LIMIT = 1;

function StructureAdjustmentCard({
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
    <PriorityCard
      as="section"
      padding="none"
      radius="default"
      elevation="soft"
      containment="hidden"
      className={cn(
        styles.structureGroupCard,
        icon === "archive" && styles.structureGroupCardMuted,
      )}
    >
      <div className={styles.structureGroupHeader}>
        <span className={styles.structureIcon} aria-hidden="true">
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
        <span className={styles.structureCopy}>
          <span className={styles.structureTitle}>{title}</span>
          <span className={styles.structureDetail}>{detail}</span>
        </span>
        <span
          className={styles.structureCount}
          aria-label={`${count} célula${count === 1 ? "" : "s"}`}
        >
          {count}
        </span>
      </div>
      <div className={styles.structureRows}>{children}</div>
    </PriorityCard>
  );
}

function StructureChildRow({
  href,
  name,
  subtitle,
  signalTone,
  signalLabel,
}: {
  href: string;
  name: string;
  subtitle: string;
  signalTone: TeamSignalTone;
  signalLabel: string;
}) {
  return (
    <Link
      href={href}
      className={cn(styles.structureChildRow, cellToneClass(signalTone))}
      aria-label={`${name}. ${subtitle}. Sinal pastoral: ${signalLabel}`}
    >
      <span className={styles.structureChildMarker} aria-hidden="true" />
      <span className={styles.structureChildText}>
        <span className={styles.structureChildTitle}>{name}</span>
        <span className={styles.structureChildSubtitle}>{subtitle}</span>
      </span>
      <span className={styles.structureChildAction}>
        <ChevronRight className={styles.cellChevron} aria-hidden="true" />
      </span>
    </Link>
  );
}

function StructureGroupLink({
  group,
  activeFilter,
}: {
  group: TeamGroup;
  activeFilter?: TeamFilter;
}) {
  const tone = groupSignalTone(group);

  return (
    <StructureChildRow
      href={teamGroupHref(group.id, activeFilter)}
      name={group.name}
      subtitle={compactGroupSubtitle(group)}
      signalTone={tone}
      signalLabel={groupSignalLabel(group)}
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
      signalTone="neutral"
      signalLabel="Fora das listas principais"
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
        title="Ajustes de estrutura"
        detail="Pontos de organização da equipe pastoral."
        className={styles.structureHeading}
      />
      <div className={styles.structureGrid}>
        {unassignedGroups.length > 0 ? (
          <StructureAdjustmentCard
            icon="person"
            title="Supervisão a definir"
            detail="A supervisão ainda pode ser vinculada."
            count={unassignedGroups.length}
          >
            <ProgressiveList
              initialCount={STRUCTURE_ADJUSTMENTS_LIMIT}
              step={STRUCTURE_ADJUSTMENTS_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos"
              className={styles.compactProgressiveList}
            >
              {unassignedGroups.map((group) => (
                <StructureGroupLink
                  key={group.id}
                  group={group}
                  activeFilter={activeFilter}
                />
              ))}
            </ProgressiveList>
          </StructureAdjustmentCard>
        ) : null}

        {inactiveGroups.length > 0 ? (
          <StructureAdjustmentCard
            icon="archive"
            title="Inativas"
            detail="Guardadas fora das listas principais."
            count={inactiveGroups.length}
          >
            <ProgressiveList
              initialCount={STRUCTURE_ADJUSTMENTS_LIMIT}
              step={STRUCTURE_ADJUSTMENTS_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos"
              className={styles.compactProgressiveList}
            >
              {inactiveGroups.map((group) => (
                <InactiveStructureGroupLink key={group.id} group={group} />
              ))}
            </ProgressiveList>
          </StructureAdjustmentCard>
        ) : null}
      </div>
    </section>
  );
}
