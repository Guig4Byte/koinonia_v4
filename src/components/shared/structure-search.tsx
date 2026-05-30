"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/lib/cn";
import type { FilterOption, FilterTone } from "@/lib/filter-param";
import {
  LIVE_SEARCH_DEBOUNCE_MS,
  getStructureSearchStatus,
  structureSearchFilterPath,
  structureSearchPath,
  structureSearchQueryForPath,
} from "./structure-search-view";
import styles from "./structure-search.module.css";

export type StructureSearchOption<TFilter extends string> =
  FilterOption<TFilter>;

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

const filterDotToneClass: Record<FilterTone, string> = {
  risk: styles.filterDotRisk,
  support: styles.filterDotSupport,
  warn: styles.filterDotWarn,
  care: styles.filterDotCare,
  neutral: styles.filterDotNeutral,
  ok: styles.filterDotOk,
};

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
  const filtersScrollerRef = useRef<HTMLDivElement | null>(null);
  const activeFilterRef = useRef<HTMLAnchorElement | null>(null);
  const [draftQuery, setDraftQuery] = useState(query);
  const normalizedDraftQuery = draftQuery.trim();
  const queryForPath = structureSearchQueryForPath(draftQuery);
  const currentQueryForPath = structureSearchQueryForPath(query);
  const searchStatus = getStructureSearchStatus(draftQuery);

  function searchPath(nextQuery: string) {
    return structureSearchPath({
      basePath,
      defaultFilter,
      filter,
      query: structureSearchQueryForPath(nextQuery),
      sectionId,
    });
  }

  const nextSearchPath = searchPath(draftQuery);

  function filterPath(nextFilter: TFilter) {
    return structureSearchFilterPath({
      basePath,
      defaultFilter,
      currentQuery: draftQuery,
      nextFilter,
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

  useEffect(() => {
    const scroller = filtersScrollerRef.current;
    const activeFilter = activeFilterRef.current;
    if (!scroller || !activeFilter) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const activeRect = activeFilter.getBoundingClientRect();
    const targetLeft =
      scroller.scrollLeft +
      activeRect.left -
      scrollerRect.left -
      (scroller.clientWidth - activeRect.width) / 2;

    scroller.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "auto",
    });
  }, [filter, query]);

  return (
    <section className={styles.tools}>
      <div className={styles.searchForm}>
        <Search
          className="h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]"
          aria-hidden="true"
        />
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
      <p
        id={statusId}
        className={cn(
          styles.searchStatus,
          !normalizedDraftQuery && styles.searchStatusHidden,
        )}
        aria-live="polite"
      >
        {searchStatus}
      </p>

      <div className={styles.filtersArea}>
        <p className={styles.filtersLabel}>Mostrar</p>
        <div className={styles.filtersScroller} ref={filtersScrollerRef}>
          <nav className={styles.filterRow} aria-label="Filtros da lista">
            {filters.map((option) => {
              const active =
                option.value === filter &&
                (option.value !== defaultFilter || !query);

              return (
                <FilterChip
                  key={option.value}
                  ref={active ? activeFilterRef : undefined}
                  href={filterPath(option.value)}
                  active={active}
                  aria-current={active ? "page" : undefined}
                  layout="withDot"
                  maxWidth="none"
                >
                  {option.tone ? (
                    <span
                      className={cn(
                        styles.filterDot,
                        filterDotToneClass[option.tone],
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>{option.label}</span>
                </FilterChip>
              );
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}

export function StructureSearch<TFilter extends string>(
  props: StructureSearchProps<TFilter>,
) {
  return (
    <StructureSearchContent
      key={`${props.query}-${props.filter}`}
      {...props}
    />
  );
}
