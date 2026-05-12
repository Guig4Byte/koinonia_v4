import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import styles from "./group-detail.module.css";

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
    <section className={styles.pendingEventSection}>
      <Link href={ROUTES.event(event.id)} className={cn(styles.pendingEventCard, "priority-card priority-card-warn")}>
        <span className={styles.pendingEventTop}>
          <span>{statusLabel}</span>
        </span>
        <span className={styles.pendingEventBody}>
          <span className="min-w-0">
            <span className="block truncate text-[length:var(--text-base)] font-bold text-[color:var(--color-text-primary)]">{event.title}</span>
            <span className="mt-1 block text-[length:var(--text-xs)] font-medium leading-relaxed text-[color:var(--color-text-secondary)]">
              {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)}
            </span>
          </span>
          <span className={styles.pendingEventAction}>
            {actionLabel} →
          </span>
        </span>
      </Link>
    </section>
  );
}
