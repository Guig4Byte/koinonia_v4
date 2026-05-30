export const LIVE_SEARCH_MIN_QUERY_LENGTH = 2;
export const LIVE_SEARCH_DEBOUNCE_MS = 300;

export function structureSearchQueryForPath(query: string) {
  const normalizedQuery = query.trim();
  return normalizedQuery.length >= LIVE_SEARCH_MIN_QUERY_LENGTH
    ? normalizedQuery
    : "";
}

export function structureSearchPath<TFilter extends string>({
  basePath,
  defaultFilter,
  filter,
  query,
  sectionId,
}: {
  basePath: string;
  defaultFilter: TFilter;
  filter: TFilter;
  query: string;
  sectionId: string;
}) {
  const normalizedQuery = query.trim();
  const params = new URLSearchParams();

  if (normalizedQuery) params.set("q", normalizedQuery);
  if (filter !== defaultFilter) params.set("filtro", filter);

  const queryString = params.toString();
  const path = queryString ? `${basePath}?${queryString}` : basePath;
  return `${path}#${sectionId}`;
}

export function structureSearchFilterPath<TFilter extends string>({
  basePath,
  defaultFilter,
  currentQuery,
  nextFilter,
  sectionId,
}: {
  basePath: string;
  defaultFilter: TFilter;
  currentQuery: string;
  nextFilter: TFilter;
  sectionId: string;
}) {
  return structureSearchPath({
    basePath,
    defaultFilter,
    filter: nextFilter,
    query: nextFilter === defaultFilter ? "" : structureSearchQueryForPath(currentQuery),
    sectionId,
  });
}

export function getStructureSearchStatus(query: string) {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length > 0 && normalizedQuery.length < LIVE_SEARCH_MIN_QUERY_LENGTH) {
    return `Digite pelo menos ${LIVE_SEARCH_MIN_QUERY_LENGTH} letras para filtrar.`;
  }

  if (normalizedQuery.length > 0) return "A lista será atualizada automaticamente.";
  return "Busque pelo nome ou use os filtros para ajustar a lista.";
}
