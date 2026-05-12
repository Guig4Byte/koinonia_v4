"use client";

import Link from "next/link";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Badge, isBadgeTone, type BadgeTone } from "@/components/ui/badge";
import { SEARCH_MIN_QUERY_LENGTH, shouldSearchPeople, normalizeSearchQuery } from "@/features/search/search-view";
import { isRecord, readJsonResponse } from "@/lib/json";
import { API_ROUTES } from "@/lib/api-routes";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";

type SearchResult = {
  id: string;
  fullName: string;
  context: string;
  status: string;
  statusTone?: BadgeTone;
};

type SearchResponse = {
  people: SearchResult[];
};

type SearchStatus = "idle" | "loading" | "success" | "error";

const SEARCH_DEBOUNCE_MS = 300;
const NO_ACTIVE_OPTION = -1;

function isSearchResult(value: unknown): value is SearchResult {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string"
    && typeof value.fullName === "string"
    && typeof value.context === "string"
    && typeof value.status === "string"
    && (value.statusTone === undefined || isBadgeTone(value.statusTone))
  );
}

function isSearchResponse(value: unknown): value is SearchResponse {
  return isRecord(value) && Array.isArray(value.people) && value.people.every(isSearchResult);
}

function pluralizeResults(count: number) {
  return count === 1 ? "1 pessoa encontrada." : `${count} pessoas encontradas.`;
}

function getSearchMessage({
  query,
  resultsCount,
  status,
}: {
  query: string;
  resultsCount: number;
  status: SearchStatus;
}) {
  const normalizedQuery = normalizeSearchQuery(query);

  if (normalizedQuery.length === 0) return "Busque por nome ou sobrenome.";
  if (!shouldSearchPeople(normalizedQuery)) return `Digite pelo menos ${SEARCH_MIN_QUERY_LENGTH} letras.`;
  if (status === "loading") return "Buscando pessoas...";
  if (status === "error") return "Não foi possível buscar agora. Tente novamente.";
  if (resultsCount === 0) return "Nenhuma pessoa encontrada.";
  return pluralizeResults(resultsCount);
}

export function SearchBox({ placeholder = "Buscar pessoa..." }: { placeholder?: string }) {
  const router = useRouter();
  const listboxId = useId();
  const statusId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_OPTION);

  const normalizedQuery = normalizeSearchQuery(query);
  const canSearch = shouldSearchPeople(normalizedQuery);
  const showPanel = canSearch && status !== "idle";
  const hasResults = results.length > 0;
  const activePerson = activeIndex >= 0 ? results[activeIndex] : undefined;
  const activeOptionId = activePerson ? `${listboxId}-option-${activePerson.id}` : undefined;
  const searchMessage = getSearchMessage({ query, resultsCount: results.length, status });

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(API_ROUTES.searchPeople(normalizedQuery), { signal: controller.signal });
        if (!response.ok) throw new Error("Search request failed");

        const data = await readJsonResponse(response);
        if (controller.signal.aborted) return;

        setResults(isSearchResponse(data) ? data.people : []);
        setStatus("success");
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus("error");
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [canSearch, normalizedQuery]);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setStatus("idle");
    setActiveIndex(NO_ACTIVE_OPTION);
  }

  function handleQueryChange(value: string) {
    const nextNormalizedQuery = normalizeSearchQuery(value);

    setQuery(value);
    setActiveIndex(NO_ACTIVE_OPTION);

    if (!shouldSearchPeople(nextNormalizedQuery)) {
      setResults([]);
      setStatus("idle");
      return;
    }

    if (nextNormalizedQuery !== normalizedQuery) {
      setResults([]);
      setStatus("loading");
    }
  }

  function moveActiveOption(direction: 1 | -1) {
    if (!hasResults) return;
    setActiveIndex((current) => {
      if (current === NO_ACTIVE_OPTION) return direction === 1 ? 0 : results.length - 1;
      return (current + direction + results.length) % results.length;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveOption(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveOption(-1);
      return;
    }

    if (event.key === "Enter" && activePerson) {
      event.preventDefault();
      router.push(ROUTES.person(activePerson.id));
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearSearch();
    }
  }

  return (
    <div id="buscar" className="relative mb-4">
      <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-4 shadow-card focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand-accent)]">
        <Search className="h-4 w-4 shrink-0 text-[color:var(--color-text-secondary)]" />
        <input
          id="search-input"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls={showPanel ? listboxId : undefined}
          aria-describedby={statusId}
          aria-expanded={showPanel}
          aria-activedescendant={activeOptionId}
          className="w-full min-w-0 bg-transparent text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)]"
        />
        {query ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={clearSearch}
            className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-secondary)] transition hover:bg-[var(--surface-alt)] active:scale-[0.96]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {!showPanel ? (
        <p className="mt-2 px-1 text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]">
          {searchMessage}
        </p>
      ) : null}

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados da busca de pessoas"
          className="absolute left-0 right-0 top-14 z-30 overflow-y-auto rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card"
          style={{ maxHeight: "min(48svh, 22rem)" }}
        >
          {status === "loading" ? (
            <div className="px-4 py-3 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">Buscando pessoas...</div>
          ) : null}

          {status === "error" ? (
            <div role="alert" className="px-4 py-3 text-[length:var(--text-sm)] font-medium text-[color:var(--color-badge-risco-text)]">
              Não foi possível buscar agora. Tente novamente.
            </div>
          ) : null}

          {status === "success" && !hasResults ? (
            <div className="px-4 py-3 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">Nenhuma pessoa encontrada.</div>
          ) : null}

          {status === "success" && hasResults
            ? results.map((person, index) => {
                const isActive = index === activeIndex;

                return (
                  <Link
                    key={person.id}
                    id={`${listboxId}-option-${person.id}`}
                    href={ROUTES.person(person.id)}
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      "block border-b border-[var(--color-border-divider)] px-4 py-3 outline-none last:border-0 focus:bg-[var(--surface-alt)]",
                      isActive && "bg-[var(--surface-alt)]",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className="k-card-header-row">
                      <span className="min-w-0">
                        <span className="k-item-title-sm block truncate">{person.fullName}</span>
                        <span className="mt-0.5 block truncate text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">{person.context}</span>
                      </span>
                      <Badge tone={person.statusTone ?? "neutral"} className="max-w-[48%] truncate">
                        {person.status}
                      </Badge>
                    </div>
                  </Link>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}
