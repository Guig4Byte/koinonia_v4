"use client";

import Link from "next/link";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { CardHeader } from "@/components/ui/card-header";
import { shouldSearchPeople, normalizeSearchQuery } from "@/features/search/search-view";
import { readJsonResponse } from "@/lib/json";
import { API_ROUTES } from "@/lib/api-routes";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import styles from "./search-box.module.css";
import {
  NO_ACTIVE_SEARCH_OPTION,
  SEARCH_DEBOUNCE_MS,
  getPeopleSearchMessage,
  isSearchResponse,
  nextActiveSearchOption,
  type SearchResult,
  type SearchStatus,
} from "@/features/search/search-box-view";

export function SearchBox({ placeholder = "Buscar irmão..." }: { placeholder?: string }) {
  const router = useRouter();
  const listboxId = useId();
  const statusId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_SEARCH_OPTION);

  const normalizedQuery = normalizeSearchQuery(query);
  const canSearch = shouldSearchPeople(normalizedQuery);
  const showPanel = canSearch && status !== "idle";
  const hasResults = results.length > 0;
  const activePerson = activeIndex >= 0 ? results[activeIndex] : undefined;
  const activeOptionId = activePerson ? `${listboxId}-option-${activePerson.id}` : undefined;
  const searchMessage = getPeopleSearchMessage({ query, resultsCount: results.length, status });

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
    setActiveIndex(NO_ACTIVE_SEARCH_OPTION);
  }

  function handleQueryChange(value: string) {
    const nextNormalizedQuery = normalizeSearchQuery(value);

    setQuery(value);
    setActiveIndex(NO_ACTIVE_SEARCH_OPTION);

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
      return nextActiveSearchOption({
        currentIndex: current,
        direction,
        resultsCount: results.length,
      });
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
      <div className={styles.form}>
        <Search className={styles.icon} />
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
          className={styles.control}
        />
        {query ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={clearSearch}
            className={styles.clear}
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
          className={styles.results}
          style={{ maxHeight: "min(48svh, 22rem)" }}
        >
          {status === "loading" ? (
            <div className={styles.message}>Buscando irmãos...</div>
          ) : null}

          {status === "error" ? (
            <div role="alert" className={cn(styles.message, styles.messageError)}>
              Não foi possível buscar agora. Vale tentar novamente em instantes.
            </div>
          ) : null}

          {status === "success" && !hasResults ? (
            <div className={styles.message}>Nenhum irmão encontrado. Tente buscar pelo nome completo ou pela célula.</div>
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
                    className={cn(styles.option, isActive && styles.optionActive)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <CardHeader
                      title={person.fullName}
                      subtitle={person.context}
                      badgeLabel={person.status}
                      badgeTone={person.statusTone ?? "neutral"}
                      titleClassName="k-item-title-sm block truncate"
                      subtitleClassName={styles.optionSubtitle}
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
