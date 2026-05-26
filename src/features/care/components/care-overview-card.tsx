import { ArrowDownCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { PriorityCard } from "@/components/ui/priority-card";
import type { PersonCareOverviewView } from "@/features/people/person-care-overview";
import { cn } from "@/lib/cn";
import styles from "./care-overview-card.module.css";

export function CareOverviewCard({
  view,
  className,
  children,
  id,
}: {
  view: PersonCareOverviewView;
  className?: string;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <PriorityCard id={id} as="section" priorityTone={view.priorityTone} radius="lg" className={cn(styles.overview, className)}>
      <div className={styles.header}>
        <div className={styles.copy}>
          <p className={styles.title}>{view.nextStepLabel}</p>
          <p className={styles.description}>{view.nextStepDetail}</p>
        </div>
        <Badge tone={view.badgeTone} size="sm" maxWidth="none" truncate={false} className={styles.statusBadge}>
          {view.badgeLabel}
        </Badge>
      </div>

      <dl className={styles.grid}>
        <div className={styles.item}>
          <dt className={styles.itemLabel}>Responsável atual</dt>
          <dd className={styles.itemContent}>
            <p className={styles.itemValue}>{view.ownerLabel}</p>
            <p className={styles.itemDetail}>{view.ownerDetail}</p>
          </dd>
        </div>

        <div className={styles.item}>
          <dt className={styles.itemLabel}>Último cuidado</dt>
          <dd className={styles.itemContent}>
            <p className={styles.itemValue}>{view.latestTouchLabel}</p>
            <p className={styles.itemDetail}>{view.latestTouchDetail}</p>
          </dd>
        </div>
      </dl>

      {children ? (
        <div className={styles.embeddedActions}>{children}</div>
      ) : (
        <div className={styles.actionRow}>
          <ButtonLink href={view.actionHref} variant="secondary" size="sm" fullWidth>
            <ArrowDownCircle className="h-4 w-4" aria-hidden="true" />
            {view.actionLabel}
          </ButtonLink>
        </div>
      )}
    </PriorityCard>
  );
}
