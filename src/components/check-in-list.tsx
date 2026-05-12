"use client";

import { CheckInMemberCard } from "@/components/check-in-member-card";
import { CheckInSaveBar } from "@/components/check-in-save-bar";
import { CheckInSummaryCard } from "@/components/check-in-summary-card";
import { CheckInVisitorsCard } from "@/components/check-in-visitors-card";
import { useCheckInController, type CheckInMember, type CheckInVisitorRecord } from "@/hooks/use-check-in-controller";
import { checkInHelperText, type CheckInMode } from "@/features/check-in/check-in-view";

export function CheckInList({
  eventId,
  members,
  initialVisitors = [],
  initialVisitorCount = 0,
  submitLabel = "Salvar presença",
  mode = "register",
  cancelHref,
  cancelLabel = "Cancelar",
  saveBarOffset = "nav",
}: {
  eventId: string;
  members: CheckInMember[];
  initialVisitors?: CheckInVisitorRecord[];
  initialVisitorCount?: number;
  submitLabel?: string;
  mode?: CheckInMode;
  cancelHref?: string;
  cancelLabel?: string;
  saveBarOffset?: "nav" | "page";
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
    <section className="space-y-3">
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

      <CheckInSaveBar
        summary={checkIn.summary}
        mode={mode}
        cancelHref={cancelHref}
        cancelLabel={cancelLabel}
        canSave={checkIn.canSave}
        isPending={checkIn.isPending}
        errorMessage={checkIn.errorMessage}
        submitLabel={submitLabel}
        saveBarOffset={saveBarOffset}
        onSave={checkIn.save}
      />
    </section>
  );
}
