import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_STABLE,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";
import type { TeamFilter } from "@/features/team/team-filters";

export const SUPERVISOR_SECTION_LIMIT = 4;
export const TEAM_SUPERVISOR_PREVIEW_LIMIT = 3;

export const teamFilterCopy: Record<
  TeamFilter,
  {
    contextTitle: string;
    contextDetail: string;
    listTitle: string;
    listDetail: string;
    empty: string;
  }
> = {
  [FILTER_ALL]: {
    contextTitle: "Leitura pastoral da equipe",
    contextDetail:
      "A leitura começa pelo cuidado que pede mais atenção. No detalhe da célula, sinais e acompanhamentos aparecem com calma.",
    listTitle: "Supervisores",
    listDetail: "Organização por responsável pastoral.",
    empty:
      "A busca ou os filtros podem ser limpos para conferir toda a estrutura pastoral.",
  },
  [FILTER_URGENT]: {
    contextTitle: "Urgente",
    contextDetail: "Sinais mais sensíveis no contexto da célula.",
    listTitle: "Urgentes por supervisor",
    listDetail: "O contexto pastoral aparece no detalhe da célula.",
    empty: "Nenhuma célula urgente neste recorte.",
  },
  [FILTER_PASTORAL]: {
    contextTitle: "Encaminhadas ao pastor",
    contextDetail:
      "Encaminhamentos que liderança ou supervisão trouxeram ao cuidado pastoral.",
    listTitle: "Encaminhadas ao pastor por supervisor",
    listDetail: "Células com encaminhamento pastoral aberto.",
    empty: "Nenhuma célula com encaminhamento ao pastor neste recorte.",
  },
  [FILTER_SUPPORT]: {
    contextTitle: "Apoio pedido",
    contextDetail: "Células com pedido de apoio aberto.",
    listTitle: "Pedidos de apoio por supervisor",
    listDetail: "Supervisores com células em pedido de apoio.",
    empty: "Nenhuma célula com pedido de apoio neste recorte.",
  },
  [FILTER_ATTENTION]: {
    contextTitle: "Em atenção",
    contextDetail:
      "Células com atenção local, cuidado recente ou presença baixa registrada.",
    listTitle: "Células em atenção por supervisor",
    listDetail: "Células com acompanhamento próximo.",
    empty: "Nenhuma célula pedindo atenção neste recorte.",
  },
  [FILTER_NO_RECENT_PRESENCE]: {
    contextTitle: "Retomar contato",
    contextDetail: "Células ativas sem presença recente registrada.",
    listTitle: "Retomar contato por supervisor",
    listDetail: "Células sem dado recente de presença.",
    empty: "Nenhuma célula sem presença recente neste recorte.",
  },
  [FILTER_STABLE]: {
    contextTitle: "Estáveis",
    contextDetail:
      "Células sem sinal prioritário e com presença recente registrada.",
    listTitle: "Células estáveis por supervisor",
    listDetail: "Células com leitura pastoral estável.",
    empty: "Nenhuma célula estável neste recorte.",
  },
};
