import { countLabel } from "@/lib/format";
import { FILTER_ATTENTION, FILTER_NO_RECENT_PRESENCE, FILTER_PASTORAL, FILTER_STABLE, FILTER_SUPPORT, FILTER_URGENT } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";
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
  href: string;
};

export type PastoralHealthOverview = {
  totalGroups: number;
  summary: string;
  narrativeSummary: string;
  segments: PastoralHealthSegment[];
};

const healthSegmentConfig: Record<PastoralHealthKey, Omit<PastoralHealthSegment, "count"> & {
  singular: string;
  plural: string;
  narrativeSingular: string;
  narrativePlural: string;
}> = {
  stable: {
    key: "stable",
    label: "Estáveis",
    tone: "ok",
    href: ROUTES.teamFilter(FILTER_STABLE),
    singular: "estável",
    plural: "estáveis",
    narrativeSingular: "1 célula estável",
    narrativePlural: "{count} células estáveis",
  },
  attention: {
    key: "attention",
    label: "Pedem atenção",
    tone: "warn",
    href: ROUTES.teamFilter(FILTER_ATTENTION),
    singular: "pede atenção",
    plural: "pedem atenção",
    narrativeSingular: "1 célula pedindo atenção",
    narrativePlural: "{count} células pedindo atenção",
  },
  noPresence: {
    key: "noPresence",
    label: "Sem presença recente",
    tone: "neutral",
    href: ROUTES.teamFilter(FILTER_NO_RECENT_PRESENCE),
    singular: "sem presença recente",
    plural: "sem presença recente",
    narrativeSingular: "1 sem presença recente",
    narrativePlural: "{count} sem presença recente",
  },
  support: {
    key: "support",
    label: "Com pedido de apoio",
    tone: "support",
    href: ROUTES.teamFilter(FILTER_SUPPORT),
    singular: "com pedido de apoio",
    plural: "com pedido de apoio",
    narrativeSingular: "1 com pedido de apoio",
    narrativePlural: "{count} com pedido de apoio",
  },
  pastoral: {
    key: "pastoral",
    label: "Encaminhadas ao pastor",
    tone: "risk",
    href: ROUTES.teamFilter(FILTER_PASTORAL),
    singular: "encaminhada ao pastor",
    plural: "encaminhadas ao pastor",
    narrativeSingular: "1 encaminhada ao pastor",
    narrativePlural: "{count} encaminhadas ao pastor",
  },
  urgent: {
    key: "urgent",
    label: "Urgentes",
    tone: "risk",
    href: ROUTES.teamFilter(FILTER_URGENT),
    singular: "urgente",
    plural: "urgentes",
    narrativeSingular: "1 célula com urgente",
    narrativePlural: "{count} células com urgentes",
  },
};

const healthSegmentOrder: PastoralHealthKey[] = ["urgent", "pastoral", "support", "attention", "noPresence", "stable"];
const narrativeSegmentOrder: PastoralHealthKey[] = ["urgent", "pastoral", "support", "attention", "noPresence"];

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

function joinPortugueseList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} e ${items[1]}`;

  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

function segmentNarrative(segment: PastoralHealthSegment) {
  const config = healthSegmentConfig[segment.key];
  const template = segment.count === 1 ? config.narrativeSingular : config.narrativePlural;
  return template.replace("{count}", String(segment.count));
}

function buildHealthNarrativeSummary(totalGroups: number, segments: PastoralHealthSegment[]) {
  if (totalGroups === 0) return "Nenhuma célula ativa neste escopo.";

  const activePrioritySegments = narrativeSegmentOrder
    .map((key) => segments.find((segment) => segment.key === key))
    .filter((segment): segment is PastoralHealthSegment => segment !== undefined && segment.count > 0);

  if (activePrioritySegments.length === 0) {
    return "Nenhuma célula pede atenção pastoral agora.";
  }

  return joinPortugueseList(activePrioritySegments.map(segmentNarrative));
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
    narrativeSummary: buildHealthNarrativeSummary(groups.length, segments),
    segments,
  };
}
