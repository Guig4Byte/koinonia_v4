import { describe, expect, it } from "vitest";
import {
  actionableRegistrationQualityIssues,
  buildRegistrationQualitySummary,
  isInternalLogin,
  isPossiblyIncompleteName,
} from "@/features/registration-quality/registration-quality";

const people = [
  { id: "person-1", fullName: "Cibeli", phone: "+5521999999999", primaryGroup: { id: "group-1", name: "Célula Semear" } },
  { id: "person-2", fullName: "Derbe Aguiar", phone: null, primaryGroup: { id: "group-2", name: "Célula Esperança" } },
  { id: "person-3", fullName: "Adriana Cidade", phone: "+5521888888888", primaryGroup: null },
];

const users = [
  { id: "user-1", name: "Cibeli", email: "cibeli@koinonia.local", role: "Líder", personId: "person-1", person: { id: "person-1", fullName: "Cibeli" } },
  { id: "user-2", name: "Derbe", email: "derbe@example.com", role: "Supervisor", personId: null, person: null },
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
    expect(summary.issues.find((issue) => issue.key === "missingPhone")?.items).toEqual([
      expect.objectContaining({
        title: "Derbe Aguiar",
        detail: "Célula Esperança",
        href: "/pessoas/person-2?acao=telefone",
        actionLabel: "Adicionar telefone",
      }),
    ]);
    expect(summary.issues.find((issue) => issue.key === "possiblyIncompleteName")?.items).toEqual([
      expect.objectContaining({
        title: "Cibeli",
        detail: "Célula Semear",
        href: "/pessoas/person-1?acao=nome#perfil",
        actionLabel: "Revisar nome",
      }),
    ]);
    expect(summary.issues.find((issue) => issue.key === "internalLogin")?.items).toEqual([
      expect.objectContaining({
        title: "Cibeli",
        detail: "cibeli@koinonia.local · Líder",
        href: "/usuarios/user-1/editar",
        actionLabel: "Trocar login",
      }),
    ]);
  });


  it("prioriza pendências acionáveis por vínculo pastoral e papel", () => {
    const summary = buildRegistrationQualitySummary({
      people: [
        { id: "person-3", fullName: "Visitante Betel", phone: null, primaryGroup: null },
        { id: "person-1", fullName: "Bruno Lima", phone: null, primaryGroup: { id: "group-2", name: "Célula Esperança" } },
        { id: "person-2", fullName: "Ana Martins", phone: null, primaryGroup: { id: "group-1", name: "Célula Semear" } },
      ],
      users: [
        { id: "user-3", name: "Bruno Lima", email: "bruno@koinonia.local", role: "Líder" },
        { id: "user-1", name: "Admin Koinonia", email: "admin@koinonia.local", role: "Admin" },
        { id: "user-2", name: "Ana Martins", email: "ana@koinonia.local", role: "Supervisor" },
      ],
    });

    expect(summary.issues.find((issue) => issue.key === "missingPhone")?.items).toEqual([
      expect.objectContaining({ title: "Ana Martins", detail: "Célula Semear", actionLabel: "Adicionar telefone" }),
      expect.objectContaining({ title: "Bruno Lima", detail: "Célula Esperança", actionLabel: "Adicionar telefone" }),
      expect.objectContaining({ title: "Visitante Betel", detail: "Sem célula ativa", actionLabel: "Adicionar telefone" }),
    ]);
    expect(summary.issues.find((issue) => issue.key === "internalLogin")?.items).toEqual([
      expect.objectContaining({ title: "Admin Koinonia", actionLabel: "Trocar login" }),
      expect.objectContaining({ title: "Ana Martins", actionLabel: "Trocar login" }),
      expect.objectContaining({ title: "Bruno Lima", actionLabel: "Trocar login" }),
    ]);
  });

  it("descreve pessoas com acesso ao sistema pelo vínculo mais relevante", () => {
    const summary = buildRegistrationQualitySummary({
      people: [
        {
          id: "person-supervisor",
          fullName: "Cibeli",
          phone: "+5521999999999",
          primaryGroup: null,
          supervisedGroups: [{ id: "group-1", name: "Célula Semear" }],
          hasSystemAccess: true,
        },
        {
          id: "person-supervisor-many",
          fullName: "Fernando",
          phone: "+5521888888888",
          primaryGroup: null,
          supervisedGroups: [
            { id: "group-1", name: "Célula Semear" },
            { id: "group-2", name: "Célula Esperança" },
          ],
          hasSystemAccess: true,
        },
        {
          id: "person-leader",
          fullName: "Derbe",
          phone: "+5521777777777",
          primaryGroup: null,
          ledGroups: [{ id: "group-3", name: "Célula Centro" }],
          hasSystemAccess: true,
        },
        {
          id: "person-system",
          fullName: "Adriana",
          phone: "+5521666666666",
          primaryGroup: null,
          hasSystemAccess: true,
        },
      ],
      users: [],
    });

    expect(summary.issues.find((issue) => issue.key === "possiblyIncompleteName")?.items).toEqual([
      expect.objectContaining({ title: "Cibeli", detail: "Acompanha 1 célula" }),
      expect.objectContaining({ title: "Derbe", detail: "Lidera Célula Centro" }),
      expect.objectContaining({ title: "Fernando", detail: "Acompanha 2 células" }),
      expect.objectContaining({ title: "Adriana", detail: "Usuário do sistema" }),
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
