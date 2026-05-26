import { ArrowDownCircle, Heart } from "lucide-react";
import type { ReactNode } from "react";
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
        <span className={styles.signalIcon} role="img" aria-label={view.signalLabel}>
          <Heart className={styles.signalIconSvg} aria-hidden="true" />
        </span>

        <div className={styles.copy}>
          <p className={styles.title} title={view.nextStepLabel}>{view.nextStepLabel}</p>
          <p className={styles.description}>{view.nextStepDetail}</p>
        </div>
      </div>

      <p className={styles.contextLine}>{view.contextLabel}</p>

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
