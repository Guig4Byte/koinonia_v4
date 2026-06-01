import { PersonStatus } from "@/generated/prisma/client";
import { isInCareStatus } from "@/features/people/person-status";
import { isSupportRequest } from "@/features/signals/sections";
import { isPastoralCaseSignal, isUrgentSignal } from "@/features/groups/group-pastoral-priority";
import { countLabel } from "@/lib/format";
import {
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";
import { GROUP_DETAIL_FOCUS_VALUES } from "@/features/groups/group-detail-view/group-detail-view.constants";
import {
  type GroupDetailFocus,
  type GroupDetailFocusCardData,
  type GroupDetailSignal,
  type GroupDetailViewer,
  type MemberDisplay,
} from "@/features/groups/group-detail-view/group-detail-view.types";

export function readGroupDetailFocus(value: string | null | undefined): GroupDetailFocus | null {
  return GROUP_DETAIL_FOCUS_VALUES.some((focus) => focus === value) ? value as GroupDetailFocus : null;
}

export function groupMemberFocusKeys(
  signal: GroupDetailSignal | undefined,
  personStatus: PersonStatus,
  viewer: GroupDetailViewer,
): GroupDetailFocus[] {
  const focusKeys: GroupDetailFocus[] = [];

  if (signal) {
    if (isUrgentSignal(signal)) focusKeys.push(FILTER_URGENT);
    else if (isPastoralCaseSignal(signal)) focusKeys.push(FILTER_PASTORAL);
    else if (isSupportRequest(signal, viewer)) focusKeys.push(FILTER_SUPPORT);
    else focusKeys.push(FILTER_ATTENTION);
  }

  if (isInCareStatus(personStatus)) focusKeys.push(FILTER_IN_CARE);

  return focusKeys;
}

export function groupMemberMatchesFocus(member: Pick<MemberDisplay, "focusKeys">, focus: GroupDetailFocus) {
  return member.focusKeys.includes(focus);
}

export function groupDetailFocusCard(
  focus: GroupDetailFocus | null,
  focusedMembersCount: number,
): GroupDetailFocusCardData | null {
  if (!focus) return null;

  const peopleDetail = focusedMembersCount > 0
    ? `${countLabel(focusedMembersCount, "irmão neste recorte", "irmãos neste recorte")}.`
    : "Os detalhes abaixo ajudam a entender o contexto da célula.";

  if (focus === FILTER_URGENT) {
    return {
      title: "Urgente nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} Sinais que pedem atenção imediata.` : "Sinais que pedem atenção imediata.",
      tone: "error",
    };
  }

  if (focus === FILTER_PASTORAL) {
    return {
      title: "Encaminhados ao pastor nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} Encaminhamentos trazidos para cuidado pastoral.` : "Encaminhamentos trazidos para cuidado pastoral.",
      tone: "warning",
    };
  }

  if (focus === FILTER_SUPPORT) {
    return {
      title: "Pedido de apoio nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} Pedidos enviados à supervisão.` : "Pedidos enviados à supervisão.",
      tone: "default",
    };
  }

  if (focus === FILTER_ATTENTION) {
    return {
      title: "Em atenção nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} O contexto local merece uma leitura com calma.` : "O contexto local merece uma leitura com calma.",
      tone: "warning",
    };
  }

  if (focus === FILTER_IN_CARE) {
    return {
      title: "Em cuidado nesta célula",
      detail: focusedMembersCount > 0 ? `${peopleDetail} Acompanhamentos em andamento para manter no radar.` : "Acompanhamentos em andamento para manter no radar.",
      tone: "default",
    };
  }

  if (focus === FILTER_NO_RECENT_PRESENCE) {
    return {
      title: "Retomar contato",
      detail: "Ainda não há presença recente registrada para esta célula.",
      tone: "default",
    };
  }

  if (focus === FILTER_LOW_PRESENCE) {
    return {
      title: "Presença baixa nesta célula",
      detail: "A média recente está abaixo do esperado. O contexto da célula ajuda antes de qualquer próximo passo.",
      tone: "warning",
    };
  }

  return {
    title: "Célula estável",
    detail: "Sem sinal prioritário neste recorte.",
    tone: "success",
  };
}
