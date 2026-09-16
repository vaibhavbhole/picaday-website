"use client";

import { useEffect, useState } from "react";
import { PeopleList, PeopleSearchInput } from "@/components/people-list";
import { EmptyState, Spinner } from "@/components/ui";
import { getRepos } from "@/data/browser";
import type { SearchProfile } from "@/data/types";
import { toUserMessage } from "@/lib/errors";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      getRepos()
        .profiles.search(q)
        .then(setResults)
        .catch((err) => setError(toUserMessage(err)))
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-4">
      <PeopleSearchInput value={query} onChange={setQuery} />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <Spinner /> : null}
      {!loading && query.trim().length >= 2 && results.length === 0 ? (
        <EmptyState title="No people found" />
      ) : null}
      <PeopleList people={results} />
    </div>
  );
}
