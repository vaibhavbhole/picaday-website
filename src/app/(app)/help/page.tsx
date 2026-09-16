import { BrandLogo } from "@/components/brand-logo";

export default function HelpPage() {
  return (
    <article className="space-y-4">
      <BrandLogo size="sm" />
      <h1 className="text-2xl font-extrabold">Help</h1>
      <ul className="list-disc space-y-2 pl-5 text-[var(--text-secondary)]">
        <li>One post per agenda, up to 20 images cropped to 4:5.</li>
        <li>Vote once per live hourly bucket. You can change that vote until the hour ends.</li>
        <li>Completed hours are read-only: open them from Home chips, Winners, or Explore.</li>
        <li>Hourly winners can propose the next agenda from Notifications while that agenda is still active.</li>
        <li>
          Membership details: <a href="/pricing" className="font-semibold text-[var(--lavender)]">Pricing</a>
          {" · "}
          <a href="/contact" className="font-semibold text-[var(--lavender)]">Contact</a>
        </li>
      </ul>
    </article>
  );
}
