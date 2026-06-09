import type { getPastorTeamOverview } from "@/features/dashboard/queries";

export type TeamOverview = Awaited<ReturnType<typeof getPastorTeamOverview>>;
export type SupervisorTeam = TeamOverview["supervisors"][number];
export type TeamGroup = SupervisorTeam["groups"][number];

export type InactiveTeamGroup = {
  id: string;
  name: string;
  meetingDayOfWeek: number | null;
  meetingTime: string | null;
  locationName: string | null;
};

export type TeamSignalTone =
  | "risk"
  | "support"
  | "warn"
  | "care"
  | "neutral"
  | "ok";

export type TeamPageLists = {
  filteredSupervisors: SupervisorTeam[];
  filteredUnassignedGroups: TeamGroup[];
  filteredInactiveGroups: InactiveTeamGroup[];
  isFiltered: boolean;
};
