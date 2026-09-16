"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatTimeWindow } from "@/lib/format";
import { Avatar } from "@/components/ui";
import type { ChampionSlot, HourlyBucket } from "@/data/types";

export function HourChips({
  agendaId,
  buckets,
  currentBucketId,
}: {
  agendaId: string;
  buckets: HourlyBucket[];
  currentBucketId?: string;
}) {
  return (
    <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
      {buckets.map((bucket) => {
        const completed = bucket.status === "completed";
        const live = bucket.status === "active";
        const className = cn(
          "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
          live && "border-[var(--lavender)] text-[var(--lavender)]",
          completed && "border-[var(--card-border)] bg-[var(--card)] text-[var(--text-primary)]",
          !completed && !live && "border-transparent text-[var(--text-muted)]",
        );
        if (completed) {
          return (
            <Link key={bucket.id} href={`/agendas/${agendaId}/hours/${bucket.id}`} className={className}>
              H{bucket.bucketNumber}
            </Link>
          );
        }
        return (
          <span key={bucket.id} className={className}>
            {live && currentBucketId === bucket.id ? "Live" : `H${bucket.bucketNumber}`}
          </span>
        );
      })}
    </div>
  );
}

export function ChampionGrid({
  slots,
  agendaId,
}: {
  slots: ChampionSlot[];
  agendaId: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((slot) => {
        const media = (
          <div className="relative aspect-[4/5] bg-[var(--surface-elevated)]">
            {slot.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slot.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-[var(--text-muted)]">
                {slot.status === "upcoming" ? "Upcoming" : "Zero participation"}
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold">
              {slot.hourLabel}
            </span>
            <span
              className={cn(
                "absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold",
                slot.status === "live" && "bg-[var(--lavender-dark)]",
                slot.status === "completed" && "bg-[var(--bucket-green)] text-[var(--bucket-green-text)]",
                slot.status === "upcoming" && "bg-black/50 text-[var(--text-muted)]",
              )}
            >
              {slot.status}
            </span>
          </div>
        );

        return (
          <div key={slot.id} className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
            {slot.status === "completed" ? (
              <Link href={`/agendas/${agendaId}/hours/${slot.id}`}>{media}</Link>
            ) : (
              media
            )}
            <div className="flex items-center gap-2 p-3">
              {slot.username ? (
                <Link href={`/u/${slot.username}`} className="flex min-w-0 items-center gap-2">
                  <Avatar url={slot.userAvatarUrl} name={slot.username} size={28} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">@{slot.username}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {slot.votes != null ? `${slot.votes} votes` : formatTimeWindow(slot.startsAt, slot.endsAt)}
                    </p>
                  </div>
                </Link>
              ) : (
                <>
                  <Avatar url={slot.userAvatarUrl} name="?" size={28} />
                  <p className="text-sm font-semibold">—</p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
