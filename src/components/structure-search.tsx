"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type StructureSearchOption<TFilter extends string> = {
  value: TFilter;
  label: string;
};

type StructureSearchProps<TFilter extends string> = {
  basePath: string;
  query: string;
  filter: TFilter;
  defaultFilter: TFilter;
  sectionId: string;
  filters: Array<StructureSearchOption<TFilter>>;
  ariaLabel: string;
  placeholder: string;
};

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
  const [draftQuery, setDraftQuery] = useState(query);

  function searchPath(nextQuery: string) {
    return structurePath({
      basePath,
      defaultFilter,
      filter,
      query: nextQuery,
      sectionId,
    });
  }

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
      query: draftQuery,
      sectionId,
    });
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
          aria-label={ariaLabel}
          placeholder={placeholder}
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
        {filters.map((option) => {
          const active = option.value === filter && (option.value !== defaultFilter || !query);

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

export function StructureSearch<TFilter extends string>(props: StructureSearchProps<TFilter>) {
  return <StructureSearchContent key={props.query} {...props} />;
}
