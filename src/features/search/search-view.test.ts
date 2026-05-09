import { describe, expect, it } from "vitest";
import {
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_PRIMARY_MEMBERSHIP_LIMIT,
  SEARCH_RESULT_LIMIT,
  normalizeSearchQuery,
  shouldSearchPeople,
} from "./search-view";

describe("search-view", () => {
  it("mantém limites de busca nomeados", () => {
    expect(SEARCH_MIN_QUERY_LENGTH).toBe(2);
    expect(SEARCH_RESULT_LIMIT).toBe(8);
    expect(SEARCH_PRIMARY_MEMBERSHIP_LIMIT).toBe(1);
  });

  it("normaliza termo de busca antes de decidir se deve buscar", () => {
    expect(normalizeSearchQuery("  Ana  ")).toBe("Ana");
    expect(shouldSearchPeople("a")).toBe(false);
    expect(shouldSearchPeople(" a ")).toBe(false);
    expect(shouldSearchPeople("an")).toBe(true);
    expect(shouldSearchPeople("  ana  ")).toBe(true);
  });
});
