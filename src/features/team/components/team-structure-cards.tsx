import { Avatar } from "@/components/ui/avatar";
import type { BadgeTone } from "@/components/ui/badge";
import { ListLinkCard } from "@/components/ui/list-link-card";
import { PriorityCard } from "@/components/ui/priority-card";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { EmptyState } from "@/components/shared/base-cards";
import { DisclosureCard } from "@/components/ui/disclosure-card";
import {
  compactGroupSubtitle,
  GROUPS_PER_SUPERVISOR_LIMIT,
  groupBadgeTone,
  inactiveGroupScheduleText,
  shouldShowGroupBadge,
  supervisorBadgeTone,
  supervisorSummary,
  type InactiveTeamGroup,
  type SupervisorTeam,
  type TeamGroup,
} from "@/features/team/team-view";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import styles from "./team-structure-cards.module.css";

const cellLinkToneClass: Partial<Record<BadgeTone, string>> = {
  risk: styles.cellLinkRisk,
  warn: styles.cellLinkWarn,
  neutral: styles.cellLinkNeutral,
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
    <ListLinkCard
      href={href}
      title={name}
      subtitle={subtitle}
      badgeLabel={badgeLabel}
      badgeTone={badgeTone}
      surface="plain"
      className={cn(styles.cellLink, "card-hover-lift", className)}
    />
  );
}

export function TeamGroupLink({ group }: { group: TeamGroup }) {
  const tone = groupBadgeTone(group);
  const showBadge = shouldShowGroupBadge(group);

  return (
    <TeamCellLink
      href={ROUTES.group(group.id)}
      name={group.name}
      subtitle={compactGroupSubtitle(group)}
      badgeLabel={showBadge ? group.statusLabel : undefined}
      badgeTone={tone}
      className={showBadge ? cellLinkToneClass[tone] : undefined}
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

export function TeamSupervisorCard({ supervisor }: { supervisor: SupervisorTeam }) {
  const hasGroups = supervisor.groups.length > 0;
  const badgeTone = supervisorBadgeTone(supervisor);
  return (
    <PriorityCard as="section" priorityTone={badgeTone !== "neutral" ? badgeTone : undefined} padding="sm" radius="default" elevation="soft" containment="hidden">
      <div className="flex items-start gap-2.5">
        <Avatar name={supervisor.name} className={styles.avatar} />
        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p className="k-item-title">{supervisor.name}</p>
          </div>

          {!hasGroups ? (
            <>
              <p className={styles.supervisorDescriptionText}>{supervisorSummary(supervisor)}</p>
              <div className="mt-2">
                <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
              </div>
            </>
          ) : (
            <DisclosureCard
              title={supervisorSummary(supervisor)}
              tone="transparent"
              size="sm"
              separatedContent
              closedLabel="Ver células"
              openLabel="Mostrar menos"
              className="mt-2"
              titleClassName={styles.supervisorDescriptionText}
              contentClassName={styles.cellList}
            >
              <ProgressiveList
                initialCount={GROUPS_PER_SUPERVISOR_LIMIT}
                step={GROUPS_PER_SUPERVISOR_LIMIT}
                moreLabel="Ver mais células"
                lessLabel="Mostrar menos células"
              >
                {supervisor.groups.map((group) => (
                  <TeamGroupLink key={group.id} group={group} />
                ))}
              </ProgressiveList>
            </DisclosureCard>
          )}
        </div>
      </div>
    </PriorityCard>
  );
}
