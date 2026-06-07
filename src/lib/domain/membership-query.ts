import { MembershipRole } from "@/generated/prisma/client";

export const activeMembershipWhere = {
  leftAt: null,
} as const;

export const activeNonVisitorMembershipWhere = {
  ...activeMembershipWhere,
  role: { not: MembershipRole.VISITOR },
} as const;

export const activeVisitorMembershipWhere = {
  ...activeMembershipWhere,
  role: MembershipRole.VISITOR,
} as const;

export function activeGroupMembershipWhere(groupId: string) {
  return {
    groupId,
    ...activeMembershipWhere,
  };
}

export function activeNonVisitorGroupMembershipWhere(groupId: string) {
  return {
    groupId,
    ...activeNonVisitorMembershipWhere,
  };
}

export function activeVisitorGroupMembershipWhere(groupId: string) {
  return {
    groupId,
    ...activeVisitorMembershipWhere,
  };
}
