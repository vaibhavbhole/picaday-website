"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { InfiniteSentinel } from "@/components/infinite-sentinel";
import { EmptyState, Spinner } from "@/components/ui";
import { getRepos } from "@/data/browser";
import type { PastAgenda } from "@/data/types";
import { formatAgendaRange } from "@/lib/format";
import { toUserMessage } from "@/lib/errors";

export function ExploreList() {
  const [agendas, setAgendas] = useState<PastAgenda[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    getRepos()
      .champions.listPastAgendas(0)
      .then((page) => {
        setAgendas(page.items);
        setHasMore(page.hasMore);
      })
      .catch((err) => setError(toUserMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await getRepos().champions.listPastAgendas(agendas.length);
      setAgendas((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setHasMore(page.hasMore);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [agendas.length, hasMore]);

  if (loading) return <Spinner />;
  if (error && agendas.length === 0) return <EmptyState title="Could not load agendas" body={error} />;
  if (agendas.length === 0) return <EmptyState title="No completed agendas yet" />;

  return (
    <div className="space-y-3">
      {agendas.map((agenda) => (
        <Link
          key={agenda.id}
          href={`/explore/${agenda.id}`}
          className="block rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 hover:border-[var(--lavender)]"
        >
          <h2 className="text-lg font-extrabold">{agenda.title}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{formatAgendaRange(agenda.startsAt, agenda.endsAt)}</p>
          {agenda.description ? <p className="mt-2 text-sm text-[var(--text-muted)]">{agenda.description}</p> : null}
        </Link>
      ))}
      <InfiniteSentinel onLoadMore={() => void loadMore()} disabled={!hasMore || loadingMore} />
      {loadingMore ? <Spinner /> : null}
    </div>
  );
}
