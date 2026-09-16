import Link from "next/link";
import { Avatar } from "@/components/ui";
import type { SearchProfile } from "@/data/types";

export function PeopleList({
  people,
  meta,
}: {
  people: SearchProfile[];
  meta?: (person: SearchProfile) => string | null;
}) {
  return (
    <div className="space-y-2">
      {people.map((profile) => {
        const extra = meta?.(profile);
        return (
          <Link
            key={profile.id}
            href={`/u/${profile.username}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3"
          >
            <Avatar url={profile.avatarUrl} name={profile.displayName} />
            <div className="min-w-0">
              <p className="font-bold">{profile.displayName}</p>
              <p className="text-sm text-[var(--text-secondary)]">@{profile.username}</p>
              {extra ? <p className="text-xs text-[var(--text-muted)]">{extra}</p> : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function PeopleSearchInput({
  value,
  onChange,
  placeholder = "Search username or display name",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] px-3 py-3 outline-none ring-[var(--lavender)] focus:ring-2"
    />
  );
}
