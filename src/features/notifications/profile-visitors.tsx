"use client";

import { useEffect, useMemo, useState } from "react";
import { PeopleList, PeopleSearchInput } from "@/components/people-list";
import { EmptyState, Spinner } from "@/components/ui";
import { getRepos } from "@/data/browser";
import type { ProfileVisitor } from "@/data/types";
import { formatRelative } from "@/lib/format";
import { toUserMessage } from "@/lib/errors";

export function ProfileVisitors() {
  const [query, setQuery] = useState("");
  const [visitors, setVisitors] = useState<ProfileVisitor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRepos()
      .profiles.listRecentVisitors(24)
      .then(setVisitors)
      .catch((err) => setError(toUserMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter(
      (person) =>
        person.username.toLowerCase().includes(q) || person.displayName.toLowerCase().includes(q),
    );
  }, [query, visitors]);

  if (loading) return <Spinner />;
  if (error) return <EmptyState title="Could not load visitors" body={error} />;
  if (visitors.length === 0) {
    return <EmptyState title="No visitors in the last 24 hours" />;
  }

  return (
    <div className="space-y-4">
      <PeopleSearchInput value={query} onChange={setQuery} />
      {query.trim() && filtered.length === 0 ? <EmptyState title="No people found" /> : null}
      <PeopleList
        people={filtered}
        meta={(person) => {
          const visitor = person as ProfileVisitor;
          const visits =
            visitor.visitCount > 1 ? ` · ${visitor.visitCount} visits` : "";
          return `${formatRelative(visitor.visitedAt)}${visits}`;
        }}
      />
    </div>
  );
}
