import { hasLowPresence } from "@/features/groups/group-pastoral-priority";
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
  if (group.urgentCount > 0 || group.pastoralCasesCount > 0) return "risk";
  if (group.supportRequestsCount > 0) return "support";
  if (group.localAttentionCount > 0 || hasLowPresence(group)) return "warn";
  if (group.inCareCount > 0) return "care";
  if (!group.hasPresenceData) return "neutral";
  return "ok";
}

export function groupSignalLabel(group: TeamGroup) {
  const tone = groupSignalTone(group);

  if (group.urgentCount > 0) return "Urgente";
  if (group.pastoralCasesCount > 0)
    return group.pastoralCasesCount === 1 ? "Encaminhada" : "Encaminhadas";
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
