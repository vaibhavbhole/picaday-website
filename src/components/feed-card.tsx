"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { Avatar, Button } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import type { Post } from "@/data/types";

export function FeedCard({
  post,
  canVote,
  onVote,
  onReport,
}: {
  post: Post;
  canVote: boolean;
  onVote?: (postId: string) => void;
  onReport?: (postId: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <article className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
      <div className="flex items-center gap-3 px-3 py-3">
        <Link href={`/u/${post.username}`} className="flex min-w-0 items-center gap-3">
          <Avatar url={post.userAvatarUrl} name={post.username} />
          <div className="min-w-0">
            <p className="truncate font-bold">@{post.username}</p>
            <p className="text-xs text-[var(--text-muted)]">{formatRelative(post.createdAt)}</p>
          </div>
        </Link>
        <div className="relative ml-auto">
          <button type="button" className="p-1 text-[var(--text-muted)]" onClick={() => setMenu((v) => !v)}>
            <MoreHorizontal size={18} />
          </button>
          {menu && onReport ? (
            <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-1">
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400"
                onClick={() => {
                  setMenu(false);
                  onReport(post.id);
                }}
              >
                Report
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <MediaCarousel urls={post.imageUrls} />
      {post.caption ? <p className="px-3 pt-3 text-sm">{post.caption}</p> : null}
      {post.agendaId ? (
        <p className="px-3 pt-1 text-xs text-[var(--text-muted)]">
          Agenda:{" "}
          <Link href={`/explore/${post.agendaId}`} className="font-semibold text-[var(--lavender)] hover:underline">
            {post.agendaTitle || "Hourly buckets"}
          </Link>
        </p>
      ) : null}
      <div className="flex items-center gap-2 px-3 py-3">
        <Button
          variant="ghost"
          className={cn("gap-2 px-2", !canVote && "cursor-default opacity-80")}
          disabled={!canVote}
          onClick={() => canVote && onVote?.(post.id)}
        >
          <Heart size={18} className={canVote ? "text-[var(--lavender)]" : "text-[var(--text-muted)]"} />
          {post.likes}
        </Button>
        <ShareButton
          kind="post"
          id={post.id}
          agendaTitle={post.agendaTitle}
          username={post.username}
          copyKind={post.isWinner ? "win" : "post"}
          compact
        />
        {post.isWinner ? <span className="text-xs font-bold text-[var(--teal)]">Hourly winner</span> : null}
      </div>
    </article>
  );
}

export function MediaCarousel({
  urls,
  variant = "feed",
}: {
  urls: string[];
  variant?: "feed" | "full";
}) {
  const [index, setIndex] = useState(0);
  const current = urls[index] ?? "";
  return (
    <div
      className={cn(
        "relative mx-auto overflow-hidden bg-black",
        variant === "full"
          ? "flex max-h-[85dvh] w-full max-w-full items-center justify-center"
          : "aspect-[4/5] w-full max-h-[70dvh] max-w-[min(100%,calc(70dvh*0.8))]",
      )}
    >
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt=""
          className={cn(
            "max-w-full",
            variant === "full" ? "max-h-[85dvh] w-auto object-contain" : "h-full w-full object-cover",
          )}
        />
      ) : (
        <div className="flex h-full min-h-48 w-full items-center justify-center text-[var(--text-muted)]">No image</div>
      )}
      {urls.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-sm"
            onClick={() => setIndex((i) => (i === 0 ? urls.length - 1 : i - 1))}
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-sm"
            onClick={() => setIndex((i) => (i === urls.length - 1 ? 0 : i + 1))}
          >
            ›
          </button>
          <div className="absolute bottom-2 flex w-full justify-center gap-1">
            {urls.map((_, i) => (
              <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-white" : "bg-white/40")} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
