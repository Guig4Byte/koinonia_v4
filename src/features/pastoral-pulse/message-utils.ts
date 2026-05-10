import type { PastoralPulseSubject } from ".";

export function groupPrefix(subject?: PastoralPulseSubject | null): string {
  return subject?.groupName ? `${subject.groupName}: ` : "";
}
