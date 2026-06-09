import { isAfter } from "date-fns";
import { notFound } from "next/navigation";
import type { CheckInMode } from "@/features/check-in/check-in-view";
import { savedPresenceMessage, buildEventDetailState } from "@/features/events/event-detail-view";
import {
  closedWithoutPresenceLabel,
  eventEffectiveLocation,
  isClosedWithoutPresenceStatus,
} from "@/features/events/event-display";
import { isVisitorAttendanceStatus } from "@/features/events/attendance-display";
import { presenceTone } from "@/features/events/presence-display";
import { summarizeEventPresence } from "@/features/events/presence-summary";
import { activeGroupResponsibilitiesScopeInclude, activeNonVisitorMembershipWhere } from "@/features/groups/group-query";
import { appNavForRole } from "@/features/navigation/app-nav";
import { leaderCellHrefFromGroup } from "@/features/navigation/leader-cell-nav";
import {
  canCheckInEvent,
  canManageEventDetails,
  canViewEvent,
  type PermissionUser,
} from "@/features/permissions/permissions";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { ROUTES } from "@/lib/routes";

type EventDetailSearchParams = Record<string, string | string[] | undefined>;

export async function getEventDetailPageData({
  user,
  eventId,
  queryParams,
}: {
  user: PermissionUser;
  eventId: string;
  queryParams: EventDetailSearchParams;
}) {
  const mode = firstParam(queryParams.modo);
  const savedMessage = savedPresenceMessage(firstParam(queryParams.presenca));

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: {
        include: {
          responsibilities: activeGroupResponsibilitiesScopeInclude,
          memberships: {
            where: activeNonVisitorMembershipWhere,
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
  const visitors = event.attendances.filter((attendance) => isVisitorAttendanceStatus(attendance.status));
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
  const backHref = showCheckInForm && completed ? ROUTES.event(event.id) : ROUTES.events;
  const backLabel = showCheckInForm && completed ? "Voltar ao resumo" : "Encontros";
  const cancelHref = completed ? ROUTES.event(event.id) : ROUTES.events;
  const cancelLabel = completed ? "Cancelar" : "Voltar";
  const checkInMode: CheckInMode = completed ? "adjust" : "register";
  const leaderCellHref = leaderCellHrefFromGroup(user, event.group?.id);

  return {
    adjustmentHref: ROUTES.eventCheckInAdjustment(event.id),
    backHref,
    backLabel,
    canEditEventDetails,
    canOfferAdjustment,
    cancelHref,
    cancelLabel,
    checkInMode,
    closedLabel: closedWithoutPresenceLabel(event.status),
    completed,
    detailState,
    event,
    isCancelledEvent,
    isFutureEvent,
    locationName,
    members,
    nav: appNavForRole(user, { active: "events", secondaryHref: leaderCellHref }),
    presence,
    presenceTone: presenceTone(presence.hasPresenceData, presence.presenceRate),
    savedMessage,
    showCheckInForm,
    visitorRows,
    visitorsCount: visitors.length,
  };
}
