import { SITE } from "@/lib/site";
import { LegalDoc } from "@/components/legal-doc";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <LegalDoc title="Contact & support">
      <p>
        {SITE.name} is operated by {SITE.operator}. We are happy to help with accounts, content, and
        membership questions.
      </p>

      <h2>Email</h2>
      <p>
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
      </p>
      <p>
        Include your username. For billing, also include the {SITE.processor} transaction or reference
        ID.
      </p>

      <h2>Billing</h2>
      <p>
        Inner Circle is {SITE.priceInr} per month everywhere, processed by {SITE.processor}. To
        subscribe, cancel, or request a refund, email the support address above.
      </p>

      <h2>Website</h2>
      <p>
        <a href={SITE.url}>{SITE.domain}</a>
      </p>
    </LegalDoc>
  );
}
