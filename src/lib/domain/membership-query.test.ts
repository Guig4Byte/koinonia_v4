import { describe, expect, it } from "vitest";
import { MembershipRole } from "@/generated/prisma/client";
import {
  activeGroupMembershipWhere,
  activeMembershipWhere,
  activeNonVisitorGroupMembershipWhere,
  activeNonVisitorMembershipWhere,
  activeVisitorGroupMembershipWhere,
  activeVisitorMembershipWhere,
} from "./membership-query";

describe("membership query rules", () => {
  it("centralizes active membership filters", () => {
    expect(activeMembershipWhere).toEqual({ leftAt: null });
    expect(activeGroupMembershipWhere("group-1")).toEqual({ groupId: "group-1", leftAt: null });
  });

  it("keeps visitors out of regular active member queries", () => {
    expect(activeNonVisitorMembershipWhere).toEqual({
      leftAt: null,
      role: { not: MembershipRole.VISITOR },
    });
    expect(activeNonVisitorGroupMembershipWhere("group-1")).toEqual({
      groupId: "group-1",
      leftAt: null,
      role: { not: MembershipRole.VISITOR },
    });
  });

  it("keeps active visitor membership filters explicit", () => {
    expect(activeVisitorMembershipWhere).toEqual({ leftAt: null, role: MembershipRole.VISITOR });
    expect(activeVisitorGroupMembershipWhere("group-1")).toEqual({
      groupId: "group-1",
      leftAt: null,
      role: MembershipRole.VISITOR,
    });
  });
});
