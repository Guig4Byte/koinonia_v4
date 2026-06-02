export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_RESULT_LIMIT = 8;
export const SEARCH_PRIMARY_MEMBERSHIP_LIMIT = 1;
export const SEARCH_ACCENT_FALLBACK_SCAN_LIMIT = 120;

export function normalizeSearchQuery(value: string) {
  return value.trim();
}

export function shouldSearchPeople(query: string) {
  return normalizeSearchQuery(query).length >= SEARCH_MIN_QUERY_LENGTH;
}
