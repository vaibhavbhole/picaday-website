import Link from "next/link";
import { SITE } from "@/lib/site";
import { LegalDoc } from "@/components/legal-doc";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy">
      <p>
        {SITE.operator} (“we”) operates {SITE.name} at {SITE.domain}. This policy explains what we
        collect and how we use it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account: email, username, password (hashed by our auth provider), display name, avatar.</li>
        <li>Profile extras you add, such as public social links.</li>
        <li>Content: posts, captions, votes, agenda proposals, and reports you submit.</li>
        <li>Usage: profile visits, notifications, and basic logs needed to run the app.</li>
        <li>
          Payments: {SITE.processor} collects card/UPI details to bill Inner Circle ({SITE.priceInr}
          /month). We receive payment status so we can unlock membership. We do not store your full
          card number.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To create your session, show feeds, winners, profiles, and share pages.</li>
        <li>To enforce one post per agenda, live-hour voting, and trial or paid access.</li>
        <li>To send transactional mail (for example password reset) and in-app notifications.</li>
        <li>To keep the service secure and to investigate abuse reports.</li>
      </ul>

      <h2>Who we share with</h2>
      <p>
        We use infrastructure providers to host the site, database, auth, and media (including
        Supabase). {SITE.processor} processes Inner Circle payments. We do not sell your personal
        information. Public profile fields, posts, and winners are visible to other signed-in members;
        share links you create may be viewable more widely.
      </p>

      <h2>Retention</h2>
      <p>
        We keep account and content data while your account exists, and as needed for security, backups,
        and legal requirements. You can ask us to delete your account by emailing{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Edit display name, avatar, and social links in your profile.</li>
        <li>Manage or cancel Inner Circle by emailing the support address above.</li>
        <li>Request access or deletion of your account data via the support email above.</li>
      </ul>

      <h2>Children</h2>
      <p>
        {SITE.name} is not directed at children under 13 (or the digital-consent age in your country).
        Do not create an account if you are under that age.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions: <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. See also{" "}
        <Link href="/contact">Contact</Link> and <Link href="/terms">Terms</Link>.
      </p>
    </LegalDoc>
  );
}
