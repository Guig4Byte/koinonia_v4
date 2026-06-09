import type { SignalSeverity, SignalSource, UserRole } from "@/generated/prisma/client";
import type { SignalAssigneeLike } from "./escalation";

export type SignalBadgeTone = "neutral" | "ok" | "warn" | "risk" | "info" | "care" | "support";

export type SignalBadge = {
  label: string;
  tone: SignalBadgeTone;
};

export type SignalDisplayLike = {
  severity: SignalSeverity;
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

export type SignalDisplayViewerLike = {
  id?: string | null;
  role: UserRole;
};

export type SignalDetailLike = SignalDisplayLike & {
  reason?: string | null;
  evidence?: string | null;
  source?: SignalSource | null;
  pastoralEscalationActorName?: string | null;
};

export type SignalPastoralMessage = {
  title: string;
  description?: string;
};
