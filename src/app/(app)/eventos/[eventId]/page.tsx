import Link from "next/link";
import { isAfter } from "date-fns";
import { notFound } from "next/navigation";
import { AttendanceStatus, MembershipRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { CheckInList } from "@/components/check-in-list";
import { EventDetailsActions } from "@/components/event-details-actions";
import { EventDetailHeaderCard } from "@/components/event-detail-header-card";
import { EventReadOnlySummary } from "@/components/event-read-only-summary";
import { BackLink, InfoCard, SectionTitle } from "@/components/base-cards";
import { eventEffectiveLocation, isClosedWithoutPresenceStatus, closedWithoutPresenceLabel } from "@/features/events/event-display";
import { presenceTone } from "@/features/events/presence-display";
import { summarizeEventPresence } from "@/features/events/presence-summary";
import { buildEventDetailState, savedPresenceMessage } from "@/features/events/event-detail-view";
import { canCheckInEvent, canManageEventDetails, canViewEvent } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const user = await getCurrentUser();
  const { eventId } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const mode = firstParam(queryParams.modo);
  const savedMessage = savedPresenceMessage(firstParam(queryParams.presenca));

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: {
        include: {
          leader: true,
          supervisor: true,
          responsibilities: { where: { activeUntil: null } },
          memberships: {
            where: { leftAt: null, role: { not: MembershipRole.VISITOR } },
            include: { person: true },
          },
        },
      },
      attendances: { include: { person: true } },
    },
  });

  if (!event || event.churchId !== user.churchId) notFound();
  if (!canViewEvent(user, event)) notFound();

  const isCancelledEvent = isClosedWithoutPresenceStatus(event.status);
  const canEditCheckIn = !isCancelledEvent && canCheckInEvent(user, event);
  const canEditEventDetails = canManageEventDetails(user, event);
  const presence = summarizeEventPresence(event);
  const visitors = event.attendances.filter((attendance) => attendance.status === AttendanceStatus.VISITOR);
  const completed = presence.hasPresenceData;
  const isFutureEvent = isAfter(event.startsAt, new Date());
  const showCheckInForm = !isCancelledEvent && canEditCheckIn && (!completed || mode === "ajuste");
  const canOfferAdjustment = canEditCheckIn && completed && !showCheckInForm;
  const locationName = eventEffectiveLocation(event);
  const detailState = buildEventDetailState({
    status: event.status,
    completed,
    isFutureEvent,
    canEditCheckIn,
    showCheckInForm,
  });

  const members = event.group?.memberships.map((membership) => ({
    personId: membership.personId,
    fullName: membership.person.fullName,
    currentStatus: event.attendances.find((attendance) => attendance.personId === membership.personId)?.status,
  })) ?? [];

  const visitorRows = visitors.map((attendance) => ({
    id: attendance.id,
    personId: attendance.personId,
    fullName: attendance.person.fullName,
  }));

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "events" })}
      hideBottomNav={showCheckInForm}
    >
      <BackLink href={showCheckInForm && completed ? `/eventos/${event.id}` : "/eventos"}>
        {showCheckInForm && completed ? "Voltar ao resumo" : "Encontros"}
      </BackLink>

      {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

      <EventDetailHeaderCard
        title={event.title}
        groupId={event.group?.id}
        groupName={event.group?.name}
        startsAt={event.startsAt}
        locationName={locationName}
        checkInLabel={detailState.checkInLabel}
        eventStatusLabel={detailState.eventStatusLabel}
        eventStatusTone={detailState.eventStatusTone}
        hasPresenceData={presence.hasPresenceData}
        presenceRate={presence.presenceRate}
        presenceTone={presenceTone(presence.hasPresenceData, presence.presenceRate)}
        visitorsCount={visitors.length}
        membersCount={members.length}
        showGroupLink={!showCheckInForm}
      />

      <SectionTitle>{detailState.checkInSectionTitle}</SectionTitle>
      {event.groupId ? (
        showCheckInForm ? (
          <CheckInList
            eventId={event.id}
            members={members}
            initialVisitors={visitorRows}
            submitLabel={detailState.checkInSubmitLabel}
            mode={completed ? "adjust" : "register"}
            cancelHref={completed ? `/eventos/${event.id}` : "/eventos"}
            cancelLabel={completed ? "Cancelar" : "Voltar"}
            saveBarOffset="page"
          />
        ) : (
          <div className="space-y-3">
            <EventReadOnlySummary
              completed={completed}
              isFutureEvent={isFutureEvent}
              isCancelled={isCancelledEvent}
              closedLabel={closedWithoutPresenceLabel(event.status)}
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
              <Link
                href={`/eventos/${event.id}?modo=ajuste`}
                className="k-primary-action inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition active:scale-[0.99]"
              >
                Ajustar presença →
              </Link>
            ) : null}
          </div>
        )
      ) : (
        <InfoCard>Este evento não está vinculado a uma célula. A presença completa entra depois.</InfoCard>
      )}
    </AppShell>
  );
}
