import type { SupervisorPageDashboard, SupervisorPageInCarePerson } from "@/features/pastoral-home/supervisor-page-view/supervisor-page-view.types";

export function supervisorInCarePeople(dashboard: SupervisorPageDashboard): SupervisorPageInCarePerson[] {
  return dashboard.groups.flatMap((group) => (
    group.memberships.map((membership) => ({ ...membership.person, groupName: group.name }))
  ));
}
