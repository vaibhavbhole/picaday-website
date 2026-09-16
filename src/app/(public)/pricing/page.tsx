import Link from "next/link";
import { SITE } from "@/lib/site";
import { LegalDoc } from "@/components/legal-doc";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <LegalDoc title="Pricing">
      <p>
        New accounts on {SITE.name} start with a <strong className="text-[var(--text-primary)]">{SITE.trialDays}-day
        trial</strong>. During the trial you can post, vote, and propose agendas like a member.
      </p>
      <p>
        After the trial, browsing stays open. Posting, voting, and proposing tomorrow’s agenda require{" "}
        <strong className="text-[var(--text-primary)]">{SITE.planName}</strong>.
      </p>

      <h2>Inner Circle</h2>
      <ul>
        <li>Post daily on the live agenda (one post per agenda, up to 20 images).</li>
        <li>Vote in the live hourly bucket.</li>
        <li>If you win an hour, propose tomorrow’s agenda while that day is still active.</li>
      </ul>
      <p>
        Listed price: <strong className="text-[var(--text-primary)]">{SITE.priceInr} per month</strong>{" "}
        everywhere, billed monthly through <strong className="text-[var(--text-primary)]">{SITE.processor}</strong>.
        There is no separate US-dollar price for other countries.
      </p>
      <p>
        Subscribe, cancel, or request a refund through {SITE.processor} / by emailing{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. See the{" "}
        <Link href="/refunds">Refund and cancellation policy</Link> for details.
      </p>
    </LegalDoc>
  );
}
