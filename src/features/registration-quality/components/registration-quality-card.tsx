import { ArrowRight, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  actionableRegistrationQualityIssues,
  type RegistrationQualitySummary,
} from "@/features/registration-quality/registration-quality";
import styles from "./registration-quality-card.module.css";

export function RegistrationQualityCard({
  summary,
  className,
}: {
  summary: RegistrationQualitySummary;
  className?: string;
}) {
  const issues = actionableRegistrationQualityIssues(summary);
  const action = issues[0] ?? null;

  return (
    <Card as="section" padding="md" radius="lg" surface="summaryGlow" className={className}>
      <div className="flex items-start gap-3">
        <span className={styles.iconSurface} aria-hidden="true">
          <ClipboardCheck className="h-5 w-5" strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="k-eyebrow mb-1">Base inicial</p>
          <h2 className="text-[length:var(--text-lg)] font-semibold leading-tight text-[color:var(--color-text-primary)]">
            {summary.title}
          </h2>
          <p className="mt-1 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
            {summary.detail}
          </p>
        </div>
      </div>

      {issues.length > 0 ? (
        <ul
          className={styles.issuesList}
          aria-label="Pendências de qualidade cadastral"
        >
          {issues.map((issue) => (
            <li key={issue.key} className={styles.issueRow}>
              <div className="min-w-0">
                <p className="text-[length:var(--text-sm)] font-semibold leading-snug text-[color:var(--color-text-primary)]">
                  {issue.label}
                </p>
                <p className="mt-1 text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-muted)]">
                  {issue.detail}
                </p>
              </div>
              <Badge tone="neutral" size="sm" shape="rounded" maxWidth="none">
                {issue.count}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {action ? (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <ButtonLink href={action.href} variant="actionPillSecondary" size="sm" density="actionPill" responsiveWidth="fullUntilSm">
            {action.actionLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}
