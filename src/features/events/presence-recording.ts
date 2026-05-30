import { EventStatus } from "@/generated/prisma/client";

export type PresenceRecordingCandidate = {
  status: string | EventStatus;
  attendances?: readonly unknown[] | null;
};

export function hasPresenceRecording(event: PresenceRecordingCandidate) {
  return event.status === EventStatus.COMPLETED || (event.attendances?.length ?? 0) > 0;
}
