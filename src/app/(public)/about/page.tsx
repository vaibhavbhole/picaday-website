import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SITE } from "@/lib/site";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article className="space-y-6">
      <BrandLogo size="md" />
      <div>
        <h1 className="text-3xl font-extrabold">One shared agenda. Twenty-four hours.</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          {SITE.name} is a daily photography community on {SITE.domain}. Everyone posts and votes on
          the same prompt. Each hour crowns a champion. Those winners help choose tomorrow’s agenda.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-extrabold">How a day works</h2>
        <ul className="list-disc space-y-2 pl-5 text-[var(--text-secondary)]">
          <li>A live agenda runs for 24 hours and is split into 24 hourly buckets.</li>
          <li>You get one post per agenda, with up to 20 images cropped to 4:5.</li>
          <li>During a live hour you can vote once, and you can change that vote until the hour ends.</li>
          <li>Completed hours stay readable: winner, time window, and that hour’s posts only. No late votes.</li>
          <li>Hourly winners can propose the next day’s agenda while that agenda is still active.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-extrabold">On the web</h2>
        <p className="text-[var(--text-secondary)]">
          Sign in to browse Home, Winners, Explore (past agendas), Search, and profiles. Posting,
          voting, and proposing agendas need an active trial or Inner Circle membership.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/signup" className="rounded-xl bg-[var(--lavender-dark)] px-4 py-2.5 text-sm font-semibold text-white">
          Start a {SITE.trialDays}-day trial
        </Link>
        <Link href="/pricing" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--lavender)]">
          See pricing
        </Link>
      </div>
    </article>
  );
}
