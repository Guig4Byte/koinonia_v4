import { CARE_COPY } from "@/features/care/care-copy";
import { requireCareVisiblePerson } from "@/features/care/person-care-access";
import type { PermissionUser } from "@/features/permissions/permissions";
import { personBirthdayFeedbackMessage } from "@/features/people/person-birthday";
import { commandError, commandOk, type ApiCommandResult } from "@/lib/api-command-result";
import { prisma } from "@/lib/prisma";

type PersonPhoneUpdateData = {
  personId: string;
  phone: string;
  message: string;
};

type PersonBirthdayUpdateData = {
  personId: string;
  birthDate: Date | null;
  message: string;
};

export type PersonPhoneUpdateResult = ApiCommandResult<PersonPhoneUpdateData>;

export type PersonBirthdayUpdateResult = ApiCommandResult<PersonBirthdayUpdateData>;

async function requireProfileEditablePerson(user: PermissionUser, personId: string) {
  return requireCareVisiblePerson(user, personId, {
    forbiddenMessage: CARE_COPY.errors.noUpdatePermission,
  });
}

export async function updateCareVisiblePersonPhone(
  user: PermissionUser,
  personId: string,
  phone: string,
): Promise<PersonPhoneUpdateResult> {
  const personAccess = await requireProfileEditablePerson(user, personId);

  if (!personAccess.ok) {
    return commandError(personAccess.message, personAccess.status);
  }

  const updatedPerson = await prisma.person.update({
    where: { id: personAccess.person.id },
    data: { phone },
    select: { id: true, phone: true },
  });

  return commandOk({
    personId: updatedPerson.id,
    phone: updatedPerson.phone ?? "",
    message: CARE_COPY.feedback.phoneSaved,
  });
}

export async function updateCareVisiblePersonBirthday(
  user: PermissionUser,
  personId: string,
  birthDate: Date | null,
): Promise<PersonBirthdayUpdateResult> {
  const personAccess = await requireProfileEditablePerson(user, personId);

  if (!personAccess.ok) {
    return commandError(personAccess.message, personAccess.status);
  }

  const updatedPerson = await prisma.person.update({
    where: { id: personAccess.person.id },
    data: { birthDate },
    select: { id: true, birthDate: true },
  });

  return commandOk({
    personId: updatedPerson.id,
    birthDate: updatedPerson.birthDate,
    message: personBirthdayFeedbackMessage(updatedPerson.birthDate),
  });
}
