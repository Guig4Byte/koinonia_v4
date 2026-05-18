import { countLabel } from "@/lib/format";
import {
  groupPastoralStatusKey,
  type GroupPastoralPriorityInput,
  type GroupPastoralStatusKey,
} from "@/features/groups/group-pastoral-priority";

export type PastoralHealthKey = "stable" | "attention" | "noPresence" | "support" | "pastoral" | "urgent";

export type PastoralHealthTone = "ok" | "warn" | "neutral" | "support" | "risk";

export type PastoralHealthGroup = GroupPastoralPriorityInput & {
  hasLowPresence?: boolean;
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
    label: "Encaminhadas ao pastor",
    tone: "risk",
    singular: "encaminhada ao pastor",
    plural: "encaminhadas ao pastor",
  },
  urgent: {
    key: "urgent",
    label: "Urgentes",
    tone: "risk",
    singular: "urgente",
    plural: "urgentes",
  },
};

const healthSegmentOrder: PastoralHealthKey[] = ["urgent", "pastoral", "support", "attention", "noPresence", "stable"];

const statusToHealthKey: Record<GroupPastoralStatusKey, PastoralHealthKey> = {
  urgent: "urgent",
  pastoralCase: "pastoral",
  supportRequest: "support",
  localAttention: "attention",
  withoutRecentPresence: "noPresence",
  stable: "stable",
};

export function classifyPastoralHealthGroup(group: PastoralHealthGroup): PastoralHealthKey {
  return statusToHealthKey[groupPastoralStatusKey(group)];
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
    urgent: 0,
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
