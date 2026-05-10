import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export type GroupPendingEvent = {
  id: string;
  title: string;
  startsAt: Date;
};

export function GroupPendingEventCard({
  event,
  statusLabel,
  actionLabel,
}: {
  event: GroupPendingEvent;
  statusLabel: string;
  actionLabel: string;
}) {
  return (
    <section className="group-pending-event-section">
      <Link href={ROUTES.event(event.id)} className={cn("group-pending-event-card", "priority-card priority-card-warn")}>
        <span className="group-pending-event-top">
          <span>{statusLabel}</span>
        </span>
        <span className="group-pending-event-body">
          <span className="min-w-0">
            <span className="block truncate text-[length:var(--text-base)] font-bold text-[color:var(--color-text-primary)]">{event.title}</span>
            <span className="mt-1 block text-[length:var(--text-xs)] font-medium leading-relaxed text-[color:var(--color-text-secondary)]">
              {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)}
            </span>
          </span>
          <span className="group-pending-event-action">
            {actionLabel} →
          </span>
        </span>
      </Link>
    </section>
  );
}
