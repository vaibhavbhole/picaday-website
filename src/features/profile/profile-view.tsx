"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, X } from "lucide-react";
import { FeedCard, MediaCarousel } from "@/components/feed-card";
import { FeedSortControl } from "@/components/feed-sort";
import { InfiniteSentinel } from "@/components/infinite-sentinel";
import { Avatar, Button, EmptyState, Field, Spinner } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { getRepos } from "@/data/browser";
import { isLiveHourPost } from "@/data/feed-repository";
import type { FeedSort } from "@/data/pagination";
import type { Agenda, AgendaProposal, Post, PublicProfile } from "@/data/types";
import { preparePostImage } from "@/lib/media/post-image";
import { toUserMessage } from "@/lib/errors";
import {
  SOCIAL_PLATFORMS,
  previewSocialLinks,
  serializeSocialLinks,
  type SocialLinks,
  type SocialPlatformId,
} from "@/lib/social-links";

const EMPTY_SOCIAL = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, ""])) as Record<
  SocialPlatformId,
  string
>;

export function ProfileView({ username }: { username?: string }) {
  const { user, refresh } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [proposals, setProposals] = useState<AgendaProposal[]>([]);
  const [showProposals, setShowProposals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [socialDraft, setSocialDraft] = useState(EMPTY_SOCIAL);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [liveAgenda, setLiveAgenda] = useState<Agenda | null>(null);
  const [sort, setSort] = useState<FeedSort>("latest");
  const loadingMoreRef = useRef(false);

  const isSelf = !username || user?.username === username;

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const repos = getRepos();
        const handle = username ?? user?.username;
        if (!handle) return;
        const next = await repos.profiles.getByUsername(handle);
        if (!next) throw new Error("Profile not found.");
        const [past, proposed, live] = await Promise.all([
          repos.profiles.getPastPosts(next.id, 0, sort),
          repos.profiles.getProposals(next.id),
          repos.feed.getCurrentAgenda().catch(() => null),
        ]);
        if (!mounted) return;
        setProfile(next);
        setPosts(past.items);
        setHasMore(past.hasMore);
        setSelected(null);
        setLiveAgenda(live);
        setProposals(proposed);
        setDisplayName(next.displayName);
        setSocialDraft({ ...EMPTY_SOCIAL, ...next.socialLinks });
        if (user && next.id !== user.id) {
          await repos.profiles.recordVisit(next.id);
        }
      } catch (err) {
        if (mounted) setError(toUserMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [username, user, sort]);

  const loadMore = useCallback(async () => {
    if (!profile || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await getRepos().profiles.getPastPosts(profile.id, posts.length, sort);
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
  }, [hasMore, posts.length, profile, sort]);

  function applyLikes(postId: string, likes: number) {
    setPosts((current) => current.map((post) => (post.id === postId ? { ...post, likes } : post)));
    setSelected((current) => (current && current.id === postId ? { ...current, likes } : current));
  }

  async function vote(postId: string) {
    const post = posts.find((item) => item.id === postId) ?? (selected?.id === postId ? selected : null);
    if (!post || !liveAgenda || !user?.hasContentAccess || !isLiveHourPost(post, liveAgenda)) return;
    try {
      await getRepos().feed.castVote(liveAgenda.bucketId, postId);
      applyLikes(postId, await getRepos().feed.countVotes(postId));
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  if (loading) return <Spinner />;
  if (error && !profile) return <EmptyState title="Profile not found" body={error ?? undefined} />;
  if (!profile) return <EmptyState title="Profile not found" />;

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let socialLinks: SocialLinks = {};
      try {
        socialLinks = serializeSocialLinks(socialDraft);
      } catch (err) {
        setError(toUserMessage(err));
        setSaving(false);
        return;
      }
      const savedLinks = await getRepos().profiles.updateOwnProfile({ displayName, socialLinks });
      await refresh();
      setProfile((current) =>
        current
          ? { ...current, displayName, socialLinks: Object.keys(savedLinks).length ? savedLinks : socialLinks }
          : current,
      );
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onAvatar(file: File | undefined) {
    if (!file || !user) return;
    setSaving(true);
    try {
      const blob = await preparePostImage(file);
      const url = await getRepos().profiles.uploadAvatar(user.id, blob);
      await getRepos().profiles.updateOwnProfile({ avatarUrl: url });
      await refresh();
      setProfile((current) => (current ? { ...current, avatarUrl: url } : current));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function reportProfile() {
    const reason = window.prompt("Why are you reporting this profile?");
    if (!reason || !profile) return;
    try {
      await getRepos().profiles.report({ targetType: "profile", reason, profileId: profile.id });
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  const displayedSocial = {
    ...profile.socialLinks,
    ...(isSelf ? previewSocialLinks(socialDraft) : {}),
  };
  const socialEntries = SOCIAL_PLATFORMS.filter((platform) => displayedSocial[platform.id]);
  const selectedCanVote = Boolean(
    selected && user?.hasContentAccess && isLiveHourPost(selected, liveAgenda),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(220px,1fr)_minmax(280px,420px)]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 text-center">
          <Avatar url={profile.avatarUrl} name={profile.displayName} size={96} />
          <h1 className="mt-3 text-2xl font-extrabold">{profile.displayName}</h1>
          <p className="text-[var(--text-secondary)]">@{profile.username}</p>
          {isSelf && user ? (
            <p className="mt-2 text-sm font-semibold text-[var(--teal)]">
              {user.isPaidMember ? (
                "Premium member"
              ) : user.hasContentAccess ? (
                "Trial member"
              ) : (
                <Link href="/pricing" className="text-[var(--lavender)]">
                  Trial ended · See pricing
                </Link>
              )}
            </p>
          ) : (
            <Button variant="danger" className="mt-3" onClick={() => void reportProfile()}>
              Report
            </Button>
          )}
          <div className="mt-6 grid grid-cols-3">
            <Stat value={profile.postsCount} label="Posts" />
            <Stat value={profile.winsCount} label="Wins" />
            <Stat value={profile.agendasCount} label="Agendas" />
          </div>
        </div>

        {socialEntries.length > 0 ? (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
            <p className="mb-2 text-sm font-semibold text-[var(--text-muted)]">Elsewhere</p>
            <div className="flex flex-col gap-2">
              {socialEntries.map((platform) => (
                <a
                  key={platform.id}
                  href={displayedSocial[platform.id]}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[var(--lavender)] hover:underline"
                >
                  {platform.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {isSelf ? (
          <form className="space-y-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4" onSubmit={(e) => void saveProfile(e)}>
            <Field label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <input type="file" accept="image/*" onChange={(e) => void onAvatar(e.target.files?.[0])} />
            {SOCIAL_PLATFORMS.map((platform) => (
              <Field
                key={platform.id}
                label={platform.label}
                placeholder={platform.placeholder}
                value={socialDraft[platform.id]}
                onChange={(e) => setSocialDraft((current) => ({ ...current, [platform.id]: e.target.value }))}
              />
            ))}
            <p className="text-xs text-[var(--text-muted)]">
              Profile page URLs only (no posts, reels, or videos). Handles are expanded to the matching profile URL.
            </p>
            <Button disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
          </form>
        ) : null}

        <label className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
          <span className="font-semibold">Proposed agendas</span>
          <input type="checkbox" checked={showProposals} onChange={(e) => setShowProposals(e.target.checked)} />
        </label>
        {showProposals ? (
          proposals.length === 0 ? (
            <EmptyState title="No proposals yet" />
          ) : (
            <div className="space-y-2">
              {proposals.map((proposal) => {
                const content = (
                  <>
                    <p className="font-bold">{proposal.title}</p>
                    <p className="text-xs uppercase text-[var(--text-muted)]">{proposal.status}</p>
                    {proposal.description ? (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{proposal.description}</p>
                    ) : null}
                  </>
                );
                const className =
                  "block rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3 hover:border-[var(--lavender)]";
                return proposal.agendaId ? (
                  <Link key={proposal.id} href={`/explore/${proposal.agendaId}`} className={className}>
                    {content}
                  </Link>
                ) : (
                  <div key={proposal.id} className={className}>
                    {content}
                  </div>
                );
              })}
            </div>
          )
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Past posts</h2>
        <div className="mb-3">
          <FeedSortControl value={sort} onChange={setSort} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelected(post)}
              className="relative overflow-hidden rounded-xl border border-[var(--card-border)] text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrls[0]} alt="" className="aspect-[4/5] w-full object-cover" />
              {isLiveHourPost(post, liveAgenda) ? (
                <span className="absolute left-2 top-2 rounded-full bg-[var(--lavender-dark)] px-2 py-0.5 text-[10px] font-bold">
                  Live
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <InfiniteSentinel onLoadMore={() => void loadMore()} disabled={!hasMore || loadingMore} />
        {loadingMore ? <Spinner /> : null}
      </section>

      <aside className="hidden lg:block">
        <div className="sticky top-20">
          {selected ? (
            <FeedCard
              post={selected}
              canVote={selectedCanVote}
              onVote={(postId) => void vote(postId)}
            />
          ) : (
            <EmptyState title="Select a post" body="Click a thumbnail to view it full size." />
          )}
        </div>
      </aside>

      {selected ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/90 p-4 lg:hidden">
          <button
            type="button"
            className="mb-3 self-end rounded-full bg-white/10 p-2"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            <X />
          </button>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <MediaCarousel urls={selected.imageUrls} variant="full" />
          </div>
          {selected.agendaId ? (
            <Link
              href={`/explore/${selected.agendaId}`}
              className="mt-3 text-center text-sm font-semibold text-[var(--lavender)]"
              onClick={() => setSelected(null)}
            >
              {selected.agendaTitle || "Hourly buckets"}
            </Link>
          ) : null}
          {selected.caption ? <p className="mt-2 text-center text-sm">{selected.caption}</p> : null}
          <div className="mt-3 flex justify-center">
            <Button
              variant="ghost"
              className="gap-2 px-2"
              disabled={!selectedCanVote}
              onClick={() => void vote(selected.id)}
            >
              <Heart size={18} className={selectedCanVote ? "text-[var(--lavender)]" : "text-[var(--text-muted)]"} />
              {selected.likes}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
