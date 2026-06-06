import { groupPastoralState } from "@/features/groups/group-pastoral-priority";
import { weekdayLabel } from "@/features/groups/weekdays";
import { countLabel } from "@/lib/format";
import type {
  InactiveTeamGroup,
  SupervisorTeam,
  TeamGroup,
  TeamSignalTone,
} from "./team-view.types";

export function compactGroupSubtitle(group: TeamGroup) {
  const membersLabel = countLabel(group.membersCount, "membro", "membros");
  return `${membersLabel} · ${group.leadershipName}`;
}

export function groupSignalTone(group: TeamGroup): TeamSignalTone {
  const state = groupPastoralState(group);

  if (state.urgentCount > 0 || state.pastoralCasesCount > 0) return "risk";
  if (state.supportRequestsCount > 0) return "support";
  if (state.localAttentionCount > 0 || state.hasLowPresence) return "warn";
  if (state.inCareCount > 0) return "care";
  if (state.hasNoRecentPresence) return "neutral";
  return "ok";
}

export function groupSignalLabel(group: TeamGroup) {
  const state = groupPastoralState(group);
  const tone = groupSignalTone(group);

  if (state.urgentCount > 0) return "Urgente";
  if (state.pastoralCasesCount > 0)
    return state.pastoralCasesCount === 1 ? "Encaminhada" : "Encaminhadas";
  if (tone === "support") return "Apoio pedido";
  if (tone === "warn") return "Em atenção";
  if (tone === "care") return "Em cuidado";
  if (tone === "neutral") return "Retomar contato";
  return "Estável";
}

export function supervisorSummary(supervisor: SupervisorTeam) {
  return countLabel(
    supervisor.groups.length,
    "célula acompanhada",
    "células acompanhadas",
  );
}

export function inactiveGroupScheduleText(group: InactiveTeamGroup) {
  if (group.meetingDayOfWeek === null || !group.meetingTime)
    return "Agenda padrão a definir";
  return `${weekdayLabel(group.meetingDayOfWeek)} · ${group.meetingTime}`;
}
