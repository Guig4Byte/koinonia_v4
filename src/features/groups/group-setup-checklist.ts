import { GroupResponsibilityRole } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/routes";

export type GroupSetupChecklistItemKey =
  | "leaders"
  | "supervisors"
  | "members"
  | "schedule"
  | "firstMeeting";

export type GroupSetupChecklistItem = {
  key: GroupSetupChecklistItemKey;
  label: string;
  complete: boolean;
};

export type GroupSetupChecklistAction = {
  href: string;
  label: string;
};

export type GroupSetupChecklist = {
  groupId: string;
  groupName: string;
  title: string;
  detail: string;
  items: GroupSetupChecklistItem[];
  action: GroupSetupChecklistAction;
};

export type GroupSetupChecklistGroup = {
  id: string;
  name: string;
  responsibilities: Array<{ role: GroupResponsibilityRole }>;
  memberships: Array<unknown>;
  meetingDayOfWeek?: number | null;
  meetingTime?: string | null;
  recordedEventsCount?: number | null;
};

function countResponsibilities(group: GroupSetupChecklistGroup, role: GroupResponsibilityRole) {
  return group.responsibilities.filter((responsibility) => responsibility.role === role).length;
}

function membersLabel(count: number) {
  if (count === 1) return "1 membro cadastrado";
  return `${count} membros cadastrados`;
}

function hasMeetingSchedule(group: GroupSetupChecklistGroup) {
  return group.meetingDayOfWeek !== null
    && group.meetingDayOfWeek !== undefined
    && Boolean(group.meetingTime?.trim());
}

function firstAvailableAction({
  group,
  currentEventId,
  canEditGroup,
  canRegisterCurrentEvent = true,
}: {
  group: GroupSetupChecklistGroup;
  currentEventId?: string | null;
  canEditGroup?: boolean;
  canRegisterCurrentEvent?: boolean;
}): GroupSetupChecklistAction {
  const hasRecordedFirstMeeting = (group.recordedEventsCount ?? 0) > 0;

  if (canEditGroup && !hasMeetingSchedule(group)) {
    return {
      href: ROUTES.editGroup(group.id),
      label: "Definir dia e horário",
    };
  }

  if (!hasRecordedFirstMeeting && currentEventId) {
    return {
      href: ROUTES.event(currentEventId),
      label: canRegisterCurrentEvent ? "Registrar primeiro encontro" : "Abrir primeiro encontro",
    };
  }

  return {
    href: ROUTES.group(group.id),
    label: "Ver célula",
  };
}

export function buildGroupSetupChecklist({
  group,
  currentEventId,
  canEditGroup = false,
  canRegisterCurrentEvent = true,
}: {
  group: GroupSetupChecklistGroup;
  currentEventId?: string | null;
  canEditGroup?: boolean;
  canRegisterCurrentEvent?: boolean;
}): GroupSetupChecklist {
  const leadersCount = countResponsibilities(group, GroupResponsibilityRole.LEADER);
  const supervisorsCount = countResponsibilities(group, GroupResponsibilityRole.SUPERVISOR);
  const membersCount = group.memberships.length;
  const hasRecordedFirstMeeting = (group.recordedEventsCount ?? 0) > 0;

  return {
    groupId: group.id,
    groupName: group.name,
    title: "Checklist de implantação",
    detail: "A célula já pode começar quando a estrutura essencial estiver pronta.",
    items: [
      { key: "leaders", label: "Líderes definidos", complete: leadersCount > 0 },
      { key: "supervisors", label: "Supervisores definidos", complete: supervisorsCount > 0 },
      { key: "members", label: membersLabel(membersCount), complete: membersCount > 0 },
      { key: "schedule", label: "Dia e horário definidos", complete: hasMeetingSchedule(group) },
      {
        key: "firstMeeting",
        label: hasRecordedFirstMeeting ? "Primeiro encontro registrado" : "Primeiro encontro ainda não registrado",
        complete: hasRecordedFirstMeeting,
      },
    ],
    action: firstAvailableAction({ group, currentEventId, canEditGroup, canRegisterCurrentEvent }),
  };
}

export function shouldShowGroupSetupChecklistAction(
  checklist: GroupSetupChecklist,
  competingHrefs: Array<string | null | undefined>,
): boolean {
  return competingHrefs.every((href) => !href || href !== checklist.action.href);
}
