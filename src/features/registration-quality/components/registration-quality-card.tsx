"use client";

import { useId, useState } from "react";
import { ArrowRight, ChevronRight, ClipboardCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  actionableRegistrationQualityIssues,
  type RegistrationQualityIssueKey,
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
  const sheetTitleId = useId();
  const [activeIssueKey, setActiveIssueKey] = useState<RegistrationQualityIssueKey | null>(null);
  const issues = actionableRegistrationQualityIssues(summary);
  const activeIssue = issues.find((issue) => issue.key === activeIssueKey) ?? null;

  function closeSheet() {
    setActiveIssueKey(null);
  }

  return (
    <>
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
                <button
                  type="button"
                  className={styles.issueButton}
                  aria-haspopup="dialog"
                  onClick={() => setActiveIssueKey(issue.key)}
                >
                  <span className={styles.issueContent}>
                    <span className="text-[length:var(--text-sm)] font-semibold leading-snug text-[color:var(--color-text-primary)]">
                      {issue.label}
                    </span>
                    <span className="mt-1 block text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-muted)]">
                      {issue.detail}
                    </span>
                  </span>
                  <span className={styles.issueMeta}>
                    <Badge tone="neutral" size="sm" shape="rounded" maxWidth="none">
                      {issue.count}
                    </Badge>
                    <ChevronRight className={styles.issueChevron} aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {activeIssue ? (
        <BottomSheet
          onDismiss={closeSheet}
          dismissLabel="Fechar dados a completar"
          tone="accent"
          size="md"
          panelClassName={styles.sheetPanel}
          panelProps={{ role: "dialog", "aria-modal": true, "aria-labelledby": sheetTitleId }}
        >
          <div className={styles.sheet}>
            <div className={styles.sheetHeader}>
              <span className={styles.sheetIcon} aria-hidden="true">
                <ClipboardCheck className={styles.sheetIconSvg} />
              </span>
              <div className={styles.sheetTitleBlock}>
                <p className="k-eyebrow mb-1">Base inicial</p>
                <h2 id={sheetTitleId} className={styles.sheetTitle}>{activeIssue.label}</h2>
                <p className={styles.sheetDescription}>{activeIssue.detail}</p>
              </div>
              <button type="button" className={styles.sheetClose} aria-label="Fechar" onClick={closeSheet}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <ul className={styles.sheetList}>
              {activeIssue.items.map((item) => (
                <li key={item.id} className={styles.sheetItem}>
                  <div className={styles.sheetItemCopy}>
                    <p className={styles.sheetItemTitle}>{item.title}</p>
                    <p className={styles.sheetItemDetail}>{item.detail}</p>
                  </div>
                  <ButtonLink
                    href={item.href}
                    variant="actionPillSecondary"
                    size="sm"
                    density="actionPillCompact"
                    responsiveWidth="fullUntilSm"
                    onClick={closeSheet}
                  >
                    {item.actionLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
