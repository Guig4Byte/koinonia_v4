import type { TeamFilter, TeamSignalTone } from "@/features/team/team-view";
import {
  FILTER_ATTENTION,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_STABLE,
  FILTER_SUPPORT,
  FILTER_URGENT,
  type FilterTone,
} from "@/lib/filter-param";
import styles from "../team-structure-cards.module.css";

export const cellLinkToneClass: Record<TeamSignalTone, string> = {
  risk: styles.cellLinkRisk,
  warn: styles.cellLinkWarn,
  neutral: styles.cellLinkNeutral,
  support: styles.cellLinkSupport,
  care: styles.cellLinkCare,
  ok: styles.cellLinkOk,
};

export const filterContextTone: Partial<Record<TeamFilter, FilterTone>> = {
  [FILTER_URGENT]: "risk",
  [FILTER_PASTORAL]: "risk",
  [FILTER_SUPPORT]: "support",
  [FILTER_ATTENTION]: "warn",
  [FILTER_NO_RECENT_PRESENCE]: "neutral",
  [FILTER_STABLE]: "ok",
};

export const TEAM_STRUCTURE_ADJUSTMENTS_LIMIT = 1;
