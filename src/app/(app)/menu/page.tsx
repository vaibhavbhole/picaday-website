"use client";

import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui";

export default function MenuPage() {
  const { signOut, unreadCount } = useSession();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">Menu</h1>
      <Link className="flex items-center justify-between rounded-xl bg-[var(--card)] p-4" href="/notifications">
        <span>Notifications</span>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-[var(--orange)] px-2 py-0.5 text-xs font-extrabold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Link>
      <Link className="block rounded-xl bg-[var(--card)] p-4" href="/help">Help</Link>
      <Link className="block rounded-xl bg-[var(--card)] p-4" href="/about">About</Link>
      <Link className="block rounded-xl bg-[var(--card)] p-4" href="/pricing">Pricing</Link>
      <Link className="block rounded-xl bg-[var(--card)] p-4" href="/contact">Contact</Link>
      <Link className="block rounded-xl bg-[var(--card)] p-4" href="/terms">Terms</Link>
      <Link className="block rounded-xl bg-[var(--card)] p-4" href="/privacy">Privacy</Link>
      <Link className="block rounded-xl bg-[var(--card)] p-4" href="/refunds">Refunds</Link>
      <Button variant="ghost" onClick={() => void signOut()}>Sign out</Button>
    </div>
  );
}
