import { weekdayLabel } from "@/features/groups/weekdays";

export function groupMeetingText(day?: number | null, time?: string | null) {
  if (day === null || day === undefined) return time ? `Horário: ${time}` : "Encontro sem horário fixo informado.";
  return `${weekdayLabel(day)}${time ? ` · ${time}` : ""}`;
}
