import { BrandLogo } from "@/components/brand-logo";
import { SITE } from "@/lib/site";

export function LegalDoc({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-5">
      <BrandLogo size="sm" />
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Last updated {SITE.updated}</p>
      </div>
      <div className="space-y-4 text-[var(--text-secondary)] [&_a]:font-semibold [&_a]:text-[var(--lavender)] [&_h2]:pt-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-[var(--text-primary)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
