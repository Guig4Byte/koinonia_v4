import { PersonStatus } from "@/generated/prisma/client";

export const ACTIVE_STATUS = PersonStatus.ACTIVE;
export const IN_CARE_STATUS = PersonStatus.COOLING_AWAY;

export const ATTENTION_ELIGIBLE_PERSON_STATUSES: PersonStatus[] = [
  PersonStatus.ACTIVE,
  PersonStatus.NEW,
  PersonStatus.NEEDS_ATTENTION,
  PersonStatus.COOLING_AWAY,
];

export function isActiveStatus(status: PersonStatus | string | null | undefined): boolean {
  return status === ACTIVE_STATUS;
}

export function isInCareStatus(status: PersonStatus | string | null | undefined): boolean {
  return status === IN_CARE_STATUS;
}

export function isInCarePerson(person: { status: PersonStatus | string | null | undefined }): boolean {
  return isInCareStatus(person.status);
}
