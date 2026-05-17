import { ButtonLink } from "@/components/ui/button-link";
import { CardHeader } from "@/components/ui/card-header";
import { PriorityCard } from "@/components/ui/priority-card";
import { leaderCurrentEventState, type LeaderCurrentEvent } from "@/features/leader/leader-page-view";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export function LeaderCurrentEventCard({ event }: { event: LeaderCurrentEvent }) {
  const state = leaderCurrentEventState(event);

  return (
    <PriorityCard as="section" interactive>
      <CardHeader
        title={state.groupName}
        subtitle={`${formatShortDate(event.startsAt)}, ${formatTime(event.startsAt)}`}
        detail={state.locationName}
        badgeLabel={state.badgeLabel}
        badgeTone={state.badgeTone}
      />
      <p className="mt-3 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
        {state.description}
      </p>
      <ButtonLink
        href={ROUTES.event(event.id)}
        fullWidth
        size="sm"
        shape="pill"
        className="mt-4"
      >
        {state.ctaLabel} <span aria-hidden="true">→</span>
      </ButtonLink>
    </PriorityCard>
  );
}
