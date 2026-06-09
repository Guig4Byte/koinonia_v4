import Link from "next/link";
import type { ReactNode } from "react";
import { Archive, ChevronRight, UserRound } from "lucide-react";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { SectionHeader } from "@/components/ui/section-header";
import { PriorityCard } from "@/components/ui/priority-card";
import {
  compactGroupSubtitle,
  groupSignalLabel,
  groupSignalTone,
  inactiveGroupScheduleText,
  teamGroupHref,
  type InactiveTeamGroup,
  type TeamFilter,
  type TeamGroup,
  type TeamSignalTone,
} from "@/features/team/team-view";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { cellToneClass } from "./team-cell-link";
import { TEAM_STRUCTURE_ADJUSTMENTS_LIMIT } from "./team-structure-cards.constants";
import styles from "../team-structure-cards.module.css";

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
              initialCount={TEAM_STRUCTURE_ADJUSTMENTS_LIMIT}
              step={TEAM_STRUCTURE_ADJUSTMENTS_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos"
              className={styles.compactProgressiveList}
              actionVariant="brandGhost"
              actionDensity="progressiveControl"
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
              initialCount={TEAM_STRUCTURE_ADJUSTMENTS_LIMIT}
              step={TEAM_STRUCTURE_ADJUSTMENTS_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos"
              className={styles.compactProgressiveList}
              actionVariant="brandGhost"
              actionDensity="progressiveControl"
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
