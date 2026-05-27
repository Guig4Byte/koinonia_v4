"use client";

import Link from "next/link";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { isBadgeTone, type BadgeTone } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card-header";
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
  return count === 1 ? "1 irmão encontrado." : `${count} irmãos encontrados.`;
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

  if (normalizedQuery.length === 0) return "Nome ou sobrenome ajudam na busca.";
  if (!shouldSearchPeople(normalizedQuery)) return `Pelo menos ${SEARCH_MIN_QUERY_LENGTH} letras ajudam na busca.`;
  if (status === "loading") return "Buscando irmãos...";
  if (status === "error") return "Não foi possível buscar agora. Vale tentar novamente em instantes.";
  if (resultsCount === 0) return "Nenhum irmão encontrado.";
  return pluralizeResults(resultsCount);
}

export function SearchBox({ placeholder = "Buscar irmão..." }: { placeholder?: string }) {
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
      <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-4 shadow-[var(--color-shadow-metric-card)] transition focus-within:border-[var(--color-focus-ring)] focus-within:ring-2 focus-within:ring-[var(--color-focus-ring-soft)]">
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
            className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-secondary)] transition hover:bg-[var(--surface-alt)] active:scale-[0.96]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <p
        id={statusId}
        aria-live="polite"
        className={cn(
          showPanel
            ? "sr-only"
            : "mt-2 px-1 text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]",
        )}
      >
        {searchMessage}
      </p>

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados da busca de irmãos"
          className="absolute left-0 right-0 top-14 z-30 overflow-y-auto rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card"
          style={{ maxHeight: "min(48svh, 22rem)" }}
        >
          {status === "loading" ? (
            <div className="px-4 py-3 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">Buscando irmãos...</div>
          ) : null}

          {status === "error" ? (
            <div role="alert" className="px-4 py-3 text-[length:var(--text-sm)] font-medium text-[color:var(--color-badge-risco-text)]">
              Não foi possível buscar agora. Vale tentar novamente em instantes.
            </div>
          ) : null}

          {status === "success" && !hasResults ? (
            <div className="px-4 py-3 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">Nenhum irmão encontrado. Tente buscar pelo nome completo ou pela célula.</div>
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
                    <CardHeader
                      title={person.fullName}
                      subtitle={person.context}
                      badgeLabel={person.status}
                      badgeTone={person.statusTone ?? "neutral"}
                      titleClassName="k-item-title-sm block truncate"
                      subtitleClassName="mt-0.5 block truncate text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]"
                    />
                  </Link>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}
