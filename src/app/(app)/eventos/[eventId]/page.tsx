import { AppShell } from "@/components/layout/app-shell";
import { BackLink, InfoCard, SectionTitle } from "@/components/shared/base-cards";
import { ButtonLink } from "@/components/ui/button-link";
import { CheckInList } from "@/features/check-in/components/check-in-list";
import { EventDetailsActions } from "@/features/events/components/event-details-actions";
import { EventDetailHeaderCard } from "@/features/events/components/event-detail-header-card";
import { EventReadOnlySummary } from "@/features/events/components/event-read-only-summary";
import { getEventDetailPageData } from "@/app/(app)/eventos/[eventId]/page-data";
import { getCurrentUser } from "@/lib/auth/current-user";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const user = await getCurrentUser();
  const { eventId } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const {
    adjustmentHref,
    backHref,
    backLabel,
    canEditEventDetails,
    canOfferAdjustment,
    cancelHref,
    cancelLabel,
    checkInMode,
    closedLabel,
    completed,
    detailState,
    event,
    isCancelledEvent,
    isFutureEvent,
    locationName,
    members,
    nav,
    presence,
    presenceTone,
    savedMessage,
    showCheckInForm,
    visitorRows,
    visitorsCount,
  } = await getEventDetailPageData({ user, eventId, queryParams });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={nav}
      hideBottomNav={showCheckInForm || canEditEventDetails}
      headerVariant="compact"
    >
      <BackLink href={backHref}>{backLabel}</BackLink>

      {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

      <EventDetailHeaderCard
        title={event.title}
        groupId={event.group?.id}
        startsAt={event.startsAt}
        locationName={locationName}
        checkInLabel={detailState.checkInLabel}
        eventStatusLabel={detailState.eventStatusLabel}
        eventStatusTone={detailState.eventStatusTone}
        hasPresenceData={presence.hasPresenceData}
        presenceRate={presence.presenceRate}
        presenceTone={presenceTone}
        visitorsCount={visitorsCount}
        membersCount={members.length}
        showGroupLink={!showCheckInForm}
        showContextSummary={!showCheckInForm}
      />

      <SectionTitle>{detailState.checkInSectionTitle}</SectionTitle>
      {event.groupId ? (
        showCheckInForm ? (
          <CheckInList
            eventId={event.id}
            members={members}
            initialVisitors={visitorRows}
            submitLabel={detailState.checkInSubmitLabel}
            mode={checkInMode}
            cancelHref={cancelHref}
            cancelLabel={cancelLabel}
          />
        ) : (
          <div className="space-y-3">
            <EventReadOnlySummary
              completed={completed}
              isFutureEvent={isFutureEvent}
              isCancelled={isCancelledEvent}
              closedLabel={closedLabel}
              members={members}
              visitors={visitorRows}
            />
            {canEditEventDetails ? (
              <EventDetailsActions
                eventId={event.id}
                status={event.status}
                startsAt={event.startsAt.toISOString()}
                locationName={event.locationName}
                defaultLocationName={event.group?.locationName}
                hasPresenceData={completed}
                isFutureEvent={isFutureEvent}
              />
            ) : null}
            {canOfferAdjustment ? (
              <ButtonLink href={adjustmentHref} fullWidth size="md" shape="pill">
                Ajustar presença →
              </ButtonLink>
            ) : null}
          </div>
        )
      ) : (
        <InfoCard>Este evento não está vinculado a uma célula. A presença completa entra depois.</InfoCard>
      )}
    </AppShell>
  );
}
