import { describe, expect, it } from "vitest";
import {
  getStructureSearchStatus,
  structureSearchFilterPath,
  structureSearchPath,
  structureSearchQueryForPath,
} from "./structure-search-view";

describe("structure-search-view", () => {
  it("keeps short live-search queries out of URLs", () => {
    expect(structureSearchQueryForPath("a")).toBe("");
    expect(structureSearchQueryForPath(" ab ")).toBe("ab");
  });

  it("builds structure search paths with query, filter and section anchor", () => {
    expect(structureSearchPath({
      basePath: "/celulas",
      defaultFilter: "todas",
      filter: "todas",
      query: " Ana ",
      sectionId: "lista",
    })).toBe("/celulas?q=Ana#lista");

    expect(structureSearchPath({
      basePath: "/celulas",
      defaultFilter: "todas",
      filter: "atencao",
      query: "",
      sectionId: "lista",
    })).toBe("/celulas?filtro=atencao#lista");
  });

  it("clears query when returning to the default filter", () => {
    expect(structureSearchFilterPath({
      basePath: "/equipe",
      defaultFilter: "todos",
      currentQuery: "ana",
      nextFilter: "todos",
      sectionId: "lista",
    })).toBe("/equipe#lista");

    expect(structureSearchFilterPath({
      basePath: "/equipe",
      defaultFilter: "todos",
      currentQuery: "ana",
      nextFilter: "atencao",
      sectionId: "lista",
    })).toBe("/equipe?q=ana&filtro=atencao#lista");
  });

  it("describes structure search status for assistive feedback", () => {
    expect(getStructureSearchStatus("a")).toBe("Digite pelo menos 2 letras para filtrar.");
    expect(getStructureSearchStatus("ana")).toBe("A lista será atualizada automaticamente.");
    expect(getStructureSearchStatus("")).toBe("Busque pelo nome ou use os filtros para ajustar a lista.");
  });
});
