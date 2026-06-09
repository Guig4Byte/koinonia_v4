import type { CellsFilter } from "@/features/groups/cells-page-filters";
import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_PRESENCE,
  FILTER_SUPPORT,
  FILTER_URGENT,
  type FilterTone,
} from "@/lib/filter-param";

const cellsFilterContextCopy: Record<CellsFilter, { title: string; detail: string; tone?: FilterTone }> = {
  [FILTER_ALL]: {
    title: "Leitura pastoral da supervisão",
    detail:
      "A leitura começa pelas células que pedem cuidado mais próximo. No detalhe da célula, sinais, presenças e acompanhamentos aparecem com calma.",
  },
  [FILTER_ATTENTION]: {
    title: "Em atenção",
    detail:
      "Células com sinais abertos ou atenção local para acompanhamento junto da liderança.",
    tone: "warn",
  },
  [FILTER_URGENT]: {
    title: "Urgente",
    detail:
      "Sinais mais sensíveis aparecem primeiro para apoiar conversa, leitura pastoral e alinhamento com a liderança.",
    tone: "risk",
  },
  [FILTER_PASTORAL]: {
    title: "Encaminhadas ao pastor",
    detail:
      "Casos trazidos ao cuidado pastoral seguem visíveis para supervisão e acompanhamento.",
    tone: "risk",
  },
  [FILTER_SUPPORT]: {
    title: "Apoio pedido",
    detail:
      "Células em que a liderança pediu apoio da supervisão.",
    tone: "support",
  },
  [FILTER_IN_CARE]: {
    title: "Em cuidado",
    detail:
      "Acompanhamentos já assumidos seguem visíveis para manter continuidade pastoral.",
    tone: "care",
  },
  [FILTER_PRESENCE]: {
    title: "Presença pede leitura",
    detail:
      "Sem registro recente ou presença baixa pode indicar rotina, ou pedir uma conversa com a liderança.",
    tone: "neutral",
  },
  [FILTER_NO_RECENT_PRESENCE]: {
    title: "Retomar contato",
    detail:
      "Células sem registro recente aparecem aqui para entender se falta dado ou se há cuidado a retomar.",
    tone: "neutral",
  },
  [FILTER_LOW_PRESENCE]: {
    title: "Presença baixa",
    detail:
      "Células com presença abaixo do esperado pedem leitura cuidadosa antes de orientar próximos passos.",
    tone: "warn",
  },
};

export function cellsFilterContextContent(filter: CellsFilter) {
  return cellsFilterContextCopy[filter];
}
