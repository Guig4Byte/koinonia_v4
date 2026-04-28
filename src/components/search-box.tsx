"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBox({ placeholder = "Buscar pessoa..." }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; fullName: string; context: string; status: string }>>([]);

  async function onChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    if (!response.ok) return;
    const data = await response.json();
    setResults(data.people ?? []);
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
            <a key={person.id} href={`/pessoas?person=${person.id}`} className="block border-b border-[var(--color-border-divider)] px-4 py-3 last:border-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{person.fullName}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{person.context} · {person.status}</p>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
