import { AttendanceStatus } from "@/generated/prisma/client";
export { careKindLabels } from "@/features/care/care-copy";
import { presenceTone, type PresenceTone } from "@/features/events/presence-display";
import {
  summarizePresenceFromAttendances,
  PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT,
  splitPresenceTrendSamples,
  summarizePresenceTrend,
  type PresenceSummary,
  type PresenceTrend,
} from "@/features/events/presence-summary";
export const PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT = 12;

export const attendanceLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
  VISITOR: "Visitante",
};

export type PersonRecentAttendance = {
  id: string;
  status: AttendanceStatus;
  event: {
    id: string;
    startsAt: Date;
    group?: { name: string } | null;
  };
};

export type PersonPresenceView = {
  recentAttendances: PersonRecentAttendance[];
  recentPresence: PresenceSummary;
  previousPresence: PresenceSummary;
  trend: PresenceTrend | null;
  tone: PresenceTone;
  hiddenAttendancesCount: number;
  hasPartialTrendHistory: boolean;
};


export type AttendanceTone = "ok" | "warn" | "risk" | "info";

export function attendanceTone(status?: AttendanceStatus | null): AttendanceTone {
  if (status === AttendanceStatus.PRESENT) return "ok";
  if (status === AttendanceStatus.JUSTIFIED) return "warn";
  if (status === AttendanceStatus.ABSENT) return "risk";
  return "info";
}

export function presenceToneClass(tone: PresenceTone) {
  if (tone === "risk") return "text-[color:var(--color-metric-atencoes)]";
  if (tone === "warn") return "text-[color:var(--color-badge-atencao-text)]";
  if (tone === "ok") return "text-[color:var(--color-metric-presenca)]";
  return "text-[color:var(--color-text-primary)]";
}

export function presenceTrendToneClass(direction: PresenceTrend["direction"], currentTone: PresenceTone) {
  if (direction === "up") return "text-[color:var(--color-metric-presenca)]";
  if (currentTone === "ok") return "text-[color:var(--color-badge-atencao-text)]";
  return "text-[color:var(--color-metric-atencoes)]";
}

export function recentPresenceCountLabel(presentCount: number, encountersCount: number) {
  if (encountersCount === 1) {
    return presentCount === 1 ? "Presente no único encontro" : "Faltou no único encontro";
  }

  if (presentCount === 0) {
    return encountersCount === 1
      ? "Faltou no único encontro"
      : `Nenhuma presença em ${encountersCount} encontros`;
  }

  if (presentCount === encountersCount) {
    return encountersCount === 1
      ? "Presente no único encontro"
      : `Presente em todos os ${encountersCount} encontros`;
  }

  if (presentCount === 1) return `1 vez presente em ${encountersCount} encontros`;
  return `${presentCount} vezes presente em ${encountersCount} encontros`;
}

export function recentPresenceTrendLabel(trend: PresenceTrend, currentTone: PresenceTone) {
  if (trend.direction === "up") return "Presença mais constante que nos encontros anteriores.";
  if (currentTone === "ok") return "Ainda há boa presença, mesmo com queda nos encontros recentes.";
  return "A presença caiu em relação aos encontros anteriores. Vale se aproximar com cuidado.";
}

export function buildPersonPresenceView(attendances: PersonRecentAttendance[]): PersonPresenceView {
  const accountableAttendances = attendances.filter((attendance) => attendance.status !== AttendanceStatus.VISITOR);
  const { recentItems: recentAttendances, previousItems: previousAttendances } = splitPresenceTrendSamples(accountableAttendances);
  const recentPresence = summarizePresenceFromAttendances(recentAttendances);
  const previousPresence = summarizePresenceFromAttendances(previousAttendances);
  const trend = summarizePresenceTrend(recentPresence, previousPresence);
  const tone = presenceTone(recentPresence.hasPresenceData, recentPresence.presenceRate);

  return {
    recentAttendances,
    recentPresence,
    previousPresence,
    trend,
    tone,
    hiddenAttendancesCount: Math.max(accountableAttendances.length - recentAttendances.length, 0),
    hasPartialTrendHistory: previousPresence.accountableCount > 0 && previousPresence.accountableCount < PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT,
  };
}
