import type { SignalBadgeTone } from "@/features/signals/display";

export type CardPriorityTone = SignalBadgeTone | "stable" | "muted";

export function priorityCardClass(tone?: CardPriorityTone): string {
  if (tone === "risk") return "priority-card priority-card-risk";
  if (tone === "warn") return "priority-card priority-card-warn";
  if (tone === "support") return "priority-card priority-card-support";
  if (tone === "care") return "priority-card priority-card-care";
  if (tone === "stable") return "priority-card priority-card-stable";
  if (tone === "muted") return "priority-card priority-card-muted";
  return "";
}
