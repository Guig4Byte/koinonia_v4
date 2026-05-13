"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Search, X } from "lucide-react";
import { FilterChip } from "@/components/ui/filter-chip";
import styles from "./structure-search.module.css";

export type StructureSearchOption<TFilter extends string> = {
  value: TFilter;
  label: string;
};

export type StructureSearchProps<TFilter extends string> = {
  basePath: string;
  query: string;
  filter: TFilter;
  defaultFilter: TFilter;
  sectionId: string;
  filters: ReadonlyArray<StructureSearchOption<TFilter>>;
  ariaLabel: string;
  placeholder: string;
};

export type StructureSearchConfig<TFilter extends string> = Pick<
  StructureSearchProps<TFilter>,
  "basePath" | "defaultFilter" | "filters" | "ariaLabel" | "placeholder"
>;

const LIVE_SEARCH_MIN_QUERY_LENGTH = 2;
const LIVE_SEARCH_DEBOUNCE_MS = 300;

function structurePath<TFilter extends string>({
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

function searchQueryForPath(query: string) {
  const normalizedQuery = query.trim();
  return normalizedQuery.length >= LIVE_SEARCH_MIN_QUERY_LENGTH ? normalizedQuery : "";
}

function StructureSearchContent<TFilter extends string>({
  basePath,
  query,
  filter,
  defaultFilter,
  sectionId,
  filters,
  ariaLabel,
  placeholder,
}: StructureSearchProps<TFilter>) {
  const router = useRouter();
  const statusId = useId();
  const [draftQuery, setDraftQuery] = useState(query);
  const normalizedDraftQuery = draftQuery.trim();
  const queryForPath = searchQueryForPath(draftQuery);
  const currentQueryForPath = searchQueryForPath(query);
  const showMinHint = normalizedDraftQuery.length > 0 && normalizedDraftQuery.length < LIVE_SEARCH_MIN_QUERY_LENGTH;

  function searchPath(nextQuery: string) {
    return structurePath({
      basePath,
      defaultFilter,
      filter,
      query: searchQueryForPath(nextQuery),
      sectionId,
    });
  }

  const nextSearchPath = searchPath(draftQuery);
  const searchStatus = showMinHint
    ? `Digite pelo menos ${LIVE_SEARCH_MIN_QUERY_LENGTH} letras para filtrar.`
    : normalizedDraftQuery.length > 0
      ? "A lista será atualizada automaticamente."
      : "Digite para filtrar a lista.";

  function filterPath(nextFilter: TFilter) {
    if (nextFilter === defaultFilter) {
      return structurePath({
        basePath,
        defaultFilter,
        filter: defaultFilter,
        query: "",
        sectionId,
      });
    }

    return structurePath({
      basePath,
      defaultFilter,
      filter: nextFilter,
      query: queryForPath,
      sectionId,
    });
  }

  function clearSearch() {
    setDraftQuery("");
    if (query) router.replace(searchPath(""));
  }

  useEffect(() => {
    if (queryForPath === currentQueryForPath) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(nextSearchPath);
    }, LIVE_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [currentQueryForPath, nextSearchPath, queryForPath, router]);

  return (
    <section className={styles.tools}>
      <div className={styles.searchForm}>
        <Search className="h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" aria-hidden="true" />
        <input
          name="q"
          value={draftQuery}
          aria-label={ariaLabel}
          aria-describedby={statusId}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)]"
          onChange={(event) => setDraftQuery(event.currentTarget.value)}
        />
        {draftQuery ? (
          <button
            type="button"
            aria-label="Limpar busca"
            className={styles.searchClear}
            onClick={clearSearch}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <p id={statusId} className={styles.searchStatus} aria-live="polite">
        {searchStatus}
      </p>

      <div className="k-filter-row">
        {filters.map((option) => {
          const active = option.value === filter && (option.value !== defaultFilter || !query);

          return (
            <FilterChip
              key={option.value}
              href={filterPath(option.value)}
              active={active}
            >
              {option.label}
            </FilterChip>
          );
        })}
      </div>
    </section>
  );
}

export function StructureSearch<TFilter extends string>(props: StructureSearchProps<TFilter>) {
  return <StructureSearchContent key={`${props.query}-${props.filter}`} {...props} />;
}
