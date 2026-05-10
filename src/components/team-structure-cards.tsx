import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProgressiveList } from "@/components/progressive-list";
import { EmptyState } from "@/components/base-cards";
import { priorityCardClass } from "@/components/card-priority";
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
import { avatarColorForName, initials } from "@/lib/text";
import { ROUTES } from "@/lib/routes";

export function TeamGroupLink({ group }: { group: TeamGroup }) {
  const tone = groupBadgeTone(group);

  return (
    <Link
      href={ROUTES.group(group.id)}
      className={cn("team-cell-link card-hover-lift", shouldShowGroupBadge(group) && `team-cell-link-${tone}`)}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{group.name}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">{compactGroupSubtitle(group)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {shouldShowGroupBadge(group) ? <Badge tone={tone}>{group.statusLabel}</Badge> : null}
        <span className="text-sm font-bold text-[var(--color-brand)] opacity-60" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

export function InactiveTeamGroupLink({ group }: { group: InactiveTeamGroup }) {
  const scheduleText = inactiveGroupScheduleText(group);

  return (
    <Link
      href={ROUTES.editGroup(group.id)}
      className="team-cell-link team-cell-link-neutral card-hover-lift"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{group.name}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">
          {scheduleText}{group.locationName ? ` · ${group.locationName}` : ""}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge tone="neutral">Inativa</Badge>
        <span className="text-sm font-bold text-[var(--color-brand)] opacity-60" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

export function TeamSupervisorCard({ supervisor }: { supervisor: SupervisorTeam }) {
  const hasGroups = supervisor.groups.length > 0;
  const badgeTone = supervisorBadgeTone(supervisor);
  const avatarColors = avatarColorForName(supervisor.name);

  return (
    <section className={cn("team-supervisor-card", priorityCardClass(badgeTone !== "neutral" ? badgeTone : undefined))}>
      <div className="flex items-start gap-2.5">
        <div
          className="team-avatar"
          style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}
        >
          {initials(supervisor.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text-primary)]">{supervisor.name}</p>
          </div>

          {!hasGroups ? (
            <>
              <p className="team-supervisor-summary-text">{supervisorSummary(supervisor)}</p>
              <div className="mt-2">
                <EmptyState compact>Nenhuma célula ativa vinculada a este supervisor.</EmptyState>
              </div>
            </>
          ) : (
            <details className="team-supervisor-details group">
              <summary className="team-supervisor-summary">
                <span className="team-supervisor-summary-text">
                  {supervisorSummary(supervisor)}
                </span>
                <span className="team-supervisor-summary-action">
                  <span className="group-open:hidden">Ver células</span>
                  <span className="hidden group-open:inline">Mostrar menos</span>
                  <span className="inline-block transition group-active:translate-x-0.5" aria-hidden="true">→</span>
                </span>
              </summary>
              <div className="team-cell-list">
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
