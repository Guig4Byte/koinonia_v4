import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ProgressiveList } from "@/components/progressive-list";
import { EmptyState } from "@/components/base-cards";
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
import { avatarColorForName, initials } from "@/lib/text";
import { ROUTES } from "@/lib/routes";

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
      className={cn("team-cell-link card-hover-lift", className)}
    >
      <span className="min-w-0">
        <span className="k-item-title-sm block truncate">{name}</span>
        <span className="k-item-caption-truncate">{subtitle}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badgeLabel ? <Badge tone={badgeTone}>{badgeLabel}</Badge> : null}
        <span className="text-sm font-bold text-[var(--color-brand)] opacity-60" aria-hidden="true">
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
      className={showBadge ? `team-cell-link-${tone}` : undefined}
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
      className="team-cell-link-neutral"
    />
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
            <p className="k-item-title">{supervisor.name}</p>
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
