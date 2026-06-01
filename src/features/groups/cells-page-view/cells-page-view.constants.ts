import type { GroupSectionKey } from "@/features/groups/cells-page-view/cells-page-view.types";

export const CELLS_PAGE_SECTION_LIMIT = 4;
export const NO_RECENT_PRESENCE_BADGE_LABEL = "Sem presença";

export const GROUP_SECTIONS: Array<{ key: GroupSectionKey; title: string; detail: string }> = [
  {
    key: "care",
    title: "Urgente",
    detail: "Sinais abertos, pedidos de apoio ou irmãos já em cuidado.",
  },
  {
    key: "presence",
    title: "Presença em atenção",
    detail: "Células com registro ausente ou presença abaixo do esperado.",
  },
  {
    key: "stable",
    title: "Acompanhamento estável",
    detail: "Sem sinal aberto pedindo cuidado agora.",
  },
];
