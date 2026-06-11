import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Contact | VehicleGuard UK",
  description: "Get in touch with VehicleGuard UK support.",
};

export default function ContactPage() {
  const supportEmail = process.env.ADMIN_EMAIL || "support@vehicleguard.uk";

  return (
    <LegalPageShell
      title="Contact"
      description="Support, privacy requests, and general enquiries."
    >
      <h2>Support</h2>
      <p>
        For help with your account, reminders, or vehicle data, email us at{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. We aim to respond within a few
        working days.
      </p>

      <h2>Account settings</h2>
      <p>
        Signed-in users can manage email/SMS reminders, phone verification, and subscription
        options from <Link href="/settings">Settings</Link>.
      </p>

      <h2>Privacy and data requests</h2>
      <p>
        To exercise your data protection rights (access, deletion, correction), email{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a> from the address linked to your
        account. See our <Link href="/privacy">Privacy Policy</Link> for details.
      </p>

      <h2>Official vehicle checks</h2>
      <p>
        VehicleGuard UK is not affiliated with DVSA or DVLA. For official MOT and tax status,
        use{" "}
        <a
          href="https://www.gov.uk/check-mot-history"
          target="_blank"
          rel="noopener noreferrer"
        >
          GOV.UK MOT history
        </a>{" "}
        and{" "}
        <a
          href="https://www.gov.uk/check-vehicle-tax"
          target="_blank"
          rel="noopener noreferrer"
        >
          GOV.UK vehicle tax
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
