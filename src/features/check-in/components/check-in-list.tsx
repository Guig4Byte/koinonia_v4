"use client";

import { useMemo, useState } from "react";
import { FixedActionBarContent } from "@/components/ui/fixed-action-bar";
import { CheckInMemberSection } from "@/features/check-in/components/check-in-member-section";
import {
  CheckInSaveBar,
  shouldShowCheckInSaveBar,
} from "@/features/check-in/components/check-in-save-bar";
import { CheckInSummaryCard } from "@/features/check-in/components/check-in-summary-card";
import { CheckInVisitorsCard } from "@/features/check-in/components/check-in-visitors-card";
import {
  useCheckInController,
  type CheckInMember,
  type CheckInVisitorRecord,
} from "@/features/check-in/hooks/use-check-in-controller";
import { useCheckInUnsavedWarning } from "@/features/check-in/hooks/use-check-in-unsaved-warning";
import {
  sortCheckInItemsForDisplay,
  type CheckInMemberFilter,
  type CheckInMode,
} from "@/features/check-in/check-in-view";
import styles from "./check-in.module.css";

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

  const confirmCancel = useCheckInUnsavedWarning({
    hasUnsavedChanges: checkIn.hasUnsavedChanges,
    isPending: checkIn.isPending,
  });

  const displayItems = useMemo(
    () => sortCheckInItemsForDisplay(checkIn.items),
    [checkIn.items],
  );

  const showSaveBar = shouldShowCheckInSaveBar();

  return (
    <section className={styles.list}>
      <FixedActionBarContent
        className={styles.content}
        reserveSpace={showSaveBar}
        data-testid="check-in-content"
      >
        <CheckInSummaryCard
          summary={checkIn.summary}
          errorMessage={checkIn.errorMessage}
          disabled={checkIn.isPending}
          onMarkAllPresent={checkIn.markAllPresent}
        />

        <CheckInMemberSection
          activeFilter={activeFilter}
          disabled={checkIn.isPending}
          items={displayItems}
          summary={checkIn.summary}
          onActiveFilterChange={setActiveFilter}
          onSetStatus={checkIn.setStatus}
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
