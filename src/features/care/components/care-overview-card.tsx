import { ArrowDownCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { PriorityCard } from "@/components/ui/priority-card";
import type { PersonCareOverviewView } from "@/features/people/person-care-overview";
import { cn } from "@/lib/cn";
import styles from "./care-overview-card.module.css";

export function CareOverviewCard({ view, className }: { view: PersonCareOverviewView; className?: string }) {
  return (
    <PriorityCard as="section" priorityTone={view.priorityTone} radius="lg" className={cn(styles.overview, className)}>
      <div className={styles.header}>
        <div className={styles.copy}>
          <p className={styles.title}>{view.title}</p>
          <p className={styles.description}>{view.description}</p>
        </div>
        <Badge tone={view.badgeTone} size="sm" maxWidth="none" truncate={false}>
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

        <div className={styles.item}>
          <dt className={styles.itemLabel}>Próximo passo</dt>
          <dd className={styles.itemContent}>
            <p className={styles.itemValue}>{view.nextStepLabel}</p>
            <p className={styles.itemDetail}>{view.nextStepDetail}</p>
          </dd>
        </div>
      </dl>

      <div className={styles.actionRow}>
        <ButtonLink href={view.actionHref} variant="secondary" size="sm" fullWidth>
          <ArrowDownCircle className="h-4 w-4" aria-hidden="true" />
          {view.actionLabel}
        </ButtonLink>
      </div>
    </PriorityCard>
  );
}
