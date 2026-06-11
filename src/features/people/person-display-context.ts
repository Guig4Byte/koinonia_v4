import type { BadgeTone } from "@/components/ui/badge";
import type { MembershipRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { userRoleBadgeTone, userRoleLabels } from "@/features/users/user-display";

export type PersonDisplayGroup = {
  name?: string | null;
};


export type PersonLeadershipKind = "pastor" | "admin" | "supervisor" | "leader";

export type PersonLeadershipDisplayBadge = {
  label: string;
  tone: BadgeTone;
};

export type PersonLeadershipContext = PersonLeadershipDisplayBadge & {
  kind: PersonLeadershipKind;
  role: UserRole | null;
};

export type PersonDisplayContextInput = {
  status?: PersonStatus | string | null;
  systemRole?: UserRole | string | null;
  primaryGroup?: PersonDisplayGroup | null;
  primaryMembershipRole?: MembershipRole | string | null;
  ledGroups?: PersonDisplayGroup[] | null;
  supervisedGroups?: PersonDisplayGroup[] | null;
  hasSystemAccess?: boolean;
};

const USER_ROLE = {
  ADMIN: "ADMIN",
  PASTOR: "PASTOR",
  SUPERVISOR: "SUPERVISOR",
  LEADER: "LEADER",
} as const satisfies Record<UserRole, UserRole>;

const MEMBERSHIP_ROLE_VISITOR: MembershipRole = "VISITOR";
const PERSON_STATUS_VISITOR: PersonStatus = "VISITOR";
const userRoleValues = new Set<string>(Object.values(USER_ROLE));

function compactJoin(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function comparableCopy(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeUserRole(role?: UserRole | string | null): UserRole | null {
  if (!role) return null;
  if (userRoleValues.has(role)) return role as UserRole;

  const normalizedRole = comparableCopy(role);

  if (normalizedRole === "admin") return USER_ROLE.ADMIN;
  if (normalizedRole === "pastor") return USER_ROLE.PASTOR;
  if (normalizedRole === "supervisor" || normalizedRole === "supervisora") return USER_ROLE.SUPERVISOR;
  if (normalizedRole === "leader" || normalizedRole === "lider") return USER_ROLE.LEADER;

  return null;
}

function normalizeMembershipRole(role?: MembershipRole | string | null): MembershipRole | null {
  if (!role) return null;
  return role === MEMBERSHIP_ROLE_VISITOR ? MEMBERSHIP_ROLE_VISITOR : null;
}

function normalizePersonStatus(status?: PersonStatus | string | null): PersonStatus | null {
  if (!status) return null;
  return status === PERSON_STATUS_VISITOR ? PERSON_STATUS_VISITOR : null;
}

function roleLabel(role?: UserRole | string | null) {
  const normalizedRole = normalizeUserRole(role);
  if (normalizedRole) return userRoleLabels[normalizedRole];

  return role?.trim() || undefined;
}

export function personGroupCountLabel(count: number) {
  return `${count} ${count === 1 ? "célula" : "células"}`;
}

function leadershipGroups(groups?: PersonDisplayGroup[] | null) {
  return groups?.filter((group) => Boolean(group.name?.trim())) ?? [];
}


export function personLeadershipContext(input: PersonDisplayContextInput): PersonLeadershipContext | null {
  const systemRole = normalizeUserRole(input.systemRole);
  const ledGroups = leadershipGroups(input.ledGroups);
  const supervisedGroups = leadershipGroups(input.supervisedGroups);

  if (systemRole === USER_ROLE.PASTOR || systemRole === USER_ROLE.ADMIN) {
    return {
      kind: systemRole === USER_ROLE.ADMIN ? "admin" : "pastor",
      role: systemRole,
      label: roleLabel(systemRole) ?? userRoleLabels[systemRole],
      tone: userRoleBadgeTone[systemRole],
    };
  }

  if (systemRole === USER_ROLE.SUPERVISOR || supervisedGroups.length > 0) {
    return {
      kind: "supervisor",
      role: systemRole === USER_ROLE.SUPERVISOR ? systemRole : null,
      label: roleLabel(systemRole) ?? userRoleLabels[USER_ROLE.SUPERVISOR],
      tone: userRoleBadgeTone[USER_ROLE.SUPERVISOR],
    };
  }

  if (systemRole === USER_ROLE.LEADER || ledGroups.length > 0) {
    return {
      kind: "leader",
      role: systemRole === USER_ROLE.LEADER ? systemRole : null,
      label: roleLabel(systemRole) ?? userRoleLabels[USER_ROLE.LEADER],
      tone: userRoleBadgeTone[USER_ROLE.LEADER],
    };
  }

  return null;
}

export function personLeadershipDisplayBadge(input: PersonDisplayContextInput): PersonLeadershipDisplayBadge | null {
  const leadershipContext = personLeadershipContext(input);
  if (!leadershipContext) return null;

  return {
    label: leadershipContext.label,
    tone: leadershipContext.tone,
  };
}

export function personDisplayContext(input: PersonDisplayContextInput): string {
  const leadershipContext = personLeadershipContext(input);
  const ledGroups = leadershipGroups(input.ledGroups);
  const supervisedGroups = leadershipGroups(input.supervisedGroups);
  const primaryGroupName = input.primaryGroup?.name?.trim();
  const isVisitor = normalizeMembershipRole(input.primaryMembershipRole) === MEMBERSHIP_ROLE_VISITOR
    || normalizePersonStatus(input.status) === PERSON_STATUS_VISITOR;

  if (leadershipContext?.kind === "pastor" || leadershipContext?.kind === "admin") {
    return leadershipContext.label;
  }

  if (leadershipContext?.kind === "supervisor") {
    return compactJoin([
      leadershipContext.label,
      supervisedGroups.length > 0 ? `Acompanha ${personGroupCountLabel(supervisedGroups.length)}` : undefined,
    ]);
  }

  if (leadershipContext?.kind === "leader") {
    const ledGroupDetail = ledGroups.length === 1
      ? ledGroups[0]?.name
      : ledGroups.length > 1
        ? `Lidera ${personGroupCountLabel(ledGroups.length)}`
        : primaryGroupName;

    return compactJoin([leadershipContext.label, ledGroupDetail]);
  }

  if (isVisitor) {
    return compactJoin(["Visitante", primaryGroupName ? `Visitou ${primaryGroupName}` : undefined]);
  }

  if (primaryGroupName) {
    return compactJoin(["Irmão", primaryGroupName]);
  }

  if (input.hasSystemAccess) {
    return roleLabel(input.systemRole) ?? "Usuário do sistema";
  }

  return "Sem célula vinculada";
}
