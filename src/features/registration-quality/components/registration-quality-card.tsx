"use client";

import { useId, useState } from "react";
import { ArrowRight, ChevronRight, ClipboardCheck, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  actionableRegistrationQualityIssues,
  type RegistrationQualityIssueKey,
  type RegistrationQualitySummary,
} from "@/features/registration-quality/registration-quality";
import { matchesNormalizedQuery, normalizeSearchText } from "@/lib/text";
import styles from "./registration-quality-card.module.css";

const INITIAL_SHEET_ITEMS = 6;
const SHEET_ITEMS_STEP = 6;

export function RegistrationQualityCard({
  summary,
  className,
}: {
  summary: RegistrationQualitySummary;
  className?: string;
}) {
  const sheetTitleId = useId();
  const sheetSearchId = useId();
  const [activeIssueKey, setActiveIssueKey] = useState<RegistrationQualityIssueKey | null>(null);
  const [sheetQuery, setSheetQuery] = useState("");
  const [visibleSheetItems, setVisibleSheetItems] = useState(INITIAL_SHEET_ITEMS);
  const issues = actionableRegistrationQualityIssues(summary);
  const activeIssue = issues.find((issue) => issue.key === activeIssueKey) ?? null;
  const normalizedSheetQuery = normalizeSearchText(sheetQuery);
  const filteredSheetItems = activeIssue
    ? activeIssue.items.filter((item) => (
      normalizedSheetQuery
        ? matchesNormalizedQuery(`${item.title} ${item.detail}`, normalizedSheetQuery)
        : true
    ))
    : [];
  const visibleItems = filteredSheetItems.slice(0, visibleSheetItems);
  const hiddenItemsCount = Math.max(filteredSheetItems.length - visibleSheetItems, 0);
  const visibleItemsCount = Math.min(visibleSheetItems, filteredSheetItems.length);
  const shouldShowSheetSearch = Boolean(activeIssue && activeIssue.items.length > INITIAL_SHEET_ITEMS);

  function closeSheet() {
    setActiveIssueKey(null);
  }

  function openIssue(issueKey: RegistrationQualityIssueKey) {
    setActiveIssueKey(issueKey);
    setSheetQuery("");
    setVisibleSheetItems(INITIAL_SHEET_ITEMS);
  }

  function updateSheetQuery(query: string) {
    setSheetQuery(query);
    setVisibleSheetItems(INITIAL_SHEET_ITEMS);
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
                  onClick={() => openIssue(issue.key)}
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

            {shouldShowSheetSearch ? (
              <div className={styles.sheetToolbar}>
                <label className={styles.sheetSearchLabel} htmlFor={sheetSearchId}>
                  Buscar nesta lista
                </label>
                <div className={styles.sheetSearchControl}>
                  <Search className={styles.sheetSearchIcon} aria-hidden="true" />
                  <input
                    id={sheetSearchId}
                    className={styles.sheetSearchInput}
                    value={sheetQuery}
                    onChange={(event) => updateSheetQuery(event.target.value)}
                    placeholder="Buscar por nome, e-mail ou célula..."
                    type="search"
                  />
                </div>
                <p className={styles.sheetResultCount}>
                  {normalizedSheetQuery
                    ? `${filteredSheetItems.length} de ${activeIssue.count} registro${activeIssue.count === 1 ? "" : "s"} encontrado${filteredSheetItems.length === 1 ? "" : "s"}.`
                    : `Mostrando ${visibleItemsCount} de ${activeIssue.count} registro${activeIssue.count === 1 ? "" : "s"}.`}
                </p>
              </div>
            ) : null}

            {visibleItems.length > 0 ? (
              <ul className={styles.sheetList}>
                {visibleItems.map((item) => (
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
            ) : (
              <div className={styles.sheetEmptyState}>
                <p className={styles.sheetEmptyTitle}>Nenhum registro encontrado</p>
                <p className={styles.sheetEmptyDetail}>Tente buscar por outro nome, e-mail ou célula.</p>
              </div>
            )}

            {hiddenItemsCount > 0 ? (
              <div className={styles.sheetActions}>
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  density="progressiveControl"
                  fullWidth
                  onClick={() => setVisibleSheetItems((current) => current + SHEET_ITEMS_STEP)}
                >
                  Mostrar mais {Math.min(hiddenItemsCount, SHEET_ITEMS_STEP)}
                </Button>
              </div>
            ) : null}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
