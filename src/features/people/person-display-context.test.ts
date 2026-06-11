import { describe, expect, it } from "vitest";
import { MembershipRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { personDisplayContext, personGroupCountLabel, personLeadershipContext, personLeadershipDisplayBadge } from "./person-display-context";

describe("person-display-context", () => {
  it("prioriza função pastoral antes de vínculo de célula", () => {
    expect(personDisplayContext({ systemRole: UserRole.PASTOR })).toBe("Pastor");
    expect(personDisplayContext({ systemRole: UserRole.SUPERVISOR, supervisedGroups: [{ name: "Célula Semear" }] })).toBe("Supervisor · Acompanha 1 célula");
    expect(personDisplayContext({
      systemRole: UserRole.SUPERVISOR,
      supervisedGroups: [{ name: "Célula Semear" }, { name: "Célula Vida" }],
    })).toBe("Supervisor · Acompanha 2 células");
    expect(personDisplayContext({ systemRole: UserRole.LEADER, ledGroups: [{ name: "Célula Semear" }] })).toBe("Líder · Célula Semear");
  });

  it("diferencia visitantes, irmãos e pessoas sem vínculo", () => {
    expect(personDisplayContext({ status: PersonStatus.VISITOR, primaryGroup: { name: "Célula Semear" } })).toBe("Visitante · Visitou Célula Semear");
    expect(personDisplayContext({ primaryMembershipRole: MembershipRole.VISITOR, primaryGroup: { name: "Célula Semear" } })).toBe("Visitante · Visitou Célula Semear");
    expect(personDisplayContext({ primaryGroup: { name: "Célula Semear" } })).toBe("Irmão · Célula Semear");
    expect(personDisplayContext({})).toBe("Sem célula vinculada");
  });

  it("aceita papéis já formatados em texto", () => {
    expect(personDisplayContext({ systemRole: "Supervisora", supervisedGroups: [{ name: "Célula Semear" }] })).toBe("Supervisor · Acompanha 1 célula");
    expect(personDisplayContext({ systemRole: "Líder", ledGroups: [{ name: "Célula Centro" }] })).toBe("Líder · Célula Centro");
  });

  it("resolve badge de função para liderança", () => {
    expect(personLeadershipDisplayBadge({ systemRole: UserRole.PASTOR })).toEqual({ label: "Pastor", tone: "warn" });
    expect(personLeadershipDisplayBadge({ systemRole: UserRole.SUPERVISOR })).toEqual({ label: "Supervisor", tone: "support" });
    expect(personLeadershipDisplayBadge({ systemRole: UserRole.LEADER })).toEqual({ label: "Líder", tone: "info" });
    expect(personLeadershipDisplayBadge({ primaryGroup: { name: "Célula Semear" } })).toBeNull();
  });

  it("expõe classificação de liderança como fonte única para outros view models", () => {
    expect(personLeadershipContext({ systemRole: UserRole.PASTOR })).toMatchObject({ kind: "pastor", label: "Pastor", tone: "warn" });
    expect(personLeadershipContext({ systemRole: UserRole.ADMIN })).toMatchObject({ kind: "admin", label: "Admin", tone: "care" });
    expect(personLeadershipContext({ supervisedGroups: [{ name: "Célula Semear" }] })).toMatchObject({ kind: "supervisor", label: "Supervisor", tone: "support" });
    expect(personLeadershipContext({ ledGroups: [{ name: "Célula Semear" }] })).toMatchObject({ kind: "leader", label: "Líder", tone: "info" });
    expect(personLeadershipContext({ primaryGroup: { name: "Célula Semear" } })).toBeNull();
  });

  it("centraliza a escrita da contagem de células", () => {
    expect(personGroupCountLabel(1)).toBe("1 célula");
    expect(personGroupCountLabel(2)).toBe("2 células");
  });
});
