import {
  GroupKind,
  GroupResponsibilityRole,
  MembershipRole,
} from "../../src/generated/prisma/client";
import type { SeedMember, SeedPrismaClient, SeedUser } from "./types";

export async function createSeedGroupWithResponsibilities({
  prisma,
  churchId,
  name,
  leader,
  supervisor = null,
  meetingDayOfWeek,
  meetingTime,
  locationName,
  eventsGeneratedUntil,
  isActive = true,
  kind = GroupKind.CELL,
}: {
  prisma: SeedPrismaClient;
  churchId: string;
  name: string;
  leader: SeedUser;
  supervisor?: SeedUser | null;
  meetingDayOfWeek?: number | null;
  meetingTime?: string | null;
  locationName?: string | null;
  eventsGeneratedUntil?: Date | null;
  isActive?: boolean;
  kind?: GroupKind;
}) {
  const group = await prisma.smallGroup.create({
    data: {
      churchId,
      name,
      kind,
      meetingDayOfWeek,
      meetingTime,
      locationName,
      eventsGeneratedUntil,
      isActive,
    },
  });

  await prisma.groupResponsibility.createMany({
    data: [
      {
        churchId,
        groupId: group.id,
        userId: leader.id,
        role: GroupResponsibilityRole.LEADER,
      },
      ...(supervisor
        ? [
            {
              churchId,
              groupId: group.id,
              userId: supervisor.id,
              role: GroupResponsibilityRole.SUPERVISOR,
            },
          ]
        : []),
    ],
  });

  return group;
}

export async function createSeedGroupMemberships({
  prisma,
  groupId,
  members,
  role = MembershipRole.MEMBER,
}: {
  prisma: SeedPrismaClient;
  groupId: string;
  members: SeedMember[];
  role?: MembershipRole;
}) {
  if (members.length === 0) return;

  await prisma.groupMembership.createMany({
    data: members.map((member) => ({
      groupId,
      personId: member.id,
      role,
    })),
  });
}
