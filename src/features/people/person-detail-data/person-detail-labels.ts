import type { MembershipRole } from "@/generated/prisma/client";

const membershipRoleLabels: Record<MembershipRole, string> = {
  MEMBER: "Membro",
  VISITOR: "Visitante",
  HOST: "Anfitrião",
  LEADER: "Líder",
};

export function membershipRoleLabel(role?: MembershipRole | null) {
  return role ? membershipRoleLabels[role] : "Irmão";
}

export function personProfileEyebrow({
  openSignalsCount,
  isInCare,
}: {
  openSignalsCount: number;
  isInCare: boolean;
}) {
  if (openSignalsCount > 0) return "Irmão no radar";
  if (isInCare) return "Irmão em cuidado";
  return "Perfil pastoral";
}
