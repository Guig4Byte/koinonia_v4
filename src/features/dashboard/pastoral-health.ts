import { countLabel } from "@/lib/format";
import { FILTER_ATTENTION, FILTER_NO_RECENT_PRESENCE, FILTER_PASTORAL, FILTER_STABLE, FILTER_SUPPORT, FILTER_URGENT } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";
import {
  groupPastoralStatusKey,
  type GroupPastoralPriorityInput,
  type GroupPastoralStatusKey,
} from "@/features/groups/group-pastoral-priority";

export type PastoralHealthKey = "stable" | "attention" | "noPresence" | "support" | "pastoral" | "urgent";

export type PastoralHealthTone = "ok" | "warn" | "neutral" | "support" | "pastoral" | "risk";

export type PastoralHealthGroup = GroupPastoralPriorityInput & {
  hasLowPresence?: boolean;
};

export type PastoralHealthSegment = {
  key: PastoralHealthKey;
  label: string;
  count: number;
  tone: PastoralHealthTone;
  href: string;
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
    href: ROUTES.teamFilter(FILTER_STABLE),
    singular: "estável",
    plural: "estáveis",
  },
  attention: {
    key: "attention",
    label: "Em atenção",
    tone: "warn",
    href: ROUTES.teamFilter(FILTER_ATTENTION),
    singular: "pede atenção",
    plural: "pedem atenção",
  },
  noPresence: {
    key: "noPresence",
    label: "Retomar contato",
    tone: "neutral",
    href: ROUTES.teamFilter(FILTER_NO_RECENT_PRESENCE),
    singular: "sem presença recente",
    plural: "sem presença recente",
  },
  support: {
    key: "support",
    label: "Apoio pedido",
    tone: "support",
    href: ROUTES.teamFilter(FILTER_SUPPORT),
    singular: "com pedido de apoio",
    plural: "com pedido de apoio",
  },
  pastoral: {
    key: "pastoral",
    label: "Encaminhadas",
    tone: "pastoral",
    href: ROUTES.teamFilter(FILTER_PASTORAL),
    singular: "encaminhada ao pastor",
    plural: "encaminhadas ao pastor",
  },
  urgent: {
    key: "urgent",
    label: "Urgente",
    tone: "risk",
    href: ROUTES.teamFilter(FILTER_URGENT),
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
  if (totalGroups === 0) return "Ainda não há célula ativa neste escopo.";

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
