import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { PriorityCard } from "@/components/ui/priority-card";
import { leaderCurrentEventState, type LeaderCurrentEvent } from "@/features/leader/leader-page-view";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export function LeaderCurrentEventCard({ event }: { event: LeaderCurrentEvent }) {
  const state = leaderCurrentEventState(event);

  return (
    <PriorityCard as="section" interactive>
      <div className="k-card-header-row">
        <div className="min-w-0">
          <p className="k-item-title">{state.groupName}</p>
          <p className="mt-0.5 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
            {formatShortDate(event.startsAt)}, {formatTime(event.startsAt)}
          </p>
          {state.locationName ? (
            <p className="k-item-detail-tight">
              {state.locationName}
            </p>
          ) : null}
        </div>
        <Badge tone={state.badgeTone} className="max-w-[48%]">{state.badgeLabel}</Badge>
      </div>
      <p className="mt-3 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
        {state.description}
      </p>
      <ButtonLink
        href={ROUTES.event(event.id)}
        fullWidth
        size="sm"
        className="mt-4 rounded-full px-4"
      >
        {state.ctaLabel} <span aria-hidden="true">→</span>
      </ButtonLink>
    </PriorityCard>
  );
}
