import { Avatar } from "@/components/ui/avatar";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { EmptyState } from "@/components/shared/base-cards";
import { PriorityCard } from "@/components/ui/priority-card";
import {
  supervisorSummary,
  TEAM_SUPERVISOR_PREVIEW_LIMIT,
  type SupervisorTeam,
  type TeamFilter,
} from "@/features/team/team-view";
import { countLabel } from "@/lib/format";
import { TeamGroupLink } from "./team-cell-link";
import styles from "../team-structure-cards.module.css";

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
            actionVariant="brandGhost"
            actionDensity="progressiveControl"
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
