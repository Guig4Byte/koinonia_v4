"use client";

import { useEffect, useMemo, useState } from "react";
import { filterChipClassName } from "@/components/ui/filter-chip";
import { FixedActionBarContent } from "@/components/ui/fixed-action-bar";
import { Feedback } from "@/components/ui/feedback";
import { CheckInMemberCard } from "@/features/check-in/components/check-in-member-card";
import { CheckInSaveBar, shouldShowCheckInSaveBar } from "@/features/check-in/components/check-in-save-bar";
import { CheckInSummaryCard } from "@/features/check-in/components/check-in-summary-card";
import { CheckInVisitorsCard } from "@/features/check-in/components/check-in-visitors-card";
import { useCheckInController, type CheckInMember, type CheckInVisitorRecord } from "@/hooks/use-check-in-controller";
import {
  CHECK_IN_MEMBER_FILTERS,
  checkInFilterCount,
  checkInFilterLabel,
  checkInFilteredEmptyMessage,
  checkInHelperText,
  filterCheckInItems,
  type CheckInMemberFilter,
  type CheckInMode,
} from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";
import styles from "./check-in.module.css";

const unsavedCheckInMessage = "Você tem alterações de presença não salvas. Deseja sair sem salvar?";

export function CheckInList({
  eventId,
  members,
  initialVisitors = [],
  initialVisitorCount = 0,
  submitLabel = "Salvar presença",
  mode = "register",
  cancelHref,
  cancelLabel = "Cancelar",
}: {
  eventId: string;
  members: CheckInMember[];
  initialVisitors?: CheckInVisitorRecord[];
  initialVisitorCount?: number;
  submitLabel?: string;
  mode?: CheckInMode;
  cancelHref?: string;
  cancelLabel?: string;
}) {
  const [activeFilter, setActiveFilter] = useState<CheckInMemberFilter>("all");
  const checkIn = useCheckInController({
    eventId,
    members,
    initialVisitors,
    initialVisitorCount,
    mode,
  });

  useEffect(() => {
    if (!checkIn.hasUnsavedChanges || checkIn.isPending) return undefined;

    function confirmBrowserLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", confirmBrowserLeave);

    return () => {
      window.removeEventListener("beforeunload", confirmBrowserLeave);
    };
  }, [checkIn.hasUnsavedChanges, checkIn.isPending]);

  const displayItems = useMemo(
    () => checkIn.items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        if (a.item.status === null && b.item.status !== null) return -1;
        if (a.item.status !== null && b.item.status === null) return 1;
        return a.index - b.index;
      })
      .map(({ item }) => item),
    [checkIn.items],
  );
  const filteredItems = filterCheckInItems(displayItems, activeFilter);
  const activeFilterCount = checkInFilterCount(checkIn.summary, activeFilter);

  function confirmCancel() {
    if (checkIn.isPending || !checkIn.hasUnsavedChanges) return true;
    return window.confirm(unsavedCheckInMessage);
  }

  const showSaveBar = shouldShowCheckInSaveBar();

  return (
    <section className={styles.list}>
      <FixedActionBarContent className={styles.content} reserveSpace={showSaveBar} data-testid="check-in-content">
        <CheckInSummaryCard
          summary={checkIn.summary}
          helperText={checkInHelperText(mode)}
          allMembersPresent={checkIn.allMembersPresent}
          isPending={checkIn.isPending}
          bulkConfirmationOpen={checkIn.bulkConfirmationOpen}
          errorMessage={checkIn.errorMessage}
          onCancelMarkAllAsPresent={checkIn.cancelMarkAllAsPresent}
          onConfirmMarkAllAsPresent={checkIn.confirmMarkAllAsPresent}
          onMarkAllAsPresent={checkIn.markAllAsPresent}
        />

        <CheckInVisitorsCard
          savedVisitors={checkIn.savedVisitors}
          fallbackSavedVisitorCount={checkIn.savedVisitorCount}
          visitors={checkIn.visitors}
          visitorName={checkIn.visitorName}
          onVisitorNameChange={checkIn.setVisitorName}
          onAddVisitor={checkIn.addVisitor}
          onRemoveVisitor={checkIn.removeVisitor}
          disabled={checkIn.isPending}
        />

        <div className={styles.memberSection}>
          <div className={styles.memberSectionHeader}>
            <div className="min-w-0">
              <p className="k-item-title">Membros da célula</p>
              <p className="mt-1 text-[length:var(--text-xs)] leading-snug text-[color:var(--color-text-secondary)]">
                Revise por status para encontrar quem ainda está sem marcação, ausências e justificativas sem rolar a lista inteira.
              </p>
            </div>
            <span className={styles.memberCount} aria-live="polite">
              {activeFilterCount} / {checkIn.summary.totalMembers}
            </span>
          </div>

          <div className={styles.filterScroller} role="group" aria-label="Filtrar membros por status de presença">
            {CHECK_IN_MEMBER_FILTERS.map((filter) => {
              const active = activeFilter === filter;
              const count = checkInFilterCount(checkIn.summary, filter);

              return (
                <button
                  key={filter}
                  type="button"
                  className={cn(filterChipClassName({ active, variant: "period" }), styles.filterButton)}
                  aria-pressed={active}
                  onClick={() => setActiveFilter(filter)}
                  disabled={checkIn.isPending}
                >
                  <span>{checkInFilterLabel(filter)}</span>
                  <span className={styles.filterCount}>{count}</span>
                </button>
              );
            })}
          </div>

          {filteredItems.length > 0 ? (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <CheckInMemberCard key={item.personId} item={item} onSetStatus={checkIn.setStatus} disabled={checkIn.isPending} />
              ))}
            </div>
          ) : (
            <Feedback tone="info" compact>
              {checkInFilteredEmptyMessage(activeFilter)}
            </Feedback>
          )}
        </div>
      </FixedActionBarContent>

      {showSaveBar ? (
        <CheckInSaveBar
          summary={checkIn.summary}
          mode={mode}
          cancelHref={cancelHref}
          cancelLabel={cancelLabel}
          canSave={checkIn.canSave}
          hasUnsavedChanges={checkIn.hasUnsavedChanges}
          isPending={checkIn.isPending}
          errorMessage={checkIn.errorMessage}
          submitLabel={submitLabel}
          onCancelAttempt={confirmCancel}
          onSave={checkIn.save}
        />
      ) : null}
    </section>
  );
}
