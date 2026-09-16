"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BucketChip, CountdownPill } from "@/components/countdown";
import { HourChips } from "@/components/champions";
import { FeedCard } from "@/components/feed-card";
import { InfiniteSentinel } from "@/components/infinite-sentinel";
import { FeedSortControl } from "@/components/feed-sort";
import { EmptyState, Spinner } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { useSession } from "@/components/session-provider";
import { getRepos } from "@/data/browser";
import { pickLiveBucket } from "@/data/feed-repository";
import type { FeedSort } from "@/data/pagination";
import type { Agenda, HourlyBucket, Post } from "@/data/types";
import { toUserMessage } from "@/lib/errors";

export function HomeFeed() {
  const { user } = useSession();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [buckets, setBuckets] = useState<HourlyBucket[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<FeedSort>("latest");
  const loadingMoreRef = useRef(false);

  const loadInitial = useCallback(async () => {
    setError(null);
    setLoading(true);
    setPosts([]);
    try {
      const repos = getRepos();
      const nextAgenda = await repos.feed.getCurrentAgenda();
      const [hourBuckets, page] = await Promise.all([
        repos.feed.listBuckets(nextAgenda.id),
        repos.feed.getLiveFeedPage(nextAgenda.id, 0, sort),
      ]);
      setAgenda(nextAgenda);
      setBuckets(hourBuckets);
      setPosts(page.items);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!agenda || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await getRepos().feed.getLiveFeedPage(agenda.id, posts.length, sort);
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        return [...current, ...page.items.filter((post) => !seen.has(post.id))];
      });
      setHasMore(page.hasMore);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [agenda, hasMore, posts.length, sort]);

  async function vote(postId: string) {
    const live = pickLiveBucket(buckets);
    if (!live || !user?.hasContentAccess) return;
    try {
      await getRepos().feed.castVote(live.id, postId);
      await loadInitial();
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  async function report(postId: string) {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason) return;
    try {
      await getRepos().profiles.report({ targetType: "post", reason, postId });
      setError(null);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  if (loading) return <Spinner />;
  if (error && !agenda) return <EmptyState title="Feed unavailable" body={error} />;
  if (!agenda) return <EmptyState title="No active agenda" />;

  const liveBucket = pickLiveBucket(buckets);
  const canVote = Boolean(user?.hasContentAccess && liveBucket);
  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div>
        <p className="text-sm font-semibold text-[var(--lavender)]">Today’s agenda</p>
        <h1 className="text-3xl font-extrabold">{agenda.title}</h1>
        {agenda.description ? <p className="mt-1 text-[var(--text-secondary)]">{agenda.description}</p> : null}
        <div className="mt-3">
          <ShareButton kind="agenda" id={agenda.id} agendaTitle={agenda.title} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CountdownPill endsAt={agenda.endsAt} label="Agenda ends in" />
        <BucketChip index={agenda.bucketIndex} total={agenda.totalBuckets} endsAt={agenda.bucketEndsAt} />
      </div>
      <HourChips agendaId={agenda.id} buckets={buckets} currentBucketId={agenda.bucketId} />
      <FeedSortControl value={sort} onChange={setSort} />
      {!user?.hasContentAccess ? (
        <p className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3 text-sm text-[var(--text-secondary)]">
          Your trial has ended. You can still browse, but posting and voting stay locked.{" "}
          <Link href="/pricing" className="font-semibold text-[var(--lavender)]">
            See Inner Circle pricing
          </Link>
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!liveBucket ? (
        <EmptyState title="No live hour right now" body="The home feed only shows posts from the current live bucket." />
      ) : posts.length === 0 ? (
        <EmptyState title="No posts this hour yet" body="Be the first to post in the live bucket." />
      ) : null}
      {posts.map((post) => (
        <FeedCard
          key={post.id}
          post={post}
          canVote={canVote}
          onVote={vote}
          onReport={report}
        />
      ))}
      <InfiniteSentinel onLoadMore={() => void loadMore()} disabled={!hasMore || loadingMore} />
      {loadingMore ? <Spinner /> : null}
    </div>
  );
}
