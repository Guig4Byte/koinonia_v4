import { groupLocalAttentionCount, groupRiskCount, groupSupportRequestsCount } from "@/features/groups/group-pastoral-priority";
import { buildPastoralPulseMessage } from "@/features/pastoral-pulse";
import { signalTitleForViewer } from "@/features/signals/display";
import { splitPastoralSections } from "@/features/signals/sections";
import { buildSupervisorFocusItems, hasPresenceFocus } from "@/features/pastoral-home/supervisor-page-view/supervisor-focus-items";
import { supervisorInCarePeople } from "@/features/pastoral-home/supervisor-page-view/supervisor-in-care";
import { buildSupervisorNextPastoralAction } from "@/features/pastoral-home/supervisor-page-view/supervisor-next-action";
import type { SupervisorPageDashboard, SupervisorPageView, SupervisorPageViewer } from "@/features/pastoral-home/supervisor-page-view/supervisor-page-view.types";

export function buildSupervisorPageView({
  dashboard,
  user,
}: {
  dashboard: SupervisorPageDashboard;
  user: SupervisorPageViewer;
}): SupervisorPageView {
  const pastoralSections = splitPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: supervisorInCarePeople(dashboard),
    viewer: user,
  });
  const urgentSignals = pastoralSections.urgentOrPastoralCases;
  const supportSignals = pastoralSections.supportRequests;
  const attentionSignals = pastoralSections.localAttention;
  const inCarePeople = pastoralSections.inCarePeople;
  const focusItems = buildSupervisorFocusItems({
    groups: dashboard.groups,
    urgentSignals,
    supportSignals,
    attentionSignals,
    inCarePeople,
  });
  const firstUrgentSignal = urgentSignals[0];
  const firstSupportRequest = supportSignals[0];
  const firstAttentionSignal = attentionSignals[0];
  const firstInCarePerson = inCarePeople[0];
  const hasRisk = urgentSignals.length > 0 || dashboard.groups.some((group) => groupRiskCount(group) > 0);
  const hasAttention = supportSignals.length > 0
    || attentionSignals.length > 0
    || dashboard.groups.some((group) => (
      groupSupportRequestsCount(group) > 0
      || groupLocalAttentionCount(group) > 0
      || hasPresenceFocus(group)
    ));
  const hasCare = inCarePeople.length > 0 || dashboard.groups.some((group) => group.inCareCount > 0);

  return {
    navIndicator: hasRisk ? "risk" : hasAttention ? "attention" : hasCare ? "care" : undefined,
    pastoralPulse: buildPastoralPulseMessage({
      viewerRole: user.role,
      scope: "supervisorDashboard",
      counts: {
        urgentOrPastoral: urgentSignals.length,
        support: supportSignals.length,
        attention: attentionSignals.length,
        inCare: inCarePeople.length,
      },
      subjects: {
        urgentOrPastoral: firstUrgentSignal ? { personName: firstUrgentSignal.person.fullName, groupName: firstUrgentSignal.group.name, detail: signalTitleForViewer(firstUrgentSignal, user) } : null,
        support: firstSupportRequest ? { personName: firstSupportRequest.person.fullName, groupName: firstSupportRequest.group.name, detail: signalTitleForViewer(firstSupportRequest, user) } : null,
        attention: firstAttentionSignal ? { personName: firstAttentionSignal.person.fullName, groupName: firstAttentionSignal.group.name, detail: signalTitleForViewer(firstAttentionSignal, user) } : null,
        inCare: firstInCarePerson ? { personName: firstInCarePerson.fullName, groupName: firstInCarePerson.groupName } : null,
      },
    }),
    urgentSignals,
    supportSignals,
    attentionSignals,
    inCarePeople,
    focusItems,
    nextAction: buildSupervisorNextPastoralAction(focusItems),
  };
}
