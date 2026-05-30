import { isBadgeTone, type BadgeTone } from "@/components/ui/badge";
import { isRecord } from "@/lib/json";
import {
  SEARCH_MIN_QUERY_LENGTH,
  normalizeSearchQuery,
  shouldSearchPeople,
} from "./search-view";

export type SearchResult = {
  id: string;
  fullName: string;
  context: string;
  status: string;
  statusTone?: BadgeTone;
};

export type SearchResponse = {
  people: SearchResult[];
};

export type SearchStatus = "idle" | "loading" | "success" | "error";

export const SEARCH_DEBOUNCE_MS = 300;
export const NO_ACTIVE_SEARCH_OPTION = -1;

export function isSearchResult(value: unknown): value is SearchResult {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string"
    && typeof value.fullName === "string"
    && typeof value.context === "string"
    && typeof value.status === "string"
    && (value.statusTone === undefined || isBadgeTone(value.statusTone))
  );
}

export function isSearchResponse(value: unknown): value is SearchResponse {
  return isRecord(value) && Array.isArray(value.people) && value.people.every(isSearchResult);
}

export function searchResultsLabel(count: number) {
  return count === 1 ? "1 irmão encontrado." : `${count} irmãos encontrados.`;
}

export function getPeopleSearchMessage({
  query,
  resultsCount,
  status,
}: {
  query: string;
  resultsCount: number;
  status: SearchStatus;
}) {
  const normalizedQuery = normalizeSearchQuery(query);

  if (normalizedQuery.length === 0) return "Nome ou sobrenome ajudam na busca.";
  if (!shouldSearchPeople(normalizedQuery)) return `Pelo menos ${SEARCH_MIN_QUERY_LENGTH} letras ajudam na busca.`;
  if (status === "loading") return "Buscando irmãos...";
  if (status === "error") return "Não foi possível buscar agora. Vale tentar novamente em instantes.";
  if (resultsCount === 0) return "Nenhum irmão encontrado.";
  return searchResultsLabel(resultsCount);
}

export function nextActiveSearchOption({
  currentIndex,
  direction,
  resultsCount,
}: {
  currentIndex: number;
  direction: 1 | -1;
  resultsCount: number;
}) {
  if (resultsCount <= 0) return NO_ACTIVE_SEARCH_OPTION;
  if (currentIndex === NO_ACTIVE_SEARCH_OPTION) return direction === 1 ? 0 : resultsCount - 1;
  return (currentIndex + direction + resultsCount) % resultsCount;
}
