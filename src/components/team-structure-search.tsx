"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type TeamFilter = "todos" | "atencao" | "sem-presenca";

const TEAM_FILTERS: Array<{ value: TeamFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Pedem atenção" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

type TeamStructureSearchProps = {
  query: string;
  filter: TeamFilter;
  sectionId: string;
};

function teamStructurePath(filter: TeamFilter, query: string, sectionId: string) {
  const normalizedQuery = query.trim();
  const params = new URLSearchParams();

  if (normalizedQuery) params.set("q", normalizedQuery);
  if (filter !== "todos") params.set("filtro", filter);

  const queryString = params.toString();
  const path = queryString ? `/equipe?${queryString}` : "/equipe";
  return `${path}#${sectionId}`;
}

export function TeamStructureSearch({ query, filter, sectionId }: TeamStructureSearchProps) {
  const router = useRouter();
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  function searchPath(nextQuery: string) {
    return teamStructurePath(filter, nextQuery, sectionId);
  }

  function filterPath(nextFilter: TeamFilter) {
    if (nextFilter === "todos") {
      return teamStructurePath("todos", "", sectionId);
    }

    return teamStructurePath(nextFilter, draftQuery, sectionId);
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
          aria-label="Buscar supervisor ou célula"
          placeholder="Buscar supervisor ou célula..."
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
        {TEAM_FILTERS.map((option) => {
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
