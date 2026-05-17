"use client";

import { FixedActionBarContent } from "@/components/ui/fixed-action-bar";
import { CheckInMemberCard } from "@/features/check-in/components/check-in-member-card";
import { CheckInSaveBar } from "@/features/check-in/components/check-in-save-bar";
import { CheckInSummaryCard } from "@/features/check-in/components/check-in-summary-card";
import { CheckInVisitorsCard } from "@/features/check-in/components/check-in-visitors-card";
import { useCheckInController, type CheckInMember, type CheckInVisitorRecord } from "@/hooks/use-check-in-controller";
import { checkInHelperText, type CheckInMode } from "@/features/check-in/check-in-view";
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
  const checkIn = useCheckInController({
    eventId,
    members,
    initialVisitors,
    initialVisitorCount,
    mode,
  });

  const displayItems = checkIn.items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (a.item.status === null && b.item.status !== null) return -1;
      if (a.item.status !== null && b.item.status === null) return 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);

  return (
    <section className={styles.list}>
      <FixedActionBarContent className={styles.content} data-testid="check-in-content">
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

        <div className="space-y-3">
          {displayItems.map((item) => (
            <CheckInMemberCard key={item.personId} item={item} onSetStatus={checkIn.setStatus} disabled={checkIn.isPending} />
          ))}
        </div>
      </FixedActionBarContent>

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
        onSave={checkIn.save}
      />
    </section>
  );
}
