import type { PastoralPulseSubject } from "./pastoral-pulse";

export function groupPrefix(subject?: PastoralPulseSubject | null): string {
  return subject?.groupName ? `${subject.groupName}: ` : "";
}
