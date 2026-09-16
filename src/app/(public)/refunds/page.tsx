import Link from "next/link";
import { SITE } from "@/lib/site";
import { LegalDoc } from "@/components/legal-doc";

export const metadata = { title: "Refunds" };

export default function RefundsPage() {
  return (
    <LegalDoc title="Refund & Cancellation Policy">
      <p>
        This policy covers the {SITE.planName} subscription for {SITE.name} and the free trial on{" "}
        {SITE.domain}.
      </p>

      <h2>Free trial</h2>
      <p>
        New accounts receive a {SITE.trialDays}-day trial at no charge. The trial is not billed. When it
        ends, posting, voting, and agenda proposals lock until you subscribe. You can keep browsing.
        There is nothing to refund for an unused or expired trial.
      </p>

      <h2>How to subscribe</h2>
      <p>
        Paid membership is <strong className="text-[var(--text-primary)]">{SITE.priceInr} per month</strong>{" "}
        everywhere, billed as a monthly auto-renewing subscription through{" "}
        <strong className="text-[var(--text-primary)]">{SITE.processor}</strong>. Card and UPI details are
        collected by {SITE.processor}, not stored by us.
      </p>

      <h2>Cancellation</h2>
      <p>
        Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> from the address on your
        account and ask to cancel Inner Circle. Include your username. Cancellation stops the next
        renewal. You keep Inner Circle until the current paid period ends.
      </p>

      <h2>Refunds</h2>
      <ul>
        <li>
          For a charge you believe is wrong, email {SITE.supportEmail} within a reasonable time with
          your username, payment date, and {SITE.processor} transaction/reference ID.
        </li>
        <li>
          Approved refunds are processed back through {SITE.processor} to the original payment method.
          Bank timelines vary.
        </li>
        <li>
          After a successful refund, Inner Circle access may end when we receive confirmation that the
          payment is no longer active.
        </li>
      </ul>

      <h2>Need help?</h2>
      <p>
        Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. Also see{" "}
        <Link href="/pricing">Pricing</Link> and <Link href="/contact">Contact</Link>.
      </p>
    </LegalDoc>
  );
}
