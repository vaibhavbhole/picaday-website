"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, EmptyState, Field, Spinner } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { useSession } from "@/components/session-provider";
import { getRepos } from "@/data/browser";
import type { AppNotification } from "@/data/types";
import { formatRelative } from "@/lib/format";
import { toUserMessage } from "@/lib/errors";

export function NotificationsInbox() {
  const router = useRouter();
  const { refreshUnread } = useSession();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<{
    bucketId: string;
    title: string;
    description: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setItems(await getRepos().notifications.list());
      await refreshUnread();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <Spinner />;
  if (error && items.length === 0) return <EmptyState title="Could not load notifications" body={error} />;
  if (items.length === 0) return <EmptyState title="No notifications yet" />;

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {items.map((item) => (
        <div
          key={item.id}
          className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card)] text-left hover:border-[var(--lavender)]"
        >
          <button type="button" className="w-full p-4 text-left" onClick={() => void onOpen(item)}>
            <div className="flex gap-3">
              {item.winningPostUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.winningPostUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{item.title}</p>
                {item.body ? <p className="text-sm text-[var(--text-secondary)]">{item.body}</p> : null}
                {item.type === "profile_visits_daily" && item.profileVisitCount != null ? (
                  <p className="mt-1 text-sm font-semibold text-[var(--lavender)]">
                    {item.profileVisitCount} {item.profileVisitCount === 1 ? "visit" : "visits"} today
                  </p>
                ) : null}
                {item.proposalTitle ? (
                  <p className="mt-1 text-xs text-[var(--teal)]">Proposed: {item.proposalTitle}</p>
                ) : null}
                <p className="mt-1 text-xs text-[var(--text-muted)]">{formatRelative(item.createdAt)}</p>
                {item.canProposeAgenda ? (
                  <span className="mt-3 inline-flex rounded-xl bg-[var(--lavender)] px-3 py-2 text-xs font-extrabold text-[var(--background)]">
                    Propose tomorrow’s agenda
                  </span>
                ) : null}
              </div>
              {!item.isRead ? <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--orange)]" /> : null}
            </div>
          </button>
          {item.type === "hourly_winner" && item.bucketId ? (
            <div className="px-4 pb-3">
              <ShareButton kind="win" id={item.bucketId} compact />
            </div>
          ) : null}
        </div>
      ))}

      {proposal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <form
            className="w-full max-w-md space-y-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submitProposal();
            }}
          >
            <h2 className="text-xl font-extrabold">Propose tomorrow’s agenda</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Hourly winners can suggest the next day’s challenge.
            </p>
            <Field
              label="Agenda title"
              value={proposal.title}
              onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
              required
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Description (optional)</span>
              <textarea
                value={proposal.description}
                onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                className="min-h-24 w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-3 outline-none ring-[var(--lavender)] focus:ring-2"
                placeholder="Optional description"
              />
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <div className="flex gap-2">
              <Button disabled={submitting}>{submitting ? "Submitting…" : "Submit proposal"}</Button>
              <Button variant="ghost" type="button" onClick={() => setProposal(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );

  async function onOpen(item: AppNotification) {
    setError(null);
    if (!item.isRead) {
      try {
        await getRepos().notifications.markRead(item.id);
        setItems((current) => current.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)));
        await refreshUnread();
      } catch {
        // Keep the tap action even if mark-read fails.
      }
    }
    if (item.type === "profile_visits_daily") {
      router.push("/notifications/visitors");
      return;
    }
    if (item.canProposeAgenda && item.bucketId) {
      setProposal({ bucketId: item.bucketId, title: "", description: "" });
    }
  }

  async function submitProposal() {
    if (!proposal) return;
    setSubmitting(true);
    setError(null);
    try {
      await getRepos().notifications.submitAgendaProposal(proposal.bucketId, proposal.title, proposal.description);
      setProposal(null);
      await load();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  }
}
