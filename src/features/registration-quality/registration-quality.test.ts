import { describe, expect, it } from "vitest";
import {
  actionableRegistrationQualityIssues,
  buildRegistrationQualitySummary,
  isInternalLogin,
  isPossiblyIncompleteName,
} from "@/features/registration-quality/registration-quality";

const people = [
  { fullName: "Cibeli", phone: "+5521999999999" },
  { fullName: "Derbe Aguiar", phone: null },
  { fullName: "Adriana Cidade", phone: "+5521888888888" },
];

const users = [
  { email: "cibeli@koinonia.local", personId: "person-1" },
  { email: "derbe@example.com", personId: null },
];

describe("registration quality", () => {
  it("identifica login interno pelo domínio técnico", () => {
    expect(isInternalLogin("cibeli@koinonia.local")).toBe(true);
    expect(isInternalLogin("derbe@example.com")).toBe(false);
  });

  it("trata nomes com uma palavra como possivelmente incompletos", () => {
    expect(isPossiblyIncompleteName("Cibeli")).toBe(true);
    expect(isPossiblyIncompleteName("Derbe Aguiar")).toBe(false);
  });

  it("monta resumo sem transformar qualidade cadastral em alerta pastoral", () => {
    const summary = buildRegistrationQualitySummary({ people, users });

    expect(summary.title).toBe("Dados a completar");
    expect(summary.detail).toContain("sem impacto em sinais pastorais");
    expect(summary.totalIssues).toBe(4);
    expect(summary.issues).toEqual([
      expect.objectContaining({ key: "possiblyIncompleteName", count: 1 }),
      expect.objectContaining({ key: "missingPhone", count: 1 }),
      expect.objectContaining({ key: "internalLogin", count: 1 }),
      expect.objectContaining({ key: "unlinkedUser", count: 1 }),
    ]);
  });

  it("mantém na home apenas pendências com ação necessária", () => {
    const summary = buildRegistrationQualitySummary({
      people: [
        { fullName: "Derbe Aguiar", phone: null },
        { fullName: "Adriana Cidade", phone: "+5521888888888" },
      ],
      users: [{ email: "adriana@example.com", personId: "person-1" }],
    });

    expect(actionableRegistrationQualityIssues(summary)).toEqual([
      expect.objectContaining({ key: "missingPhone", count: 1 }),
    ]);
  });

  it("não expõe ações quando a base não tem pendências aparentes", () => {
    const summary = buildRegistrationQualitySummary({
      people: [{ fullName: "Adriana Cidade", phone: "+5521888888888" }],
      users: [{ email: "adriana@example.com", personId: "person-1" }],
    });

    expect(summary.hasIssues).toBe(false);
    expect(summary.detail).toContain("sem pendências aparentes");
    expect(actionableRegistrationQualityIssues(summary)).toEqual([]);
  });
});
