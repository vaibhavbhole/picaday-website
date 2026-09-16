"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeedCard } from "@/components/feed-card";
import { FeedSortControl } from "@/components/feed-sort";
import { InfiniteSentinel } from "@/components/infinite-sentinel";
import { Avatar, EmptyState, Spinner } from "@/components/ui";
import { getRepos } from "@/data/browser";
import type { FeedSort } from "@/data/pagination";
import type { BucketFeed } from "@/data/types";
import { formatTimeWindow } from "@/lib/format";
import { toUserMessage } from "@/lib/errors";

export function BucketFeedView({ agendaId, bucketId }: { agendaId: string; bucketId: string }) {
  const [feed, setFeed] = useState<BucketFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<FeedSort>("latest");
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFeed(null);
    getRepos()
      .feed.getBucketFeed(agendaId, bucketId, 0, sort)
      .then((next) => {
        if (mounted) setFeed(next);
      })
      .catch((err) => {
        if (mounted) setError(toUserMessage(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [agendaId, bucketId, sort]);

  const loadMore = useCallback(async () => {
    if (!feed || loadingMoreRef.current || !feed.hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const next = await getRepos().feed.getBucketFeed(agendaId, bucketId, feed.posts.length, sort);
      setFeed((current) => {
        if (!current) return next;
        const seen = new Set(current.posts.map((post) => post.id));
        return {
          ...next,
          posts: [...current.posts, ...next.posts.filter((post) => !seen.has(post.id))],
        };
      });
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [agendaId, bucketId, feed, sort]);

  if (loading) return <Spinner />;
  if (error || !feed) return <EmptyState title="Could not load this hour" body={error ?? undefined} />;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[var(--lavender)]">{feed.agenda.title}</p>
        <h1 className="text-2xl font-extrabold">Hour {feed.bucket.bucketNumber}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{formatTimeWindow(feed.bucket.startsAt, feed.bucket.endsAt)}</p>
      </div>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
        {feed.winner ? (
          feed.winner.username ? (
            <Link href={`/u/${feed.winner.username}`} className="flex items-center gap-3">
              <Avatar url={feed.winner.avatarUrl} name={feed.winner.username} size={48} />
              <div>
                <p className="text-xs uppercase text-[var(--text-muted)]">Winner</p>
                <p className="font-bold">@{feed.winner.username}</p>
                <p className="text-sm text-[var(--text-secondary)]">{feed.winner.votes ?? 0} votes</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar url={feed.winner.avatarUrl} name="winner" size={48} />
              <div>
                <p className="text-xs uppercase text-[var(--text-muted)]">Winner</p>
                <p className="font-bold">Unknown</p>
              </div>
            </div>
          )
        ) : (
          <p className="font-semibold text-[var(--text-secondary)]">Zero participation</p>
        )}
      </div>
      <FeedSortControl value={sort} onChange={setSort} />
      <p className="text-sm text-[var(--text-muted)]">Voting is closed for this hour.</p>
      {feed.posts.length === 0 ? <EmptyState title="No posts in this hour" /> : null}
      {feed.posts.map((post) => (
        <FeedCard key={post.id} post={post} canVote={false} />
      ))}
      <InfiniteSentinel onLoadMore={() => void loadMore()} disabled={!feed.hasMore || loadingMore} />
      {loadingMore ? <Spinner /> : null}
    </div>
  );
}
