"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type CellsFilter = "todos" | "atencao" | "sem-presenca";

const CELLS_FILTERS: Array<{ value: CellsFilter; label: string }> = [
  { value: "todos", label: "Todas" },
  { value: "atencao", label: "Pedem cuidado próximo" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

type CellsStructureSearchProps = {
  query: string;
  filter: CellsFilter;
  sectionId: string;
};

function cellsStructurePath(filter: CellsFilter, query: string, sectionId: string) {
  const normalizedQuery = query.trim();
  const params = new URLSearchParams();

  if (normalizedQuery) params.set("q", normalizedQuery);
  if (filter !== "todos") params.set("filtro", filter);

  const queryString = params.toString();
  const path = queryString ? `/celulas?${queryString}` : "/celulas";
  return `${path}#${sectionId}`;
}

export function CellsStructureSearch({ query, filter, sectionId }: CellsStructureSearchProps) {
  const router = useRouter();
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  function searchPath(nextQuery: string) {
    return cellsStructurePath(filter, nextQuery, sectionId);
  }

  function filterPath(nextFilter: CellsFilter) {
    if (nextFilter === "todos") {
      return cellsStructurePath("todos", "", sectionId);
    }

    return cellsStructurePath(nextFilter, draftQuery, sectionId);
  }

  return (
    <section className="team-tools">
      <form
        action={searchPath(draftQuery)}
        className="team-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextQuery = String(formData.get("q") ?? "");
          router.push(searchPath(nextQuery));
        }}
      >
        <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
        <input
          name="q"
          value={draftQuery}
          aria-label="Buscar célula ou liderança"
          placeholder="Buscar célula ou liderança..."
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          onChange={(event) => {
            const nextQuery = event.currentTarget.value;
            setDraftQuery(nextQuery);

            if (query && nextQuery.trim() === "") {
              router.replace(searchPath(""));
            }
          }}
        />
        <button type="submit" className="team-search-submit">
          Buscar
        </button>
      </form>

      <div className="team-filter-row">
        {CELLS_FILTERS.map((option) => {
          const active = option.value === filter && (option.value !== "todos" || !query);

          return (
            <Link
              key={option.value}
              href={filterPath(option.value)}
              className={cn(
                "team-filter-chip",
                active && "team-filter-chip-active",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
