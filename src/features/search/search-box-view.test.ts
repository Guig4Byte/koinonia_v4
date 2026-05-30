import { describe, expect, it } from "vitest";
import {
  NO_ACTIVE_SEARCH_OPTION,
  getPeopleSearchMessage,
  isSearchResponse,
  nextActiveSearchOption,
  searchResultsLabel,
} from "./search-box-view";

describe("search-box-view", () => {
  it("formats people search messages by query/status/result state", () => {
    expect(getPeopleSearchMessage({ query: "", resultsCount: 0, status: "idle" })).toBe("Nome ou sobrenome ajudam na busca.");
    expect(getPeopleSearchMessage({ query: "a", resultsCount: 0, status: "idle" })).toBe("Pelo menos 2 letras ajudam na busca.");
    expect(getPeopleSearchMessage({ query: "Ana", resultsCount: 0, status: "loading" })).toBe("Buscando irmãos...");
    expect(getPeopleSearchMessage({ query: "Ana", resultsCount: 0, status: "error" })).toBe("Não foi possível buscar agora. Vale tentar novamente em instantes.");
    expect(getPeopleSearchMessage({ query: "Ana", resultsCount: 0, status: "success" })).toBe("Nenhum irmão encontrado.");
    expect(getPeopleSearchMessage({ query: "Ana", resultsCount: 2, status: "success" })).toBe("2 irmãos encontrados.");
  });

  it("pluralizes search result labels", () => {
    expect(searchResultsLabel(1)).toBe("1 irmão encontrado.");
    expect(searchResultsLabel(3)).toBe("3 irmãos encontrados.");
  });

  it("validates search API responses before rendering", () => {
    expect(isSearchResponse({ people: [{ id: "1", fullName: "Ana", context: "Célula", status: "Ativo" }] })).toBe(true);
    expect(isSearchResponse({ people: [{ id: "1", fullName: "Ana", context: "Célula", status: "Ativo", statusTone: "risk" }] })).toBe(true);
    expect(isSearchResponse({ people: [{ id: "1", fullName: "Ana", context: "Célula", status: "Ativo", statusTone: "desconhecido" }] })).toBe(false);
    expect(isSearchResponse({ people: [{ id: "1", fullName: "Ana", status: "Ativo" }] })).toBe(false);
  });

  it("moves active result with keyboard wrapping", () => {
    expect(nextActiveSearchOption({ currentIndex: NO_ACTIVE_SEARCH_OPTION, direction: 1, resultsCount: 3 })).toBe(0);
    expect(nextActiveSearchOption({ currentIndex: NO_ACTIVE_SEARCH_OPTION, direction: -1, resultsCount: 3 })).toBe(2);
    expect(nextActiveSearchOption({ currentIndex: 2, direction: 1, resultsCount: 3 })).toBe(0);
    expect(nextActiveSearchOption({ currentIndex: 0, direction: -1, resultsCount: 3 })).toBe(2);
    expect(nextActiveSearchOption({ currentIndex: 0, direction: 1, resultsCount: 0 })).toBe(NO_ACTIVE_SEARCH_OPTION);
  });
});
