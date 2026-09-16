"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  Compass,
  Crown,
  Home,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { Avatar, Button } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { useTheme } from "@/components/theme-provider";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/winners", label: "Winners", icon: Crown },
  { href: "/submit", label: "Submit", icon: Plus },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, unreadCount, refreshUnread } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const wide = pathname.startsWith("/profile") || pathname.startsWith("/u/");
  const [menuOpen, setMenuOpen] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void refreshUnread();
  }, [pathname, refreshUnread]);

  useEffect(() => {
    setCanGoBack(recordInAppPath(pathname));
  }, [pathname]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  function goBack() {
    if (!canGoBack) return;
    router.back();
  }

  return (
    <div className="flex min-h-full min-w-0 bg-[var(--background)]">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-[var(--card-border)] bg-[var(--surface)] p-4 md:flex">
        <Link href="/" className="mb-6 px-1" aria-label="picaday.vote home">
          <BrandLogo size="md" />
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--nav-inactive)] hover:bg-[var(--surface-elevated)]",
                isActive(pathname, item.href) && "bg-[var(--surface-elevated)] text-[var(--lavender)]",
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
          <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]" href="/notifications">
            <UnreadBadge count={unreadCount}>
              <Bell size={18} />
            </UnreadBadge>
            Notifications
          </Link>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[var(--card-border)] bg-[var(--surface)]/95 px-3 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-1">
            {canGoBack ? (
              <Button variant="ghost" className="px-2" onClick={goBack} aria-label="Back">
                <ChevronLeft size={22} />
              </Button>
            ) : null}
            <Link href="/" className="min-w-0" aria-label="picaday.vote home">
              <BrandLogo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative" ref={menuRef}>
              <Button variant="ghost" className="px-2" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu">
                <Menu size={20} />
              </Button>
              {menuOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] py-1 shadow-lg">
                  <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Appearance
                  </p>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold hover:bg-[var(--card)]"
                    onClick={() => setTheme("light")}
                  >
                    <Sun size={14} /> Light
                    {theme === "light" ? <Check size={14} className="ml-auto text-[var(--lavender)]" /> : null}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold hover:bg-[var(--card)]"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon size={14} /> Dark
                    {theme === "dark" ? <Check size={14} className="ml-auto text-[var(--lavender)]" /> : null}
                  </button>
                  <div className="my-1 border-t border-[var(--card-border)]" />
                  <Link
                    href="/help"
                    className="block px-4 py-2 text-sm font-semibold hover:bg-[var(--card)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Help
                  </Link>
                  <Link
                    href="/about"
                    className="block px-4 py-2 text-sm font-semibold hover:bg-[var(--card)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/pricing"
                    className="block px-4 py-2 text-sm font-semibold hover:bg-[var(--card)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/contact"
                    className="block px-4 py-2 text-sm font-semibold hover:bg-[var(--card)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Contact
                  </Link>
                  <div className="my-1 border-t border-[var(--card-border)]" />
                  <Link
                    href="/terms"
                    className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--card)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Terms
                  </Link>
                  <Link
                    href="/privacy"
                    className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--card)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/refunds"
                    className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--card)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Refunds
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold hover:bg-[var(--card)]"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              className="px-2"
              onClick={() => router.push("/notifications")}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            >
              <UnreadBadge count={unreadCount}>
                <Bell size={20} />
              </UnreadBadge>
            </Button>
            <Link href="/profile">
              <Avatar url={user?.photoUrl} name={user?.username ?? "you"} size={36} />
            </Link>
          </div>
        </header>
        <main
          className={cn(
            "mx-auto w-full min-w-0 flex-1 px-3 pb-24 pt-4 md:px-0 md:pb-8",
            wide ? "max-w-6xl lg:px-4" : "max-w-[420px]",
          )}
        >
          {children}
        </main>
        <div className="mx-auto w-full max-w-[420px] md:pb-0">
          <SiteFooter />
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-[var(--card-border)] bg-[var(--surface)] px-1 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-[10px] font-semibold text-[var(--nav-inactive)]",
                isActive(pathname, item.href) && "text-[var(--lavender)]",
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

const HISTORY_KEY = "picaday-in-app-history";

function readHistory(): string[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function recordInAppPath(pathname: string): boolean {
  const stack = readHistory();
  if (stack.length === 0) {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify([pathname]));
    return false;
  }
  if (stack[stack.length - 1] === pathname) return stack.length > 1;
  if (stack.length > 1 && stack[stack.length - 2] === pathname) {
    stack.pop();
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(stack));
    return stack.length > 1;
  }
  stack.push(pathname);
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(stack));
  return true;
}

function UnreadBadge({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex">
      {children}
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-[var(--orange)] px-1 text-center text-[10px] font-extrabold leading-4 text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </span>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
