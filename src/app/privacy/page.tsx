import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | VehicleGuard UK",
  description: "How VehicleGuard UK collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="How we handle your personal information under UK GDPR."
    >
      <h2>Who we are</h2>
      <p>
        VehicleGuard UK (&quot;we&quot;, &quot;us&quot;) provides MOT history lookups,
        vehicle garage management, and reminder services for UK drivers. This policy
        explains what data we collect and your rights over it.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address, password (stored hashed),
          and optional phone number for SMS reminders.
        </li>
        <li>
          <strong>Vehicle data:</strong> registration numbers, MOT/tax/service dates,
          notes, documents you upload, and data returned from official DVSA MOT APIs.
        </li>
        <li>
          <strong>Usage data:</strong> basic logs needed to operate the service (e.g.
          sign-in times, reminder delivery status).
        </li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To provide lookups, garage storage, and email/SMS reminders you request.</li>
        <li>To maintain your account and respond to support enquiries.</li>
        <li>To improve reliability and security of the platform.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data. We only share data with
        processors needed to run the service (e.g. hosting, email/SMS providers) under
        appropriate contracts.
      </p>

      <h2>Legal basis (UK GDPR)</h2>
      <ul>
        <li>
          <strong>Contract:</strong> processing needed to deliver the service you sign up for.
        </li>
        <li>
          <strong>Legitimate interests:</strong> fraud prevention, security, and service improvement.
        </li>
        <li>
          <strong>Consent:</strong> where required for optional features such as marketing (if offered).
        </li>
      </ul>

      <h2>Retention</h2>
      <p>
        We keep account and vehicle data while your account is active. If you delete your
        account, we remove or anonymise personal data within a reasonable period, except
        where we must retain records for legal or accounting reasons.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK data protection law you may request access, correction, deletion, restriction,
        or portability of your personal data, and object to certain processing. Contact us via
        the <Link href="/contact">Contact</Link> page. You may also complain to the ICO at{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
          ico.org.uk
        </a>
        .
      </p>

      <h2>Third-party services</h2>
      <p>
        MOT data comes from the official DVSA MOT History API. Tax status is not provided
        by DVSA; you may enter tax dates manually or use GOV.UK directly. See our{" "}
        <Link href="/cookies">Cookie Policy</Link> for information on cookies and similar
        technologies.
      </p>
    </LegalPageShell>
  );
}
