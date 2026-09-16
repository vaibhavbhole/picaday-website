"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

export function CountdownPill({ endsAt, label }: { endsAt: Date; label: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = formatCountdown(endsAt.getTime() - now);
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-[var(--lavender)]">{remaining}</p>
    </div>
  );
}

export function BucketChip({
  index,
  total,
  endsAt,
}: {
  index: number;
  total: number;
  endsAt: Date;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const msLeft = Math.max(0, endsAt.getTime() - now);
  const minutes = Math.ceil(msLeft / 60000);
  const progress = Math.min(1, Math.max(0, 1 - msLeft / 3_600_000));
  return (
    <div className="rounded-2xl bg-[var(--bucket-green)] px-4 py-3 text-[var(--bucket-green-text)]">
      <p className="text-sm font-bold">
        Hour {index}/{total} · {minutes}m left
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--overlay-track)]">
        <div className="h-full rounded-full bg-[var(--bucket-green-text)]" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
