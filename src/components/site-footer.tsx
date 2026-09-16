import Link from "next/link";
import { LEGAL_NAV, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--card-border)] px-4 py-8 text-sm text-[var(--text-secondary)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE.operator}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGAL_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[var(--lavender)]">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
