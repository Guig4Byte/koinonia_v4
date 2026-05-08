import { UserRole } from "@/generated/prisma/client";
import type { PastoralPulseSubject } from "./pastoral-pulse";

export function isPastorRole(role: UserRole): boolean {
  return role === UserRole.PASTOR || role === UserRole.ADMIN;
}

export function groupPrefix(subject?: PastoralPulseSubject | null): string {
  return subject?.groupName ? `${subject.groupName}: ` : "";
}
