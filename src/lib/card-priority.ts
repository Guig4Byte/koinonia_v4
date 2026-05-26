import type { BadgeTone } from "@/components/ui/badge";

export type CardPriorityTone = BadgeTone | "stable" | "muted" | "presence";

export function priorityCardClass(tone?: CardPriorityTone): string {
  if (tone === "risk") return "priority-card priority-card-risk";
  if (tone === "warn") return "priority-card priority-card-warn";
  if (tone === "support") return "priority-card priority-card-support";
  if (tone === "care") return "priority-card priority-card-care";
  if (tone === "presence") return "priority-card priority-card-presence";
  if (tone === "stable") return "priority-card priority-card-stable";
  if (tone === "muted") return "priority-card priority-card-muted";
  return "";
}
