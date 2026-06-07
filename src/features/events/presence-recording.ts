import type { EventStatus } from "@/generated/prisma/client";
import { isCompletedEventStatus } from "@/features/events/event-status";

export type PresenceRecordingCandidate = {
  status: string | EventStatus;
  attendances?: readonly unknown[] | null;
};

export function hasPresenceRecording(event: PresenceRecordingCandidate) {
  return isCompletedEventStatus(event.status) || (event.attendances?.length ?? 0) > 0;
}
