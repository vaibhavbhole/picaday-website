import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "PicADay.Vote",
    template: "%s · PicADay.Vote",
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--card-border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur">
        <Link href="/about" className="min-w-0">
          <BrandLogo size="sm" />
        </Link>
        <nav className="flex shrink-0 items-center gap-3 text-sm font-semibold">
          <Link href="/pricing" className="hidden text-[var(--text-secondary)] hover:text-[var(--lavender)] sm:inline">
            Pricing
          </Link>
          <Link href="/contact" className="hidden text-[var(--text-secondary)] hover:text-[var(--lavender)] sm:inline">
            Contact
          </Link>
          <Link href="/login" className="text-[var(--lavender)]">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-[var(--lavender-dark)] px-3 py-2 text-white"
          >
            Join
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
