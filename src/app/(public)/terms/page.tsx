import Link from "next/link";
import { SITE } from "@/lib/site";
import { LegalDoc } from "@/components/legal-doc";

export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <LegalDoc title="Terms & Conditions">
      <p>
        These terms govern your use of {SITE.name} at {SITE.domain} and related apps operated by{" "}
        {SITE.operator} (“we”, “us”). By creating an account or using the service, you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        {SITE.name} is a community where members post photos to a shared daily agenda, vote in hourly
        buckets, and (for hourly winners) propose future agendas. Features may change as we operate
        staging and production environments.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You must provide accurate details and keep your password confidential.</li>
        <li>Usernames are 3–24 characters: lowercase letters, numbers, or underscores.</li>
        <li>You are responsible for content you upload and for activity on your account.</li>
      </ul>

      <h2>Posts, votes, and conduct</h2>
      <ul>
        <li>One post per agenda; images should follow the in-app 4:5 crop.</li>
        <li>Do not post unlawful, abusive, infringing, or sexual content involving minors.</li>
        <li>Do not manipulate votes, impersonate others, or interfere with the service.</li>
        <li>We may remove content, restrict features, or close accounts that break these terms.</li>
      </ul>

      <h2>Membership</h2>
      <p>
        Signup includes a {SITE.trialDays}-day trial. Paid {SITE.planName} access is{" "}
        {SITE.priceInr} per month everywhere, billed through {SITE.processor}. Web browsing may remain
        available without a paid plan; posting and voting require trial or paid access. Details are on
        the <Link href="/pricing">pricing page</Link>.
      </p>

      <h2>Intellectual property</h2>
      <p>
        You keep rights in photos you post. You grant us a licence to host, display, and share them
        inside {SITE.name} (including feeds, profiles, winners, and share cards) so the product can
        function. Our name, logo, and product design remain ours.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The service is provided as available. Hourly winners, feeds, and uptime are not guaranteed.
        To the extent allowed by law, {SITE.operator} is not liable for indirect or consequential loss.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The “Last updated” date above will change when we do. Continued use
        after an update means you accept the revised terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions:{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. Also see{" "}
        <Link href="/contact">Contact</Link>, <Link href="/privacy">Privacy Policy</Link>, and{" "}
        <Link href="/refunds">Refunds</Link>.
      </p>
    </LegalDoc>
  );
}
