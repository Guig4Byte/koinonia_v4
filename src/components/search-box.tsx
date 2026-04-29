"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Badge, isBadgeTone, type BadgeTone } from "@/components/ui/badge";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

export function SearchBox({ placeholder = "Buscar pessoa..." }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  async function onChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    if (!response.ok) return;
    const data: unknown = await response.json();
    setResults(isSearchResponse(data) ? data.people : []);
  }

  return (
    <div id="buscar" className="relative mb-4">
      <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-4 shadow-card">
        <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
        <input
          id="search-input"
          value={query}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      {results.length > 0 ? (
        <div className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card">
          {results.map((person) => (
            <Link key={person.id} href={`/pessoas/${person.id}`} className="block border-b border-[var(--color-border-divider)] px-4 py-3 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{person.fullName}</span>
                  <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)]">{person.context}</span>
                </span>
                <Badge tone={person.statusTone ?? "neutral"} className="shrink-0">
                  {person.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
