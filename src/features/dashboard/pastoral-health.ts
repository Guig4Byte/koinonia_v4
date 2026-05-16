import { countLabel } from "@/lib/format";
import { hasLowPresence } from "@/features/groups/group-pastoral-priority";

export type PastoralHealthKey = "stable" | "attention" | "noPresence" | "support" | "pastoral";

export type PastoralHealthTone = "ok" | "warn" | "neutral" | "support" | "risk";

export type PastoralHealthGroup = {
  hasPresenceData: boolean;
  presenceRate: number;
  hasLowPresence?: boolean;
  urgentCount?: number;
  pastoralCasesCount?: number;
  supportRequestsCount?: number;
  attentionCount?: number;
  localAttentionCount?: number;
  inCareCount?: number;
};

export type PastoralHealthSegment = {
  key: PastoralHealthKey;
  label: string;
  count: number;
  tone: PastoralHealthTone;
};

export type PastoralHealthOverview = {
  totalGroups: number;
  summary: string;
  segments: PastoralHealthSegment[];
};

const healthSegmentConfig: Record<PastoralHealthKey, Omit<PastoralHealthSegment, "count"> & {
  singular: string;
  plural: string;
}> = {
  stable: {
    key: "stable",
    label: "Estáveis",
    tone: "ok",
    singular: "estável",
    plural: "estáveis",
  },
  attention: {
    key: "attention",
    label: "Pedem atenção",
    tone: "warn",
    singular: "pede atenção",
    plural: "pedem atenção",
  },
  noPresence: {
    key: "noPresence",
    label: "Sem presença recente",
    tone: "neutral",
    singular: "sem presença recente",
    plural: "sem presença recente",
  },
  support: {
    key: "support",
    label: "Com pedido de apoio",
    tone: "support",
    singular: "com pedido de apoio",
    plural: "com pedido de apoio",
  },
  pastoral: {
    key: "pastoral",
    label: "Caso pastoral",
    tone: "risk",
    singular: "com caso pastoral",
    plural: "com caso pastoral",
  },
};

const healthSegmentOrder: PastoralHealthKey[] = ["stable", "attention", "noPresence", "support", "pastoral"];

function groupHasLocalAttention(group: PastoralHealthGroup) {
  const localAttentionCount = group.localAttentionCount ?? group.attentionCount ?? 0;
  return localAttentionCount > 0 || (group.inCareCount ?? 0) > 0;
}

export function classifyPastoralHealthGroup(group: PastoralHealthGroup): PastoralHealthKey {
  if ((group.urgentCount ?? 0) > 0 || (group.pastoralCasesCount ?? 0) > 0) return "pastoral";
  if ((group.supportRequestsCount ?? 0) > 0) return "support";
  if (groupHasLocalAttention(group) || (group.hasLowPresence ?? hasLowPresence(group))) return "attention";
  if (!group.hasPresenceData) return "noPresence";
  return "stable";
}

function segmentSummary(segment: PastoralHealthSegment) {
  const config = healthSegmentConfig[segment.key];
  return countLabel(segment.count, config.singular, config.plural);
}

function buildHealthSummary(totalGroups: number, segments: PastoralHealthSegment[]) {
  if (totalGroups === 0) return "Nenhuma célula ativa neste escopo.";

  return segments
    .filter((segment) => segment.count > 0)
    .map(segmentSummary)
    .join(" · ");
}

export function buildPastoralHealthOverview(groups: PastoralHealthGroup[]): PastoralHealthOverview {
  const counts: Record<PastoralHealthKey, number> = {
    stable: 0,
    attention: 0,
    noPresence: 0,
    support: 0,
    pastoral: 0,
  };

  for (const group of groups) {
    counts[classifyPastoralHealthGroup(group)] += 1;
  }

  const segments = healthSegmentOrder.map((key) => ({
    ...healthSegmentConfig[key],
    count: counts[key],
  }));

  return {
    totalGroups: groups.length,
    summary: buildHealthSummary(groups.length, segments),
    segments,
  };
}
