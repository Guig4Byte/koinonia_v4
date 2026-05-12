import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { EmptyState } from "@/components/shared/base-cards";
import { priorityCardClass } from "@/lib/card-priority";
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
    <Link
      href={href}
      className={cn(styles.cellLink, "card-hover-lift", className)}
    >
      <span className="min-w-0">
        <span className="k-item-title-sm block truncate">{name}</span>
        <span className="k-item-caption-truncate">{subtitle}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badgeLabel ? <Badge tone={badgeTone} className="max-w-[48%]">{badgeLabel}</Badge> : null}
        <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-brand)] opacity-60" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
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
    <section className={cn(styles.supervisorCard, styles.supervisorPriorityCard, priorityCardClass(badgeTone !== "neutral" ? badgeTone : undefined))}>
      <div className="flex items-start gap-2.5">
        <Avatar name={supervisor.name} className={styles.avatar} />
        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p className="k-item-title">{supervisor.name}</p>
          </div>

          {!hasGroups ? (
            <>
              <p className={styles.supervisorSummaryText}>{supervisorSummary(supervisor)}</p>
              <div className="mt-2">
                <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
              </div>
            </>
          ) : (
            <details className={cn(styles.supervisorDetails, "group")}>
              <summary className={styles.supervisorSummary}>
                <span className={styles.supervisorSummaryText}>
                  {supervisorSummary(supervisor)}
                </span>
                <span className={styles.supervisorSummaryAction}>
                  <span className="group-open:hidden">Ver células</span>
                  <span className="hidden group-open:inline">Mostrar menos</span>
                  <span className="inline-block transition group-active:translate-x-0.5" aria-hidden="true">→</span>
                </span>
              </summary>
              <div className={styles.cellList}>
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
              </div>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
