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

  return (
    <section className="space-y-3">
      <CheckInSummaryCard
        summary={checkIn.summary}
        helperText={checkInHelperText(mode)}
        allMembersPresent={checkIn.allMembersPresent}
        isPending={checkIn.isPending}
        errorMessage={checkIn.errorMessage}
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
      />

      <div className="space-y-3">
        {checkIn.items.map((item) => (
          <CheckInMemberCard key={item.personId} item={item} onSetStatus={checkIn.setStatus} />
        ))}
      </div>

      <CheckInSaveBar
        summary={checkIn.summary}
        mode={mode}
        cancelHref={cancelHref}
        cancelLabel={cancelLabel}
        canSave={checkIn.canSave}
        isPending={checkIn.isPending}
        submitLabel={submitLabel}
        saveBarOffset={saveBarOffset}
        onSave={checkIn.save}
      />
    </section>
  );
}
