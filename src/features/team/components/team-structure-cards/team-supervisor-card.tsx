"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/base-cards";
import { PriorityCard } from "@/components/ui/priority-card";
import {
  TEAM_SUPERVISOR_PREVIEW_LIMIT,
  supervisorAveragePresence,
  type SupervisorTeam,
  type TeamFilter,
} from "@/features/team/team-view";
import { countLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { TeamGroupLink } from "./team-cell-link";
import styles from "../team-structure-cards.module.css";

function supervisorSignalsLabel(count: number) {
  if (count <= 0) return "sem sinais";
  return countLabel(count, "sinal", "sinais");
}

function supervisorPresenceLabel(supervisor: SupervisorTeam) {
  const averagePresence = supervisorAveragePresence(supervisor);
  if (averagePresence === null) return "sem presença recente";
  return `média ${averagePresence}%`;
}

export function TeamSupervisorCard({
  supervisor,
  activeFilter,
}: {
  supervisor: SupervisorTeam;
  activeFilter?: TeamFilter;
}) {
  const hasGroups = supervisor.groups.length > 0;
  const hasHiddenGroups = supervisor.groups.length > TEAM_SUPERVISOR_PREVIEW_LIMIT;
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isShowingAllGroups, setIsShowingAllGroups] = useState(false);
  const visibleGroups = isShowingAllGroups
    ? supervisor.groups
    : supervisor.groups.slice(0, TEAM_SUPERVISOR_PREVIEW_LIMIT);

  function togglePreview() {
    setIsPreviewOpen((current) => !current);
  }

  function toggleGroups() {
    setIsShowingAllGroups((current) => !current);
  }

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
            <span>{countLabel(supervisor.groups.length, "célula", "células")}</span>
            <span aria-hidden="true">·</span>
            <span className={styles.supervisorMetaAttention}>
              {supervisorSignalsLabel(supervisor.groupsNeedingAttentionCount)}
            </span>
            <span aria-hidden="true">·</span>
            <span className={styles.supervisorMetaPresence}>
              {supervisorPresenceLabel(supervisor)}
            </span>
          </p>
        </div>
        {hasGroups ? (
          <button
            type="button"
            className={styles.supervisorToggle}
            aria-expanded={isPreviewOpen}
            aria-label={
              isPreviewOpen
                ? `Recolher células de ${supervisor.name}`
                : `Mostrar células de ${supervisor.name}`
            }
            onClick={togglePreview}
          >
            <ChevronDown
              className={cn(
                styles.supervisorToggleIcon,
                isPreviewOpen && styles.supervisorToggleIconOpen,
              )}
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>

      {!hasGroups ? (
        <div className={styles.emptySupervisorState}>
          <EmptyState compact>
            Ainda não há célula ativa vinculada a este supervisor.
          </EmptyState>
        </div>
      ) : isPreviewOpen ? (
        <div className={styles.supervisorGroups}>
          <div className={styles.cellRows}>
            {visibleGroups.map((group) => (
              <TeamGroupLink
                key={group.id}
                group={group}
                activeFilter={activeFilter}
              />
            ))}
          </div>

          {hasHiddenGroups ? (
            <button
              type="button"
              className={styles.supervisorGroupsToggle}
              onClick={toggleGroups}
              aria-expanded={isShowingAllGroups}
            >
              <span>
                {isShowingAllGroups
                  ? "Mostrar menos"
                  : `Ver ${countLabel(supervisor.groups.length, "célula", "células")}`}
              </span>
              <ChevronRight
                className={cn(
                  styles.supervisorGroupsToggleIcon,
                  isShowingAllGroups && styles.supervisorGroupsToggleIconOpen,
                )}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      ) : null}
    </PriorityCard>
  );
}
