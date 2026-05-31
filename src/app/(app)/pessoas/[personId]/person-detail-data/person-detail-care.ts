import { CareKind, GroupResponsibilityRole } from "@/generated/prisma/client";
import { careContactInfo } from "@/features/care/care-actions-view";
import { canRegisterCare } from "@/features/permissions/permissions";
import { buildPersonCareOverviewView } from "@/features/people/person-care-overview";
import { careKindLabels } from "@/features/people/person-detail-view";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { formatShortDate, formatTime } from "@/lib/format";
import type { loadPersonDetailContext } from "./person-detail.loader";

type PersonDetailContext = Awaited<ReturnType<typeof loadPersonDetailContext>>;

type Signal = PersonDetailContext["signals"][number];

type Group = PersonDetailContext["visibleMemberships"][number]["group"] | undefined;

export function buildCareTouchHistoryItems(careTouches: PersonDetailContext["careTouches"]) {
  return careTouches.map((touch) => ({
    id: touch.id,
    title: careKindLabels[touch.kind],
    actorName: touch.actor?.name ?? "Koinonia",
    happenedAtLabel: `${formatShortDate(touch.happenedAt)}, ${formatTime(touch.happenedAt)}`,
    contextLabel: touch.group?.name ?? null,
    note: touch.note,
  }));
}

export function buildPastoralEscalationActorLookup(careTouches: PersonDetailContext["careTouches"]) {
  const pastoralEscalationActorByGroupId = new Map<string, string>();
  let pastoralEscalationActorWithoutGroup: string | undefined;

  for (const touch of careTouches) {
    if (touch.kind !== CareKind.ESCALATED_TO_PASTOR) continue;

    const actorName = touch.actor?.name;
    if (!actorName) continue;

    if (touch.groupId) {
      if (!pastoralEscalationActorByGroupId.has(touch.groupId)) {
        pastoralEscalationActorByGroupId.set(touch.groupId, actorName);
      }
    } else if (!pastoralEscalationActorWithoutGroup) {
      pastoralEscalationActorWithoutGroup = actorName;
    }
  }

  return {
    byGroupId: pastoralEscalationActorByGroupId,
    withoutGroup: pastoralEscalationActorWithoutGroup,
  };
}

export function buildPersonDetailCareSection({
  user,
  person,
  careTouches,
  openSignalsCount,
  hasRiskSignal,
  isInCare,
  primaryGroup,
  primaryGroupName,
  primarySignal,
}: {
  user: PersonDetailContext["user"];
  person: PersonDetailContext["person"];
  careTouches: PersonDetailContext["careTouches"];
  openSignalsCount: number;
  hasRiskSignal: boolean;
  isInCare: boolean;
  primaryGroup: Group;
  primaryGroupName: string;
  primarySignal?: Signal;
}) {
  const contactInfo = careContactInfo(person.phone);
  const canRegisterPersonCare = canRegisterCare(user, person);
  const primaryLeadershipName = primaryGroup
    ? responsibilityNames(primaryGroup.responsibilities, GroupResponsibilityRole.LEADER, "")
    : "";

  return {
    overview: buildPersonCareOverviewView({
      openSignalsCount,
      hasRiskSignal,
      isInCare,
      hasPhone: contactInfo.hasPhone,
      canRegisterCare: canRegisterPersonCare,
      primaryGroupName,
      primaryLeadershipName,
      assignedActorName: primarySignal?.assignedTo?.name,
    }),
    canMarkActive: isInCare && canRegisterPersonCare && openSignalsCount === 0,
    hasCareTouch: careTouches.length > 0,
    historyItems: buildCareTouchHistoryItems(careTouches),
  };
}
