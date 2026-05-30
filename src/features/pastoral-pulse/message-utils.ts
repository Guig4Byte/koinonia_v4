import type { PastoralPulseSubject } from "./types";

export function groupPrefix(subject?: PastoralPulseSubject | null): string {
  return subject?.groupName ? `${subject.groupName}: ` : "";
}
