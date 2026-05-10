import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { leaderCurrentEventState, type LeaderCurrentEvent } from "@/features/leader/leader-page-view";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export function LeaderCurrentEventCard({ event }: { event: LeaderCurrentEvent }) {
  const state = leaderCurrentEventState(event);

  return (
    <section className="card-hover-lift rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <div className="k-card-header-row">
        <div className="min-w-0">
          <p className="k-item-title">{state.groupName}</p>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {formatShortDate(event.startsAt)}, {formatTime(event.startsAt)}
          </p>
          {state.locationName ? (
            <p className="k-item-detail-tight">
              {state.locationName}
            </p>
          ) : null}
        </div>
        <Badge tone={state.badgeTone}>{state.badgeLabel}</Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {state.description}
      </p>
      <Link
        href={ROUTES.event(event.id)}
        className="k-primary-action mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]"
      >
        {state.ctaLabel} <span aria-hidden="true" className="ml-1">→</span>
      </Link>
    </section>
  );
}
