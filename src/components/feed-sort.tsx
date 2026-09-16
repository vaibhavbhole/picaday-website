"use client";

import type { FeedSort } from "@/data/pagination";

export function FeedSortControl({
  value,
  onChange,
}: {
  value: FeedSort;
  onChange: (value: FeedSort) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm">
      <span className="font-semibold text-[var(--text-secondary)]">Sort</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as FeedSort)}
        className="rounded-lg bg-[var(--surface-elevated)] px-2 py-1 font-semibold outline-none"
      >
        <option value="latest">Latest</option>
        <option value="liked">Most liked</option>
      </select>
    </label>
  );
}
