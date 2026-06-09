export type PastoralPulseTone = "calm" | "attention" | "ok";

export type PastoralPulseScope = "leaderDashboard" | "supervisorDashboard" | "pastorDashboard" | "groupDetail";

export type PastoralPulseCounts = {
  urgentOrPastoral?: number;
  support?: number;
  attention?: number;
  inCare?: number;
  hasPendingEvent?: boolean;
  hasRecentPresence?: boolean;
  presenceRate?: number;
};

export type PastoralPulseSubject = {
  personName?: string;
  groupName?: string;
  detail?: string;
};

export type PastoralPulseSubjects = {
  urgentOrPastoral?: PastoralPulseSubject | null;
  support?: PastoralPulseSubject | null;
  attention?: PastoralPulseSubject | null;
  inCare?: PastoralPulseSubject | null;
};

export type PastoralPulseMessage = {
  title: string;
  subtitle: string;
  tone: PastoralPulseTone;
};
