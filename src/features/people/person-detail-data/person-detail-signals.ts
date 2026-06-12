import { signalBadgeForViewer, signalDescriptionForViewer, signalTitleForViewer } from "@/features/signals/display";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusChipForViewer } from "@/features/signals/escalation";
import { formatShortDate, formatTime } from "@/lib/format";
import type { PersonDetailContext } from "./person-detail.loader";
import type { buildPastoralEscalationActorLookup } from "./person-detail-care";

type PastoralEscalationActorLookup = ReturnType<typeof buildPastoralEscalationActorLookup>;

export function buildPersonDetailSignalCards({
  signals,
  user,
  primaryGroupName,
  pastoralEscalationActorLookup,
}: {
  signals: PersonDetailContext["signals"];
  user: PersonDetailContext["user"];
  primaryGroupName: string;
  pastoralEscalationActorLookup: PastoralEscalationActorLookup;
}) {
  return signals.map((signal) => {
    const pastoralEscalationActorName = signal.groupId
      ? pastoralEscalationActorLookup.byGroupId.get(signal.groupId)
      : pastoralEscalationActorLookup.withoutGroup;
    const signalForDisplay = { ...signal, pastoralEscalationActorName };

    return {
      id: signal.id,
      priorityTone: signalBadgeForViewer(signalForDisplay, user).tone,
      title: signalTitleForViewer(signalForDisplay, user),
      meta: `${signal.group?.name ?? primaryGroupName} · ${formatShortDate(signal.detectedAt)}, ${formatTime(signal.detectedAt)}`,
      description: signalDescriptionForViewer(signalForDisplay, user, { useDetailedDescription: true }),
      assignmentMessage: escalationStatusChipForViewer(signalForDisplay, user),
      canRequestSupervisor: canRequestSupervisorSupport(user, signal),
      canEscalatePastor: canEscalateSignalToPastor(user, signal),
    };
  });
}
